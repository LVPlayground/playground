// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { Vector } from 'base/vector.js';

import confirm from 'components/dialogs/confirm.js';

// Object ID for the area boundary screen that's a meter wide.
const kAreaBoundary1M = 11753;

// Timeout, in milliseconds, after which the selection will be considered as having timed out. This
// is necessary because players can Esc out of this flow, which is not related to the server..
const kSelectionTimeoutMs = 10000;

// Threshold, in milliseconds, within which a click will be considered as accidental. This is
// necessary because when a player double clicks on a list item in a menu to activate it, that
// second click will in fact be considered the selection. Putting objects straight ahead in danger.
const kAccidentalDoubleClickThresholdMs = 400;

// Flow used to allow a player to select a particular object within their zone. All of the zone's
// objects will be highlighted, making it easy for them to select a particular object. The flow
// will return either NULL when aborted, or an object structured { decorationId, object }.
export class SelectObjectFlow {
    static async runForPlayer(player, { decorations = null, entities = null, zone = null } = {}) {
        const objects = decorations.getObjectsForZone(zone);
        if (!objects || !objects.size)
            return null;  // there are no decorations for the player to select

        const beams = new Set();
        const mappings = new Map();

        // Create the beams that identify all the zone's decorations, and set up a mapping between
        // the object Ids and their decoration Id. Also do this for the beams, to make selecting an
        // object easier and less ambiguous when clicking on the beam instead.
        for (const [ decorationId, object ] of objects) {
            mappings.set(object.id, decorationId);

            const beam = entities.createObject({
                modelId: kAreaBoundary1M,
                position: object.position.translate({ z: -10 }),
                rotation: new Vector(0, 0, 0),
            });

            mappings.set(beam.id, decorationId);
            beams.add(beam);
        }

        // Make sure that the beams are visible for the |player|.
        player.updateStreamerObjects();

        let activeToken = null;
        let decorationId = null;
        let object = null;

        // Keep selecting an object until the player has selected one. The ability to select an
        // object has a timeout within the Player object, as it's highly unreliable.
        while (player.isConnected()) {
            const startTime = server.clock.monotonicallyIncreasingTime();
            
            activeToken = Symbol('Object selection');
            wait(kSelectionTimeoutMs).then((storedActiveToken => {
                if (activeToken === storedActiveToken) {
                    player.sendMessage(Message.ZONE_DECORATION_SELECT_TIMED_OUT);
                    player.cancelEdit();
                }

            }).bind(null, activeToken))

            const selectedObject = await player.selectObject();

            activeToken = null;  // release the |activeToken| to cancel the timeout

            if (!selectedObject)
                break;

            const selectionTime = server.clock.monotonicallyIncreasingTime() - startTime;
            if (selectionTime <= kAccidentalDoubleClickThresholdMs && !server.isTest())
                continue;  // let's try that again

            if (!mappings.has(selectedObject.id)) {
                const confirmation = await confirm(player, {
                    title: 'Zone Management',
                    message: 'That object is not part of this zone. Do you want to try again?'
                });

                if (!confirmation)
                    break;
                
                // fall-through so that the player can select another object

            } else {
                decorationId = mappings.get(selectedObject.id);
                object = selectedObject;
                break;
            }
        }

        // Dispose of all of the beams that were added for the flow.
        for (const beam of beams)
            beam.dispose();

        return decorationId ? { decorationId, object }
                            : null;
    }
}
