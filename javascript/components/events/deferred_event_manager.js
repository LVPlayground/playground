// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';

// Every how many milliseconds should pending deferred events be read from the server.
const kDeferredEventReadIntervalMs = 50;  // 20Hz, 10% of server fps

// Responsible for pulling dispatched events from the PlaygroundJS plugin, and delivering those to
// parts of the gamemode instead. This acts as a severe performance improvement, as it allows the
// JavaScript to run in completely optimized mode without a series of adapters.
export class DeferredEventManager {
    disposed_ = false;
    observers_ = new Set();

    // ---------------------------------------------------------------------------------------------

    // Method that spins indefinitely for the lifetime of the server. Reads events from the plugin's
    // queue and delivers this to the appropriate parts of the gamemode.
    async deferredEventDispatcher() {
        await wait(kDeferredEventReadIntervalMs);

        while (!this.disposed_) {
            const events = getDeferredEvents();
            for (const { type, event } of events) {
                switch (type) {
                    case 'OnDynamicObjectMoved':
                        server.objectManager.onObjectMoved(event);
                        break;
                    
                    case 'OnPlayerResolvedDeath':
                        for (const observer of this.observers_)
                            observer.onPlayerDeath(event);

                        break;

                    case 'OnPlayerEditDynamicObject':
                        server.objectManager.onObjectEdited(event);
                        break;

                    case 'OnPlayerEnterDynamicArea':
                        server.areaManager.onPlayerEnterArea(event);
                        break;
                    
                    case 'OnPlayerLeaveDynamicArea':
                        server.areaManager.onPlayerLeaveArea(event);
                        break;
                    
                    case 'OnPlayerPickUpDynamicPickup':
                        server.pickupManager.onPickupPickedUp(event);
                        break;
                    
                    case 'OnPlayerSelectDynamicObject':
                        server.playerManager.onPlayerSelectObject(event);
                        break;
                    
                    case 'OnPlayerShootDynamicObject':
                        server.objectManager.onPlayerShootObject(event);
                        break;

                    default:
                        console.log(`Warning: unhandled deferred event "${type}".`);
                        break;
                }
            }

            await wait(kDeferredEventReadIntervalMs);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the given |observer| to those receiving player events.
    addObserver(observer) {
        if (!(observer instanceof PlayerEventObserver))
            throw new Error(`The given observer (${observer}) must inherit PlayerEventObserver.`);
        
        this.observers_.add(observer);
    }

    // Removes the given |observer| from those receiving player events.
    removeObserver(observer) {
        if (!(observer instanceof PlayerEventObserver))
            throw new Error(`The given observer (${observer}) must inherit PlayerEventObserver.`);
        
        this.observers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;
    }
}
