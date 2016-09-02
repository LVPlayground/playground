// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ObjectGroup = require('entities/object_group.js');
const ObjectRemover = require('features/player_favours/object_remover.js');
const ScopedEntities = require('entities/scoped_entities.js');

// Implementation of a collection of features that have been implemented specifically by request of
// a particular player. The actual features and their owners are documented in the README.md file.
class PlayerFavours extends Feature {
    constructor() {
        super();

        this.objectRemover_ = new ObjectRemover();
        this.objectRemover_.load('data/favours/joes_garage.json');  // Joe's Garage
        this.objectRemover_.load('data/favours/houses_promo.json');  // LVP Houses promotion
        this.objectRemover_.load('data/favours/caligula_basement_door.json'); // Door which blocks access to basement in caligulas
		
        this.objectGroup_ = ObjectGroup.create('data/favours/houses_promo_new.json', 0, 0);

        this.huracanActors_ = new ScopedEntities();
        this.huracanActors_.createActor({
            modelId: 287,
            position: new Vector(1122.71, -2033.97, 69.89),
            rotation: 270
        });

        this.huracanActors_.createActor({
            modelId: 287,
            position: new Vector(1122.71, -2040.10, 69.89),
            rotation: 270
        });

        this.huracanActors_.createActor({
            modelId: 116,
            position: new Vector(1117.91, -2037.05, 78.75),
            rotation: 270
        });
    }

    // This feature has no public API.

    dispose() {
        this.huracanActors_.dispose();

        this.objectGroup_.dispose();
        this.objectRemover_.dispose();
    }
}

exports = PlayerFavours;
