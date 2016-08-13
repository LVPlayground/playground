// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');

// Narrow red-beam. Available since SA-MP 0.3.7 RC4.
const BEAM_OBJECT_ID = 11753;

// The identity beam can be used as a way to identify the entity that's about to be edited, for
// instance a house, property or an object that is about to be edited.
class IdentityBeam {
    constructor(position, { modelId = null, player = null, label = null, timeout = 60000 } = {}) {
        const viewingAngle = player ? player.rotation : 0;
        const model = modelId || BEAM_OBJECT_ID;

        this.entities_ = new ScopedEntities();
        this.entities_.createObject({
            modelId: model,
            position: position,
            rotation: new Vector(0, 0, viewingAngle % 360)
        });

        this.entities_.createObject({
            modelId: model,
            position: position,
            rotation: new Vector(0, 0, (viewingAngle + 90) % 360)
        });

        // Create a label for the identity beam if that has been requested.
        if (label !== null) {
            this.entities_.createTextLabel({
                text: label,
                position: position.translate({ z: 1 }),
                drawDistance: 150,
                testLineOfSight: false
            });
        }

        if (player)
            player.updateStreamerObjects();

        if (timeout)
            wait(timeout).then(IdentityBeam.prototype.dispose.bind(this));
    }

    dispose() {
        if (this.entities_) {
            this.entities_.dispose();
            this.entities_ = null;
        }
    }
}

exports = IdentityBeam;
