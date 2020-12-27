// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SAMPCACNatives } from 'features/sampcac/sampcac_natives.js';

// Native functions associated with SAMPCAC, mocked out for testing purposes.
export class MockSAMPCACNatives extends SAMPCACNatives {
    #glitches_ = new Map();
    #options_ = new Map();
    #players_ = new WeakMap();

    // Sets the status for |player| to the given |status|, which should be an instance of the
    // MockSAMPCACStatus class exported by this file.
    setStatusForTesting(player, status) { this.#players_.set(player, status); }

    getClientVersion(player) {
        if (this.#players_.has(player))
            return [ 0, 10, 0 ];
        
        return [ 0, 0, 0 ];
    }

    getServerVersion() { return [ 0, 10, 0 ]; }
    getHardwareID(player) {
        if (this.#players_.has(player))
            return 'kJzsJJ39Fhgjn8ZK9j4WwDImjY2q2hN6bl0lB+KWpqDqgjAo';
        
        return '';
    }

    readMemory(player, address, size) {
        const status = this.#players_.get(player);
        if (status && status.hasMemory(address)) {
            dispatchEvent('cac_onmemoryread', {
                player_id: player.id,
                address: address,
                content: status.readMemory(address),
            });
        }
    }

    readMemoryChecksum(player, address, size) {
        const status = this.#players_.get(player);
        if (status && status.hasMemoryChecksum(address)) {
            dispatchEvent('playerchecksumavailable', {
                playerid: player.id,
                address: address,
                checksum: status.readMemoryChecksum(address),
            });
        }
    }

    setGlitchStatus(glitch, status) { this.#glitches_.set(glitch, status); }
    setGlitchStatusForPlayer(player, glitch, status) {}
    getGlitchStatus(glitch) { return this.#glitches_.get(glitch) ?? 0; }

    setGameOption(option, enabled) { this.#options_.set(option, enabled); }
    setGameOptionForPlayer(player, option, enabled) {}
    getGameOption(option) { return this.#options_.get(option) ?? 0; }

    setGameResourceReportStatus(modelType, status) {}
    getGameResourceReportStatus(modelType) {}
    setGameResourceReportType(reportType) {}
    getGameResourceReportType() {}
    setGameResourceReportTypeForPlayer(player, modelType, reportType) {}
}

// Describes the SAMPCAC status for a particular player. Can be activated by calling the
// `setStatusForTesting` method on the mocked SAMPCACNatives object.
export class MockSAMPCACStatus {
    #bytes_ = new Map();
    #checksums_ = new Map();

    hasMemory(address) { return this.#bytes_.has(address); }
    readMemory(address) { return this.#bytes_.get(address) ?? null; }
    writeMemory(address, data) { this.#bytes_.set(address, data); }

    hasMemoryChecksum(address) { return this.#checksums_.has(address); }
    readMemoryChecksum(address) { return this.#checksums_.get(address) ?? null; }
    writeMemoryChecksum(address, data) { this.#checksums_.set(address, data); }
}
