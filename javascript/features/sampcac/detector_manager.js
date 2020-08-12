// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Detector } from 'features/sampcac/detector.js';
import { DetectorResults } from 'features/sampcac/detector_results.js';

import { equals } from 'base/equals.js';

// Address from which we obtain the player's uptime.
const kAddressPlayerUptime = 0x42983D;

// Number of milliseconds to wait after a player connects before running automatic scans.
export const kAutomaticDetectionDelayMs = 10000;

// File (not checked in) in which detectors are located. Not required.
const kDetectorConfiguration = 'detectors.json';

// Time after which we consider a memory read to have timed out.
export const kMemoryReadTimeoutMs = 3500;

// Manages the SAMPCAC detectors that are available on the server. Will load its information from
// a configuration file, unless tests are active, in which case they can be injected.
export class DetectorManager {
    announce_ = null;
    natives_ = null;

    cleo_ = null;
    detectors_ = null;
    disposed_ = false;
    responseResolvers_ = null;

    constructor(announce, natives) {
        this.announce_ = announce;
        this.cleo_ = new WeakSet();
        this.detectors_ = null;
        this.natives_ = natives;
        this.responseResolvers_ = new Map();

        // Automatically initialize the detectors if we're not running tests.
        if (!server.isTest())
            this.initializeDetectors();

        server.playerManager.addObserver(this);
    }

    // Initializes the detectors from scratch. Will be lazily called the first time a detection run
    // is started for a particular player, or the detectors are being reloaded by management.
    initializeDetectors() {
        this.detectors_ = new Set();

        let configuration = null;
        try {
            configuration = JSON.parse(readFile(kDetectorConfiguration));
        } catch {
            return;  // bail out, the file does not exist
        }

        if (!Array.isArray(configuration))
            throw new Error(`Expected the detector configuration to be an array.`);

        for (const detectorConfiguration of configuration)
            this.detectors_.add(new Detector(detectorConfiguration));
    }

    // Marks the given |player| as having CLEO.asi installed. This is communicated with us through
    // a cheat detection, even though we want to allow it for non-behavioural modifications.
    reportPlayerHasInstalledCleo(player) { this.cleo_.add(player); }

    // ---------------------------------------------------------------------------------------------

    // Runs the necessary checks on the given |player|, and returns an instance of DetectorResults
    // to communicate back the |player|'s state. Could take multiple seconds.
    async detect(player) {
        if (this.detectors_ === null)
            this.initializeDetectors();

        const results = new DetectorResults();

        // (1) Populate the meta-data fields of the results.
        results.player = player;
        results.version = player.version;

        // Append "-R1" to distinguish from R2, R3 and R4, which do include the revision.
        if (!results.version.includes('R'))
            results.version += '-R1';

        if (this.natives_.getStatus(player)) {
            results.sampcacVersion = this.natives_.getClientVersion(player).join('.');
            results.sampcacHardwareId = this.natives_.getHardwareID(player);
        }

        results.minimized = player.isMinimized();

        // (2) Run each of the detectors for the |player| in parallel and populate the results in
        // the |results.detectors| map. There is no expectation for that map to be sorted.
        results.detectors = new Map();

        const tasks = [];

        // (a) Query the |player|'s uptime as a task.
        tasks.push(this.requestUptime(player).then(result => results.uptime = result / 1000));

        // (b) Query each of the detectors individually for the |player|.
        for (const detector of this.detectors_) {
            tasks.push(this.requestDetection(player, detector).then(result => {
                if (result !== DetectorResults.kResultUnavailable)
                    results.supported = true;

                results.detectors.set(detector.name, result);
            }));
        }

        // Wait for all the |tasks| to have been completed.
        await Promise.all(tasks);

        // If the |player| has SAMPCAC installed, further mark whether they've also been flagged as
        // a CLEO user. This is communicated outside of the general reporting mechanism.
        if (results.sampcacVersion !== null) {
            results.detectors.set(
                'CLEO.asi', this.cleo_.has(player) ? DetectorResults.kResultDetected
                                                   : DetectorResults.kResultClean);
        }

        // (3) Return the |results| to the caller who requested this detection run.
        return results;
    }

    // Requests the |detector| to run for the given |player|. Will return the result of the request
    // as one of the DetectorResult.kResult* constants.
    async requestDetection(player, detector) {
        const response = await this.requestMemoryRead(player, detector.address, detector.bytes);
        if (response === null)
            return DetectorResults.kResultUnavailable;

        // (1) Determine whether the |response| is a checksum (true) or an array of bytes (false).
        const isChecksum = typeof response === 'number';

        // (2) Consider the |response| based on the type of |detector| we're dealing with.
        switch (detector.type) {
            case Detector.kTypeAllowList:
                if (isChecksum && detector.resultChecksum === response)
                    return DetectorResults.kResultClean;
                else if (isChecksum && detector.resultChecksum !== null)
                    return DetectorResults.kResultDetected;

                if (!isChecksum && equals(detector.resultBytes, response))
                    return DetectorResults.kResultClean;
                else if (!isChecksum && detector.resultBytes !== null)
                    return DetectorResults.kResultDetected;

                break;

            case Detector.kTypeBlockList:
                if (isChecksum && detector.resultChecksum === response)
                    return DetectorResults.kResultDetected;
                else if (isChecksum && detector.resultChecksum !== null)
                    return DetectorResults.kResultClean;

                if (!isChecksum && equals(detector.resultBytes, response))
                    return DetectorResults.kResultDetected;
                else if (!isChecksum && detector.resultBytes !== null)
                    return DetectorResults.kResultClean;

                break;
        }

        return DetectorResults.kResultUndeterminable;
    }

