// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Abuse from 'features/abuse/abuse.js';

// Allow list for macro detection keys that we'll ignore. Quite a few of the function keys are
// inccorectly being detected as marcos by SAMPCAC.
const kMacroAllowList = new Set([
    /* VK_RETURN= */ 13,
    /* VK_NUMLOCK= */ 144,
    /* VK_SCROLL= */ 145,
    /* VK_VOLUME_MUTE= */ 173,
    /* VK_VOLUME_DOWN= */ 174,
    /* VK_VOLUME_UP= */ 175,
    /* VK_MEDIA_NEXT_TRACK= */ 176,
    /* VK_MEDIA_PREV_TRACK= */ 177,
    /* VK_MEDIA_STOP= */ 178,
    /* VK_MEDIA_PLAY_PAUSE= */ 179,
]);

// Rate limit on detection reports. Some come in at a super high frequency (e.g. once per shot),
// which is not something we want to bother administrators with.
export const kReportRateLimitMs = 10 * 1000;

// The monitor is responsible for taking raw events and transforming them into something that can be
// announced to administrators. On top of that, it is responsible for filtering out false positives.
export class DetectorMonitor {
    // Type of detection that has been made. Generalized from the SAMPCAC types, including our own.
    static kTypeAimbot = 'Aimbot';
    static kTypeExtrasensoryPerception = 'Extrasensory perception';
    static kTypeFakePing = 'Fake ping';
    static kTypeMacro = 'Macro';
    static kTypeNoRecoil = 'No recoil';
    static kTypeTriggerBot = 'Trigger bot';
    static kTypeUntrustedLibrary = 'Untrusted library';
    static kTypeWeaponData = 'Modified weapon data';

    #abuse_ = null;
    #natives_ = null;

    // WeakMap of Player instance to a Map of type => last report time in milliseconds.
    #rateLimits_ = null;

    constructor(abuse, natives) {
        this.#abuse_ = abuse;
        this.#natives_ = natives;
        this.#rateLimits_ = new WeakMap();
    }

    // ---------------------------------------------------------------------------------------------

    // Issues a generic report directly to the Abuse feature. Adds SAMPCAC information on top, as
    // the given |player| most likely is a SAMPCAC user.
    issueReport(player, type, certainty, evidence = {}) {
        // (1) Amend the given |evidence| with common SAMPCAC fields.
        evidence.sampcac = {
            clientVersion: this.#natives_.getClientVersion(player),
            serverVersion: this.#natives_.getServerVersion(),
            hardwareId: this.#natives_.getHardwareID(player),
        };

        // (2) Issue the abuse report with the responsible feature.
        this.#abuse_().reportAbuse(player, `${type} (SAMPCAC)`, certainty, evidence);
    }

    // ---------------------------------------------------------------------------------------------

    // Reports that the |player| has been found to use an aimbot with the given |variant|, one of
    // SAMPCAC's cheat detection constants.
    reportAimbot(player, variant) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeAimbot))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeAimbot, Abuse.kSuspected, {
            variant,  // aimbot variant the |player| was detected with, there are six
        });
    }

    // Reports that the |player| has been found to be using extrasensory perception (ESP), more
    // commonly known as someone who has disabled line-of-sight limitations.
    reportExtrasensoryPerception(player, variant) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeExtrasensoryPerception))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeExtrasensoryPerception, Abuse.kSuspected, {
            variant,  // ESP variant the |player| was detected with, there are two
        });
    }

    // Reports that the |player| has been found to be using a fake ping value, which might be to
    // introduce lag which gives them an unfair advantage particularly in lag-shot matches.
    reportFakePing(player) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeFakePing))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeFakePing, Abuse.kSuspected);
    }

    // Reports that the |player| has executed a macro with the |keyId|, which is one of the common
    // virtual key codes: http://cherrytree.at/misc/vk.htm
    reportMacro(player, keyId) {
        if (kMacroAllowList.has(keyId))
            return;  // the |keyId| has been allowed due to frequent innocent reports

        if (this.isRateLimited(player, DetectorMonitor.kTypeMacro))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeMacro, Abuse.kFunnyFeeling, {
            keyId,  // the virtual key code that the macro was issued with
        });
    }

    // Reports that the |player| has been detected for no-recoil usage, which enables them to fight
    // with less breaks in between. The |variant| is indicative of the exact tool used.
    reportNoRecoil(player, variant) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeNoRecoil))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeNoRecoil, Abuse.kSuspected, {
            variant,  // no-recoil variant the |player| was detected with, there are three
        });
    }

    // Reports that the |player| has been found to use a trigger bot, which will automatically fire
    // on their behalf taking away their need to manually shoot other players.
    reportTriggerBot(player, variant) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeTriggerBot))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeTriggerBot, Abuse.kSuspected, {
            variant,  // trigger bot variant the |player| was detected with, there are two
        });
    }

    // Reports that the |player| has been found to have loaded an untrusted library. There are four
    // that SAMPCAC detects, and I honestly have no idea what they mean.
    reportUntrustedLibrary(player, variant) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeUntrustedLibrary))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeUntrustedLibrary, Abuse.kFunnyFeeling, {
            variant,  // untrusted library variant the |player| was detected with, there are four
        });
    }

    // Reports that the |player| has modified their weapons.dat file, also known as what many people
    // report as being "damage.cs", but without any complicated tool to help them.
    reportWeaponDataModified(player) {
        if (this.isRateLimited(player, DetectorMonitor.kTypeWeaponData))
            return;  // the report will be rate limited

        this.issueReport(player, DetectorMonitor.kTypeWeaponData, Abuse.kDetected);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether a report for the given |player| in the given |type| should be ignored because
    // it's been rate limited. Will automatically keep track of rate limits otherwise.
    isRateLimited(player, type) {
        if (!this.#rateLimits_.has(player))
            this.#rateLimits_.set(player, new Map());

        const currentTime = server.clock.monotonicallyIncreasingTime();
        const rateLimitMap = this.#rateLimits_.get(player);

        if (rateLimitMap.has(type)) {
            const difference = currentTime - rateLimitMap.get(type);
            if (difference < kReportRateLimitMs)
                return true;
        }

        rateLimitMap.set(type, currentTime);
        return false;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#abuse_ = null;
        this.#rateLimits_ = null;
    }
}
