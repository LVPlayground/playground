// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Parameters that can be passed when intending to execute a game command. This is used by the
// automatically built game commands, as well as by commands provided through other features such
// as "/race" and "/fights". All members are optional.
export class GameCommandParams {
    // Boolean indicating whether the player wants to customise the game.
    customise = null;

    // Number indicating which instance of the game the player wants to join.
    registrationId = null;

    // Map instance containing the predefined settings for this game.
    settings = new Map();
}