    // ---------------------------------------------------------------------------------------------

    // Requests the uptime of the |player|'s computer, in seconds. Does a SAMPCAC-based memory read,
    // and waits for the result to come back from the player's machine.
    async requestUptime(player) {
        return await this.requestMemoryRead(player, kAddressPlayerUptime, 4, 72);
    }

    // Requests a memory read from the |player| at the given |address| (in GTA_SA.exe address space)
    // for the given number of |bytes|. Returns either a number, a Uint8Array, or NULL When failed.
    async requestMemoryRead(player, address, bytes, type = 5) {
        if (!this.responseResolvers_.has(player))
            this.responseResolvers_.set(player, new Map());

        const resolvers = this.responseResolvers_.get(player);
        const request = resolvers.get(address);

        // If |request| is already live, then another request for the |address| is in flight. We
        // piggy back on that request rather than issuing a new one here.
        if (request) return request.promise;

        // Create a unique |token| to avoid race conditions in subsequent requests.
        let token = Symbol('resolver token');
        let resolver = null;

        const promise = new Promise(async (resolve) => {
            resolver = resolve;

            // Wait for the configured |kMemoryReadTimeoutMs|, after which we'll resolve the request
            // with NULL, as the |player| has not provided us with an answer.
            await wait(kMemoryReadTimeoutMs);

            // Verify that the |token| is still actual to avoid overriding another request.
            if (resolvers.has(address) && resolvers.get(address).token === token)
                resolvers.get(address).resolver(/* result= */ null);
        });

        resolvers.set(address, { promise, resolver, token });

        // Request a checksum for GTA_SA.exe's .text section as the contents are well known, so we
        // don't need the granularity and can reduce the data being transfered.
        if (type !== 72)
            this.natives_.readMemory(player, address, bytes);

        this.natives_.readMemoryChecksum(player, address, bytes, type);

        const result = await promise;

        // Delete the |address| request from the resolvers, and clean up the entire map in cache
        // when there are no further requests in flight for the |player|.
        resolvers.delete(address);

        if (!resolvers.size)
            this.responseResolvers_.delete(player);

        // Now simply return the |result|, and we're done.
        return result;
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |player| has connected to the server. We have the ability to run
    // certain detectors automatically when we've got sufficient confidence in them.
    onPlayerConnect(player) {
        if (!this.detectors_)
            return;  // the system hasn't been initialized yet

        const detectors = [];

        // (1) Collate all the detectors that should automatically run.
        for (const detector of this.detectors_) {
            if (detector.automatic)
                detectors.push(detector);
        }

        if (!detectors.length)
            return;  // none should be ran, bail out

        // (2) Run the detectors after waiting for the |kAutomaticDetectionDelayMs| delay.
        wait(kAutomaticDetectionDelayMs).then(() => {
            if (this.disposed_ || !player.isConnected())
                return;  // cancel the scan

            // (3) Run the actual detectors, and if any come back positive, immediately inform the
            // in-game administrators of the |player| using the given |detector|.
            for (const detector of detectors) {
                this.requestDetection(player, detector).then(result => {
                    if (result !== DetectorResults.kResultDetected)
                        return;

                    this.announce_().announceToAdministrators(
                        Message.SAMPCAC_ADMIN_DETECTOR_HIT, player.name, player.id, detector.name);
                });
            }
        });
    }

    // Called when the |response| has been received from the |player|, following a read request for
    // the given |address|. When known, the Promise waiting for the response will be settled.
    onMemoryResponse(player, address, response) {
        if (!this.responseResolvers_.has(player))
            return;  // the |player| does not have any pending requests

        const resolvers = this.responseResolvers_.get(player);
        if (!resolvers.has(address)) {
            if (!resolvers.has(kAddressPlayerUptime))
                return;  // the |player| does not have any pending requests for the |address|

            response = address;
            address = kAddressPlayerUptime;
        }

        // Resolve the appropriate resolver with the |response|.
        resolvers.get(address).resolver(response);
    }

    // Called when the |player| is disconnecting from the server. Any in-flight memory requests will
    // immediately be cancelled, as we won't be receiving a response anymore.
    onPlayerDisconnect(player) {
        if (this.responseResolvers_.has(player)) {
            for (const { resolver } of this.responseResolvers_.get(player).values())
                resolver(/* response= */ null);

            this.responseResolvers_.delete(player);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        this.responseResolvers_.clear();
        this.disposed_ = true;
    }
}
