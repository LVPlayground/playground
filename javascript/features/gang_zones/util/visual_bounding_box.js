// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

// Object ID for the area boundary screen that's ten meters wide.
const kAreaBoundary10M = 11752;

// Class that enables displaying a visual bounding box on the player's screen to illustrate the
// boundaries of the area that they are editing right now.
export class VisualBoundingBox {
    beams_ = null;
    entities_ = null;
    zone_ = null;

    constructor(zone, entities) {
        this.beams_ = new Map();
        this.entities_ = entities;
        this.zone_ = zone;
    }
    
    // Displays the bounding box for the given |player|.
    displayForPlayer(player) {
        if (this.beams_.has(player))
            throw new Error(`A bounding box has already been created for ${player.name}.`);

        const beams = new Set();

        const positionPlayer = player.position;
        const positionZ = positionPlayer.z - 10;

        const area = this.zone_.area;
        const corners = [
            { accessor: 'topLeft', directions: [ 180, 90 ], multiplier: 1 },
            { accessor: 'topRight', directions: [ 270, 180 ], multiplier: -1 },
            { accessor: 'bottomRight', directions: [ 0, 270 ], multiplier: 1 },
            { accessor: 'bottomLeft', directions: [ 90, 0 ], multiplier: -1 },
        ];
        
        for (const { accessor, directions, multiplier } of corners) {
            const position = area[accessor];

            for (const rotationZ of directions) {
                let positionX = position[0];
                let positionY = position[1];

                switch (rotationZ) {
                    case 0:
                        positionX -= 5 * multiplier;
                        break;
                    case 90:
                        positionY += 5 * multiplier;
                        break;
                    case 180:
                        positionX += 5 * multiplier;
                        break;
                    case 270:
                        positionY -= 5 * multiplier;
                        break;
                }

                beams.add(this.entities_.createObject({
                    modelId: kAreaBoundary10M,
                    position: new Vector(positionX, positionY, positionZ),
                    rotation: new Vector(0, 0, rotationZ),
                    playerId: player.id,
                }));
            }
        }

        this.beams_.set(player, beams);
    }

    // Hides the bounding box for the given |player|.
    hideForPlayer(player) {
        if (!this.beams_.has(player))
            throw new Error(`No entities have been created for ${player.name}.`);
        
        const beams = this.beams_.get(player);
        for (const object of beams)
            object.dispose();

        this.beams_.delete(player);
    }
}
