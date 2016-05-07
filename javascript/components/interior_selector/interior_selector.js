// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Private symbol ensuring that the InteriorSelector constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// The interior selector offers a convenient way for players to select a location from one of the
// many interiors available in Grand Theft Auto: San Andreas.
class InteriorSelector {
    // Allows |player| to select an interior. Will return a promise that will be resolved with the
    // interior when one has been selected, or with NULL when selection has been canceled.
    static select(player, list) {
        if (!Array.isArray(list) || !list.length)
            throw new Error('You must pass a list of interiors to the interior selector.');

        const selector = new InteriorSelector(PrivateSymbol, player, list);
        selector.displayInterior(Math.floor(Math.random() * list.length));

        return selector.finished;
    }

    constructor(privateSymbol, player, list) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.player_ = player;
        this.list_ = list;

        this.sceneIndex_ = 0;
        this.userInterface_ = null;

        this.resolve_ = null;
        this.finished_ = new Promise(resolve => {
            this.resolve_ = resolve;

        }).then(selection => {
            this.destroyUserInterface();
            return selection;
        });
    }

    // Returns the promise that is to be resolved or rejected when the question has completed.
    get finished() { return this.finished_; }

    // Displays the interior at |index| in the |list_|.
    displayInterior(index) {
        if (!this.userInterface_)
            this.buildUserInterface();

        const sceneIndex = ++this.sceneIndex_;
        const player = this.player_;

        const scene = this.list_[index];
        const preview = scene.preview;

        // Make sure that the player is in the correct interior to view this interior.
        player.interior = scene.interior;

        // Force-update the streamer for this player to make sure custom houses are visible.
        player.updateStreamer(new Vector(...preview.position[0]), VirtualWorld.forPlayer(player),
                              scene.interior, 0 /* STREAMER_TYPE_OBJECT */);

        // Set the player's camera to the initial frame of the interior's preview.
        player.setCamera(new Vector(...preview.position[0]), new Vector(...preview.target[0]));

        // Wait one second to give the scene a chance to load for this player.
        wait(1000).then(() => {
            if (this.sceneIndex_ !== sceneIndex)
                return;  // the player has navigated away from this scene

            // Interpolate the player's camera to a different position to add interactivity.
            player.interpolateCamera(
                new Vector(...preview.position[0]),  // positionFrom
                new Vector(...preview.position[1]),  // positionTo
                new Vector(...preview.target[0]),  // targetFrom
                new Vector(...preview.target[1]),  // targetTo
                preview.duration);

            // TODO(Russell): Only resolve the promise when the player has made a decision.
            wait(5000).then(() => this.resolve_(null));
        });
    }

    // Builds the user interface for the interior selector.
    buildUserInterface() {
        // TODO: Create the UI elements for the selector.

        this.player_.setSpectating(true);
        this.player_.virtualWorld = VirtualWorld.forPlayer(this.player_);
    }

    // Destroys the user interface that's part of the interior selector.
    destroyUserInterface() {
        this.player_.setSpectating(false);
        this.player_.resetCamera();

        // TODO: Destroy the UI elements for the selector.
    }
}

exports = InteriorSelector;
