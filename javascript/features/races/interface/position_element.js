// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbsoluteTimeView } from 'features/races/interface/absolute_time_view.js';
import { Color } from 'base/color.js';
import { Rectangle } from 'components/text_draw/rectangle.js';
import { RelativeTimeView } from 'features/races/interface/relative_time_view.js';
import { TextDraw } from 'entities/text_draw.js';

// Background color of the score board. Should be semi-transparent.
const kBackgroundColor = Color.fromRGBA(0, 0, 0, 100);

// Color of the text indicating the number of players. Should be white-ish.
const kPlayerCountColor = Color.fromRGBA(255, 255, 255, 100);

// Color in which the player's personal record will be displayed.
const kPlayerHighscoreColor = Color.fromRGBA(255, 255, 0, 255);

// This class implements the position element for the racing scoreboard, which displays the player's
// current position among the participants, the time they've taken so far, as well as their
//
//     =============================
//     =   _                       =
//     =  |  | TH       00:00.000  =
//     =  |__| /0    PR 00:00.000  =
//     =                           =
//     =============================
//
// Updates will be propagated up from the Scoreboard class, to one of the specialized updateFoo()
// methods that exist in this class. Updates are lazy, and we avoid making calls when unnecessary.
export class PositionElement {
    #background_ = null;

    #participantLabel_ = null;
    #positionLabel_ = null;
    #positionSuffix_ = null;

    #raceTime_ = null;

    #highscoreLabel_ = null;
    #highscoreTime_ = null;
    #intervalTime_ = null;

    constructor(player, participants) {
        this.#background_ = new Rectangle(500, 140, 106, 36.8, kBackgroundColor);

        this.#participantLabel_ = createParticipantLabel(player, participants);
        this.#positionLabel_ = createPositionLabel(player);
        this.#positionSuffix_ = createPositionSuffix(player);

        this.#raceTime_ = new AbsoluteTimeView(556.5, 145.5);

        const elements = [
            this.#background_,
            this.#participantLabel_, this.#positionLabel_, this.#positionSuffix_,
            this.#raceTime_,
        ];

        for (const element of elements)
            element.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Sets the |highscore| for the |player|, which is given in milliseconds.
    setHighscore(player, highscore) {
        if (this.#highscoreTime_ || this.#intervalTime_)
            return;  // the space is already being occupied

        this.#highscoreLabel_ = createHighscoreLabel(player);
        this.#highscoreLabel_.displayForPlayer(player);

        this.#highscoreTime_ = new AbsoluteTimeView(556.5, 154.726, kPlayerHighscoreColor);
        this.#highscoreTime_.setTime(player, highscore);
        this.#highscoreTime_.displayForPlayer(player);
    }

    // Updates the player's |position| given the total number of |participants|.
    updatePosition(position, participants) {
        const participantsText = `/${participants}`;

        const positionOrdinal = ['st','nd','rd'][((position + 90) % 100 - 10) % 10 - 1] || 'th';
        const positionText = String(position);

        if (this.#participantLabel_.text !== participantsText)
            this.#participantLabel_.text = participantsText;

        if (this.#positionLabel_.text !== positionText)
            this.#positionLabel_.text = positionText;

        if (this.#positionSuffix_.text !== positionOrdinal)
            this.#positionSuffix_.text = positionOrdinal;
    }

    // Updates the player's race time to the given |time|, in milliseconds.
    updateTime(player, time) {
        this.#raceTime_.setTime(player, time);
    }

    // ---------------------------------------------------------------------------------------------

    dispose(player) {
        this.#background_.hideForPlayer(player);
        this.#raceTime_.hideForPlayer(player);

        if (this.#highscoreTime_)
            this.#highscoreTime_.hideForPlayer(player);

        if (this.#intervalTime_)
            this.#intervalTime_.hideForPlayer(player);

        // TODO: Move the other elements in here once they've been converted to the new TextDraw
        // entities, rather than the old system.
        const elements = [
            this.#participantLabel_, this.#positionLabel_, this.#positionSuffix_,
            this.#highscoreLabel_,
        ];

        for (const element of elements) {
            if (element)
                element.dispose();
        }
    }
}

// Creates a highscore label for the |player|. This displays nothing beyond "PR" (personal record)
// next to the time view that will be created for the actual record.
function createHighscoreLabel(player) {
    return server.textDrawManager.createTextDraw({
        position: [ 542.467, 154.841 ],
        text: 'PR',
        player,

        color: kPlayerHighscoreColor,
        font: TextDraw.kFontPricedown,
        shadow: 0,

        letterSize: [ 0.314, 0.969 ],
    });
}

// Creates the text draw that will be used to convey the number of participants in the current race.
// This normally is a number between 1 (single player) and 4.
function createParticipantLabel(player, participants) {
    return server.textDrawManager.createTextDraw({
        position: [ 515.667, 151.634  ],
        text: `/${participants}`,
        player,

        color: kPlayerCountColor,
        font: TextDraw.kFontPricedown,
        shadow: 0,

        letterSize: [ 0.366, 1.388 ],
    });
}

// Creates the text draw that will indicate what the player's own position currently is. This will
// change while the race is active, as they catch up (or fall behind) other participants.
function createPositionLabel(player) {
    return server.textDrawManager.createTextDraw({
        position: [ 505, 143 ],
        text: '1',
        player,

        font: TextDraw.kFontPricedown,
        proportional: false,
        shadow: 0,

        letterSize: [ 0.582, 2.446 ],
    });
}

// Creates the suffix of the position label, to make it grammatically accurate. A player doesn't
// find themself in position 1, instead, they're racing in 1st position.
function createPositionSuffix(player) {
    return server.textDrawManager.createTextDraw({
        position: [ 516, 145 ],
        text: 'st',
        player,

        font: TextDraw.kFontMonospace,
        shadow: 0,

        letterSize: [ 0.177, 0.97 ]
    });
}
