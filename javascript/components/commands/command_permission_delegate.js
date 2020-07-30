// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Delegate that is able to determine whether a certain player (or context) is able to execute a
// given command, based on their level, registration status and unique identifier.
export class CommandPermissionDelegate {
    // Returns whether the |context| has permission to execute the given |command|, which is an
    // instance of CommandDescription. When |verbose| is set, the implementation is expected to
    // share the details of any access error with the given |context|.
    canExecuteCommand(context, contextDelegate, command, verbose) { return false; }

    // Helper method that returns a textual representation for the given |level|, which must be one
    // of the level constants that are available on the Player object.
    textualRepresentationForLevel(level) {
        switch (level) {
            case Player.LEVEL_PLAYER:
                return 'players';

            case Player.LEVEL_ADMINISTRATOR:
                return 'administrators';

            case Player.LEVEL_MANAGEMENT:
                return 'Management members';
        }

        return 'specific people';
    }
}
