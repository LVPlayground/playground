// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Interface that has to be supported by all team resolvers. Each resolver is powered by its own
// implementation to make sure they're individually tested, separate from the rest of the system.
export class TeamResolver {
    // Returns whether this team resolver is for a team-based game.
    isTeamBased() { return true; }

    // Called when the |player| has been removed from the game. May be used to inform future
    // decisions about where newly joining players have to go.
    onPlayerRemoved(player) {}

    // Resolves the intended teams for the given |players|, a sequence. This method should only be
    // called when no prior resolution has been done yet on individual players.
    resolve(players) {}

    // Resolves the intended team for the given |player|, who may have joined late. They will be
    // assigned a team based on the current balance.
    resolveForPlayer(player) {}
}
