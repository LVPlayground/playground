// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ObjectGroup = require('entities/object_group.js');

// The animation that the DJ on the ship should be moving with.
const DjAnimation = { library: 'LOWRIDER', name: 'RAP_B_Loop', loop: true };

// The Pirate Ship Party object encapsulates the functionality that is available to decorate the
// Pirate Ship in case of celebrations.
//
// A number of these decorations have been contributed by Jay (https://sa-mp.nl/players/19/jay.html)
// and a number of them have been contributed by Russell.
class PirateShipParty {
    constructor() {
        this.bartender_ =
            server.actorManager.createActor({ modelId: 171 /* Hotel Services */,
                                              position: new Vector(2002.15, 1519.45, 17.0625),
                                              rotation: 0 });

        this.dj_ =
            server.actorManager.createActor({ modelId: 178 /* Whore */,
                                              position: new Vector(2000.56, 1567.98, 15.3072),
                                              rotation: 180 });

        this.dj_.animate(DjAnimation);
        this.dj_.animate(DjAnimation);

        wait(4000).then(() => {
            if (!this.dj_.isConnected())
                return;  // the pirate ship party has been disabled since

            this.dj_.animate(DjAnimation);
            this.dj_.animate(DjAnimation);
        })

        this.objects_ = ObjectGroup.create('data/objects/pirate_ship_party.json',
                                           0 /* virtual world */, 0 /* interior */);
    }

    dispose() {
        this.objects_.dispose();

        this.dj_.dispose();
        this.bartender_.dispose();
    }
}

exports = PirateShipParty;
