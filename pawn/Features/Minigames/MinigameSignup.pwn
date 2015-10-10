// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Minigame Signup class unifies the code required in order to start a minigame. Anything from
 * the moment a player types the minigame's command to 
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class MinigameSignup {
    // After how many seconds should the signup period for minigames expire?
    const MinigameSignupExpirationSeconds = 20;

    // How many players have signed up for a certain minigame as of yet?
    new m_minigameSignupCount[MinigameController::MinigameCount];

    // When did signups for the minigame start? The signup period expires after a few seconds.
    new m_minigameSignupStart[MinigameController::MinigameCount];

    // Tracks how many minigame signups are currently in progress.
    new m_minigameSignupsInProgress;

    /**
     * Attempts to allow a player to join a minigame. If the minigame is not in its singup phase yet
     * then it will be initialized and announced, otherwise the player will join it. If this player
     * completes the minigame in regards to maximum player count, it will be started immediately.
     *
     * @param playerId Id of the player who wants to join.
     * @param type The type of minigame which the player wants to join.
     * @param minigameId Id of the minigame, within the type, they want to join.
     * @param name Name of the minigame which the player should join.
     * @param command The command which other players should type to join it.
     */
    public joinMinigame(playerId, MinigameType: type, minigameId, name[], command[]) {
        // Make sure that the player is not signed up for another minigame.
        if (PlayerMinigameState(playerId)->minigameState() == SignupMinigameState) {
            SendClientMessage(playerId, Color::Error, "You have already signed up for a minigame. Type /leave to leave.");
            return;
        }

        // The player cannot be currently participating in another minigame either.
        if (PlayerMinigameState(playerId)->minigameState() == ActiveMinigameState) {
            SendClientMessage(playerId, Color::Error, "You are already participating in a minigame. Type /leave to leave.");
            return;
        }

        // Is the minigame they're signing up for already in progress?
        if (MinigameController->minigameState(minigameId) == ActiveMinigameState) {
            SendClientMessage(playerId, Color::Error, "The minigame is currently in progress, please try again later.");
            return;
        }

        // Retrieve the amount of money a player has to pay in order to sign up for this minigame.
        new minigameSignupAmount = Annotation::ExpandSwitch<MinigameSignupPrice>(type, minigameId),
            message[128];

        if (GetPlayerMoney(playerId) < minigameSignupAmount) {
            format(message, sizeof(message), "You need $%s in order to sign up for this minigame.",
                formatPrice(minigameSignupAmount));
            SendClientMessage(playerId, Color::Error, message);
            return;
        }

        // Substract this amount from the amount of cash they're currently carrying.
        GivePlayerMoney(playerId, 0 - minigameSignupAmount);

        // Mark the player as having signed up for this particular minigame.
        PlayerMinigameState(playerId)->setMinigameState(minigameId, SignupMinigameState);

        // Depending on whether signups for the minigame have already started, we may want to tell
        // the rest of the players about this minigame being started.
        if (MinigameController->minigameState(minigameId) == IdleMinigameState) {
            MinigameController->setMinigameState(minigameId, SignupMinigameState);
            Announcements->announceMinigameSignup(type, name, command, minigameSignupAmount, playerId);

            m_minigameSignupStart[minigameId] = Time->currentTime();
            ++m_minigameSignupsInProgress;
        }

        // Increment the number of signups we have received for this minigame.
        ++m_minigameSignupCount[minigameId];

        // Each minigame has a maximum number of participants it supports. Let's query for that
        // number, because if we reached that amount then we want to start the minigame.
        new maximumPlayerCount = Annotation::ExpandSwitch<MinigameMaximumPlayerCount>(type, minigameId);
        if (maximumPlayerCount <= m_minigameSignupCount[minigameId]) {
            MinigameController->startMinigame(type, minigameId);
            return;
        }

        // Otherwise we can't immediately sign up, so let's tell the player about the waiting period
        // which they may have to wait for before the minigame starts. And that's all.
        new remainingTime = min(1, Time->currentTime() - m_minigameSignupStart[minigameId]);
        Responses->respondMinigameSignedUp(playerId, type, name, remainingTime);
    }

    /**
     * Process the open signups every second to accurately match the advertised expiration times. If
     * a minigame has enough signups then we start it, otherwise we tell the player they can't join.
     */
    @list(SecondTimer)
    public onSecondTimerTick() {
        if (m_minigameSignupsInProgress == 0)
            return; // there are no signups in progress right now.

        new currentTime = Time->currentTime();
        for (new minigameId = 0; minigameId < MinigameController::MinigameCount; ++minigameId) {
            if (m_minigameSignupStart[minigameId] == 0)
                continue; // there is no signup for this minigame in progress.

            new signupTime = currentTime - m_minigameSignupStart[minigameId];
            if (signupTime < MinigameSignupExpirationSeconds)
                continue; // the signup time has not expired yet.

            // TODO(Russell): Get the right minigame type from the minigameId.
            new signupPlayerCount = m_minigameSignupCount[minigameId],
                MinigameType: minigameType = DeathmatchMinigame;

            // We'll either start or stop this minigame, so clear out it's signup state.
            m_minigameSignupCount[minigameId] = 0;
            m_minigameSignupStart[minigameId] = 0;
            --m_minigameSignupsInProgress;

            // See if the minigame received enough signups to proceed. If that's the case, then we
            // immediately start the minigame and get out of this codepath.
            new minimumPlayerCount = Annotation::ExpandSwitch<MinigameMinimumPlayerCount>(minigameType, minigameId);
            if (minimumPlayerCount < signupPlayerCount) {
                MinigameController->startMinigame(minigameType, minigameId);
                continue;
            }

            new minigameSignupAmount = Annotation::ExpandSwitch<MinigameSignupPrice>(minigameType, minigameId);

            // Otherwise we need to inform the other player(s) about not having received enough
            // signups, telling them to try again if they really want to play it.
            for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
                if (Player(playerId)->isConnected() == false || PlayerMinigameState(playerId)->minigameId() != minigameId)
                    continue; // the player is either not connected, or not signed up to this minigame.

                // TODO(Russell): We need some way to get the minigame's name by Minigame Id.
                new name[8] = "foobar";

                Responses->respondMinigameDropout(playerId, minigameType, name, NotEnoughPlayersDropoutReason);
                PlayerMinigameState(playerId)->resetMinigameState();

                // Be sure to give the player their signup money back.
                GivePlayerMoney(playerId, minigameSignupAmount);
            }
        }
    }
};
