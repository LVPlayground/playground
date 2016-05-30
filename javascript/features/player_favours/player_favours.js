// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const ObjectGroup = require('entities/object_group.js');
const ObjectRemover = require('features/player_favours/object_remover.js');
const Vector = require('base/vector.js');

// Implementation of a collection of features that have been implemented specifically by request of
// a particular player. The actual features and their owners are documented in the README.md file.
class PlayerFavours extends Feature {
    constructor() {
        super();

        this.objectRemover_ = new ObjectRemover();
        this.objectRemover_.load('data/favours/joes_garage.json');  // Joe's Garage
        this.objectRemover_.load('data/favours/houses_promo.json');  // LVP Houses promotion

        this.objectGroup_ = ObjectGroup.create('data/favours/houses_promo_new.json', 0, 0);

        this.housePromoLabel_ = server.textLabelManager.createTextLabel({
            position: new Vector(2095.9238, 1599.2308,  10.3139),
            color: Color.fromRGB(255, 255, 0),
            text: 'LVP Houses\n{FFFFFF}Soon coming to Las Venturas Playground!',
            drawDistance: 10
        });
    }

    // This feature has no public API.

    dispose() {
        this.housePromoLabel_.dispose();
        this.objectGroup_.dispose();
        this.objectRemover_.dispose();
    }
}

exports = PlayerFavours;
