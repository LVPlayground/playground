// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import { VisualBoundingBox } from 'features/gang_zones/util/visual_bounding_box.js';

import confirm from 'components/dialogs/confirm.js';

// Flow that allows a player to edit a given |object| within the boundaries of the |zone|. A
// bounding box will be drawn around the zone to illustrate their reach.
export class EditObjectFlow {
    static async runForPlayer(player, { object = null, entities = null, zone = null } = {}) {
        const boundingBox = new VisualBoundingBox(zone, entities);
        boundingBox.displayForPlayer(player);

        player.updateStreamerObjects();

        let position = null;
        let rotation = null;

        // Have the |player| edit the object. The result will either be { position, rotation } when
        // the flow succeeded, or NULL when the player edited or disconnected from the server.
        while (player.isConnected()) {
            const result = await object.edit(player);
            if (!result)
                break;  // the edit was cancelled

            // Verify that the position contained within the result is part of the gang zone. While
            // the |player|'s gangs owns the zone, they don't own the area surrounding it.
            if (!zone.area.contains(result.position)) {
                const confirmation = await confirm(player, {
                    title: 'Zone Management',
                    message: 'The object must be located within the zone. Do you want to try again?'
                });

                if (!confirmation)
                    break;
                
                // fall-through, and just kick the player back in editing mode
                
            } else {
                position = result.position;
                rotation = result.rotation;
                break;
            }
        }

        // Remove visuals and the object that was being edited, the decorator will take over.
        boundingBox.hideForPlayer(player);

        return position ? { position, rotation }
                        : null;
    }
}
