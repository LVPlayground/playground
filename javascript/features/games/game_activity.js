// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Base class that supports a common interface on both pending and in-progress games on the server
// for determining (a) what it is the player's doing, and (b) how to describe it.
export class GameActivity {
    // States of activity that a player could have in a particular game.
    static kStateRegistered = 0;
    static kStateEngaged = 1;

    // Returns the state of activity that this instance describes.
    getActivityState() { throw new Error(`getActivityState() must be overridden`); }

    // Returns the name of the activity that this instance describes.
    getActivityName() { throw new Error(`getActivityName() must be overridden`); }

    // Called when the |player| has to leave the activity.
    removePlayer(player) { throw new Error(`removePlayer() must be overridden`); }

    // Called when the activity is being converted to a string.
    toString() {
        let stateText = null;
        switch (this.getActivityState()) {
            case GameActivity.kStateRegistered:
                stateText = 'registered';
                break;

            case GameActivity.kStateEngaged:
                stateText = 'engaged';
                break;

            default:
                throw new Error(`Invalid activity state: ${this.getActivityState()}`);
        }

        return `[GameActivity: ${this.getActivityName()} (${stateText})]`;
    }
}
