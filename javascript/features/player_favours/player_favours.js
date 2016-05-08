// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ObjectRemover = require('features/player_favours/object_remover.js');

// Implementation of a collection of features that have been implemented specifically by request of
// a particular player. The actual features and their owners are documented in the README.md file.
class PlayerFavours extends Feature {
    constructor(playground) {
        super(playground);

        this.objectRemover_ = new ObjectRemover();
        this.objectRemover_.load('data/favours/joes_garage.json');  // Joe's Garage
    }

    // This feature has no public API.

    dispose() {
        this.objectRemover_.dispose();
    }
}

exports = PlayerFavours;
