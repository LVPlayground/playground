// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * While the preferred way of starting a race is going to the start-point pickup, power users may
 * want to start one by typing a command. We've implemented the /race command for exactly that
 * purpose, which gives all players immediate access to all races.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RaceCommands {
    /**
     * Getting an overview of the available races, or immediately starting a race if they know its
     * number, may be done through the /race command. This command is only available if the player
     * is not currently involved in a minigame yet.
     *
     * @param playerId Id of the player who executed the /race command.
     * @param params Parameters as they've been passed on to the command.
     * @command /race [raceId]?
     */
    @command("race")
    public onRaceCommand(playerId, params[]) {
        if (PlayerMinigameState(playerId)->isEngagedInMinigame()) {
            SendClientMessage(playerId, Color::Error, "You already are engaged in a minigame! Type {FFFFFF}/leave{DC143C} to leave it.");
            return;
        }

        new raceId = Command->integerParameter(params, 0);
        if (raceId > 0 && raceId <= RaceController->highestRaceId() && RaceTrack(raceId)->exists()) {
            // The player specified a valid race Id in the command, so we can immediately move on to
            // starting the signup phase for this game (unless it's already in progress).
            this->startRaceForPlayerById(playerId, raceId);
            return;

        } else if (Command->parameterCount(params) > 0) {
            // TODO: The player selected an invalid race Id in their command.
            return;
        }

        // TODO: Show a dialog allowing the user to select the race of their choice.
    }

    /**
     * Starts signup for the given raceId for the player. If the race is already in progress, we
     * either allow the player to join (if sign up is still open) or tell them to wait a little bit
     * for the next iteration. There are, however, no technical concerns in allowing a certain race
     * to be in progress multiple times at any given time.
     *
     * @param playerId The player who would like to start or join a race.
     * @param raceId Id of the race they're interested in joining.
     */
    private startRaceForPlayerById(playerId, raceId) {
        switch (MinigameController->minigameState(RaceMinigame, raceId)) {
            case IdleMinigameState: {
                // The minigame is currently idle. The player is more than welcome to start it, and
                // we'll send out an announcement about this as well.
                MinigameController->startMinigame(RaceMinigame, raceId, playerId);
            }

            case SignupMinigameState: {
                // The minigame has already been started, and is currently taking signups. The
                // player is of course more than welcome to join, which we'll do for them.
                MinigameController->joinMinigame(RaceMinigame, raceId, playerId);
            }

            default: {
                // Any other state indicates that the minigame is already in progress, or unavailable
                // for other reasons. We have to make the player a little bit sad.
                SendClientMessage(playerId, Color::Red, "The race you tried to participate in is already in progress, or may be unavailable");
                SendClientMessage(playerId, Color::Red, "for other reasons. Please try again later!");
            }
        }
    }
};
