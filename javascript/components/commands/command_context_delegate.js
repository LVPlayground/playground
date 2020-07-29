// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Delegate that is able to determine the registration status and level of the "context" of a
// command, i.e. the person (in-game, IRC, Discord etc.) who is executing it.
export class CommandContextDelegate {
    // Errors that can occur in the flow of executing a command.
    // TODO

    // Returns whether the given |context| is registered with the server.
    isRegistered(context) { return false; }

    // Returns the player level that the |context| has, or its equivalent for the context.
    getLevel(context) { return Player.LEVEL_PLAYER; }
}