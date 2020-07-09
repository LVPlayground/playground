// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SAMPCACEventObserver } from 'components/events/sampcac_event_observer.js';

// Monitors incoming events from SAMPCAC and deals with them appropriately. Is fed events from the
// DeferredEventManager, as none of them are either time-critical or cancelable.
export class EventMonitor extends SAMPCACEventObserver {
    constructor() {
        super();

        server.deferredEventManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // SAMPCACEventObserver implementation:
    // ---------------------------------------------------------------------------------------------

    // TODO...

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.deferredEventManager.removeObserver(this);
    }
}
