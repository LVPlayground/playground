// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

// The scoreboard is a visual element present for all derbies. It shows players the goal of the game
// as well as a list of rankings telling them where they are in relation to each other.
export class Scoreboard {
    #score_ = null;
    #title_ = null;

    constructor(description) {
        this.#score_ = createScoreElement();
        this.#title_ = createTitleElement(description);
    }

    // Shows the score board for the given |player|.
    displayForPlayer(player) {
        this.#score_.displayForPlayer(player);
        this.#title_.displayForPlayer(player);
    }

    // Hides the score board from the given |player|.
    hideForPlayer(player) {
        this.#score_.hideForPlayer(player);
        this.#title_.hideForPlayer(player);
    }

    // Updates the score board's contents based on the given |players|. We calculate the positions
    // of the participants based on the remaining health of their vehicles.
    update(players) {
        const scores = [];

        // (1) Collect the vehicle health status of all the participants.
        for (const player of players) {
            if (player.vehicle)
                scores.push([ player.name, player.vehicle.health ]);
            else
                scores.push([ player.name, /* vehicle health= */ 0 ]);
        }

        // (2) Sort the positions in descending order by score. More health = better.
        scores.sort((lhs, rhs) => {
            if (lhs[1] === rhs[1])
                return lhs[0].localeCompare(rhs[0]);

            return lhs[1] > rhs[1] ? -1 : 1;
        });

        // (3) Process the text of the score board, rank each participant.
        this.#score_.text = `~w~` +
            scores.map(([ name, score ], index) => `#${index+1}~y~ ${name}`)
                  .join('~n~~w~');
    }

    dispose() {
        this.#score_.dispose();
        this.#score_ = null;

        this.#title_.dispose();
        this.#title_ = null;
    }
}

// Creates the score element. While the text will not be entered yet until a score is known, we can
// set the element's position and styling information upfront.
function createScoreElement() {
    return server.textDrawManager.createTextDraw({
        position: [ 520, 316 ],
        text: '_',

        backgroundColor: Color.fromRGBA(0, 0, 0, 0xFF),
        boxColor: Color.fromRGBA(0, 0, 0, 0x33),
        box: true,
        color: Color.fromRGBA(0xFF, 0xFF, 0xFF, 0xFF),
        outline: 0,
        proportional: true,
        shadow: 1,

        letterSize: [ 0.21, 1.1 ],
        textSize: [ 621, -3 ],
    });
}

// Creates the title element for the score board. This will display the derby's name in the regular
// sans-serif font, just above the score board.
function createTitleElement(description) {
    return server.textDrawManager.createTextDraw({
        position: [ 520, 301 ],
        text: description.name,

        backgroundColor: Color.fromNumberRGBA(255),
        boxColor: Color.fromNumberRGBA(255),
        box: true,
        color: Color.fromNumberRGBA(-1),
        shadow: 1,

        letterSize: [ 0.24, 1.2 ],
        textSize: [ 621, 0 ],
    });
}
