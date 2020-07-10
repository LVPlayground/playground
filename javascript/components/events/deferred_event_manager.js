// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerEventObserver } from 'components/events/player_event_observer.js';
import { SAMPCACEventObserver } from 'components/events/sampcac_event_observer.js';
import { Vector } from 'base/vector.js';

// Every how many milliseconds should pending deferred events be read from the server.
const kDeferredEventReadIntervalMs = 40;  // 25Hz

// Responsible for pulling dispatched events from the PlaygroundJS plugin, and delivering those to
// parts of the gamemode instead. This acts as a severe performance improvement, as it allows the
// JavaScript to run in completely optimized mode without a series of adapters.
export class DeferredEventManager {
    disposed_ = false;

    playerObservers_ = new Set();
    sampcacObservers_ = new Set();

    // ---------------------------------------------------------------------------------------------

    // Method that spins indefinitely for the lifetime of the server. Reads events from the plugin's
    // queue and delivers this to the appropriate parts of the gamemode.
    async deferredEventDispatcher() {
        await wait(kDeferredEventReadIntervalMs);

        while (!this.disposed_) {
            const events = getDeferredEvents();
            for (const { type, event } of events) {
                try {
                    this.handleSingleEvent(type, event);
                } catch (exception) {
                    console.log(exception);
                }
            }

            await wait(kDeferredEventReadIntervalMs);
        }
    }

    // Handles the given |event|, generally fed from the deferred event dispatcher. Will execute
    // arbitrary code that could throw, which should not disrupt the dispatcher.
    handleSingleEvent(type, event) {
        let player, killer, issuer, position;

        switch (type) {
            case 'CAC_OnCheatDetect':
                player = server.playerManager.getById(event.player_id);
                if (player) {
                    for (const observer of this.sampcacObservers_) {
                        observer.onPlayerCheatDetected(
                            player, event.cheat_id, event.opt1, event.opt2);
                    }
                }
                break;

            case 'CAC_OnGameResourceMismatch':
                player = server.playerManager.getById(event.player_id);
                if (player) {
                    for (const observer of this.sampcacObservers_) {
                        observer.onPlayerGameResourceMismatch(
                            player, event.model_id, event.component_type, event.checksum);
                    }
                }
                break;

            case 'CAC_OnMemoryRead':
                player = server.playerManager.getById(event.player_id);
                if (player) {
                    const buffer = new Uint8Array([ ...event.content ]);
                    for (const observer of this.sampcacObservers_)
                        observer.onPlayerMemoryRead(player, event.address, buffer);
                }
                break;

            case 'CAC_OnPlayerKick':
                player = server.playerManager.getById(event.player_id);
                if (player) {
                    for (const observer of this.sampcacObservers_)
                        observer.onPlayerKicked(player, event.reason_id);
                }
                break;

            case 'CAC_OnScreenshotTaken':
                player = server.playerManager.getById(event.player_id);
                if (player) {
                    for (const observer of this.sampcacObservers_)
                        observer.onPlayerScreenshotTaken(player);
                }
                break;

            case 'OnDynamicObjectMoved':
                server.objectManager.onObjectMoved(event);
                break;

            case 'OnPlayerChecksumAvailable':
                const feature = server.featureManager.loadFeature('nuwani_commands');
                feature.playerCommands_.onChecksumResponse(event);
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
            
            case 'OnPlayerResolvedDeath':
                player = server.playerManager.getById(event.playerid);
                killer = server.playerManager.getById(event.killerid);

                if (player) {
                    for (const observer of this.playerObservers_)
                        observer.onPlayerDeath(player, killer, event.reason);
                }

                // TODO: Migrate all the event listeners to observe |this|.
                if (!server.isTest())
                    dispatchEvent('playerresolveddeath', event);

                break;
            
            case 'OnPlayerSelectDynamicObject':
                server.playerManager.onPlayerSelectObject(event);
                break;
            
            case 'OnPlayerShootDynamicObject':
                server.objectManager.onPlayerShootObject(event);
                break;
            
            case 'OnPlayerTakeDamage':
                player = server.playerManager.getById(event.playerid);
                issuer = server.playerManager.getById(event.issuerid);

                if (player) {
                    for (const observer of this.playerObservers_) {
                        observer.onPlayerTakeDamage(
                            player, issuer, event.amount, event.weaponid, event.bodypart);
                    }
                }

                break;
            
            case 'OnPlayerWeaponShot':
                player = server.playerManager.getById(event.playerid);
                position = new Vector(event.fX, event.fY, event.fZ);

                if (player) {
                    for (const observer of this.playerObservers_) {
                        observer.onPlayerWeaponShot(
                            player, event.weaponid, event.hittype, event.hitid, position);
                    }
                }

                break;

            default:
                console.log(`Warning: unhandled deferred event "${type}".`);
                break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Adds the given |observer| to those receiving player events.
    addObserver(observer) {
        if (observer instanceof PlayerEventObserver)
            this.playerObservers_.add(observer);
        else if (observer instanceof SAMPCACEventObserver)
            this.sampcacObservers_.add(observer);
        else
            throw new Error(`The given observer (${observer}) must inherit PlayerEventObserver.`);
    }

    // Removes the given |observer| from those receiving any kinds of events.
    removeObserver(observer) {
        this.playerObservers_.delete(observer);
        this.sampcacObservers_.delete(observer);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;

        this.playerObservers_.clear();
        this.sampcacObservers_.clear();
    }
}
