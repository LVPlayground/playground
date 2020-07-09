// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeferredEventManager } from 'components/events/deferred_event_manager.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// Mock implementation of the DeferredEventManager that has a similar interface, but is powered
// through events fired through `dispatchEvent()` rather than the server's own deferred system.
export class MockDeferredEventManager extends DeferredEventManager {
    callbacks_ = null;

    constructor() {
        super();

        const kCallbacks = [
            { event: 'cac_oncheatdetect', type: 'CAC_OnCheatDetect' },
            { event: 'cac_ongameresourcemismatch', type: 'CAC_OnGameResourceMismatch' },
            { event: 'cac_onmemoryread', type: 'CAC_OnMemoryRead' },
            { event: 'cac_onplayerkick', type: 'CAC_OnPlayerKick' },
            { event: 'cac_onscreenshottaken', type: 'CAC_OnScreenshotTaken' },
            { event: 'playerresolveddeath', type: 'OnPlayerResolvedDeath' },
            { event: 'playertakedamage', type: 'OnPlayerTakeDamage' },
            { event: 'playerweaponshot', type: 'OnPlayerWeaponShot' },
        ];

        this.callbacks_ = new ScopedCallbacks();
        for (const { event, type } of kCallbacks) {
            this.callbacks_.addEventListener(
                event, MockDeferredEventManager.prototype.handleSingleEvent.bind(this, type));
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        super.dispose();
    }
}
