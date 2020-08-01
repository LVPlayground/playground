// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Parameters that can be passed when intending to execute a game command. This is used by the
// automatically built game commands, as well as by commands provided through other features such
// as "/race" and "/fights". All members are optional.
export class GameCommandParams {
    // Types of commands that can be encapsulated by this object.
    static kTypeDefault = 0;
    static kTypeCustomise = 1;
    static kTypeStart = 2;
    static kTypeWatch = 3;

    // The type of command that is being executed. Must be one of the above constants.
    type = GameCommandParams.kTypeDefault;

    // Whether a custom game should be suggested when there are no active games taking sign-up.
    preferCustom = false;

    // Number indicating which instance of the game the player wants to join.
    registrationId = null;

    // Map instance containing the predefined settings for this game.
    settings = new Map();
}
