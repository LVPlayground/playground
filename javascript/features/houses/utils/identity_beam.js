// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Narrow red-beam. Available since SA-MP 0.3.7 RC4.
const BEAM_OBJECT_ID = 11753;

// The identity beam can be used as a way to identify the entity that's about to be edited, for
// instance a house, property or an object that is about to be edited.
class IdentityBeam {
    constructor(position, { player = null, timeout = 60000 } = {}) {
        const viewingAngle = player ? player.rotation : 0;

        this.primaryBeam_ = server.objectManager.createObject({
            modelId: BEAM_OBJECT_ID,
            position: position,
            rotation: new Vector(0, 0, viewingAngle % 360)
        });

        this.secondaryBeam_ = server.objectManager.createObject({
            modelId: BEAM_OBJECT_ID,
            position: position,
            rotation: new Vector(0, 0, (viewingAngle + 90) % 360)
        });

        if (player)
            player.updateStreamerObjects();

        if (timeout)
            wait(timeout).then(IdentityBeam.prototype.dispose.bind(this));
    }

    dispose() {
        if (this.primaryBeam_.isConnected())
            this.primaryBeam_.dispose();

        if (this.secondaryBeam_.isConnected())
            this.secondaryBeam_.dispose();
    }
}

exports = IdentityBeam;
