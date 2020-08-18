// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PositionElement } from 'features/races/interface/position_element.js';

// The scoreboard is a visual element present for all races. It shows participants how well they are
// doing, together with their position among their fellow racers. Each player has their own score
// board, due to the highly personalised nature of this data.
//
// The Scoreboard class implements the following user interface:
//
//     =============================
//     =   _                       =
//     =  |  | TH       00:00.000  =
//     =  |__| /0    PR 00:00.000  =
//     =                           =
//     =============================
//
//     =============================
//     =                           =
//     =  #1 FirstRacerName        =
//     =                  -00.000  =
//     =  #3 SecondRacerName       =
//     =                  +00.000  =
//     =  #4 ThirdRacerName        =
//     =               +00:00.000  =
//     =                           =
//     =============================
//
// The player's current time will be updated several times per second. The personal record will be
// updated when they pass through the next checkpoint. The position of all players, including the
// times between them, will be updated when any of the participants passes a checkpoint.
//
// Colors will be applied to times to clarify whether it's a good thing or a bad thing. Negative
// time values will be displayed in green (they're doing better than the other time), whereas
// positive values will be displayed in red (they're doing worse than the other time).
export class Scoreboard {
    #player_ = null;

    #position_ = null;

    constructor(player, participants) {
        this.#player_ = player;

        this.#position_ = new PositionElement(player, participants.size);
    }

    // Updates the time displayed on the position element of the scoreboard. Is expected to be
    // called 5+ times per second, so should avoid doing processing unless required.
    updateTime(time) {
        this.#position_.updateTime(this.#player_, time);
    }

    dispose() {
        this.#position_.dispose(this.#player_);
        this.#position_ = null;

        this.#player_ = null;
    }
}
