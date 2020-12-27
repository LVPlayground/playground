// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Delegate that is able to determine the registration status and level of the "context" of a
// command, i.e. the person (in-game, IRC, Discord etc.) who is executing it.
export class CommandContextDelegate {
    // Returns the player level that the |context| has, or its equivalent for the context.
    getLevel(context) { return Player.LEVEL_PLAYER; }

    // Respond to the |context| with an error that no players were found for the given |query|.
    respondWithUnknownPlayer(context, query) {}

    // Respond to the |context| with usage information on the given |command|.
    respondWithUsage(context, command) {}
}
