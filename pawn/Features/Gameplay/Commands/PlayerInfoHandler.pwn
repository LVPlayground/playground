// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * You're either a freeroamer or a figher, but in both situations you'd like to have some basic
 * information available about yourself and other players. Information like FPS, ping and packetloss
 * percentage, which can greatly help improving everyone's experience. Commands are available to
 * either hide or show this info.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class PlayerInfoHandler {
    // It's not possible to attach textdraws to players, which is why we're using 3D textlabels.
    // The setup is as according: m_playerInfoLabelId[forPlayerId][playerId] where forPlayerId
    // indicates WHO is seeing the textlabels, and where playerId is the subject for who a textlabel
    // is being created.
    new PlayerText3D: m_playerInfoLabelId[MAX_PLAYERS][MAX_PLAYERS];

    // Keep track whether a player is currently seeing other player's their textlabels.
    new bool: m_labelsHidden[MAX_PLAYERS];

    /**
     * While the server is initializing, we make sure the giant playerinfo textlabel variable is
     * being prepared for duty by setting each entry to INVALID_3DTEXT_ID.
     */
    public __construct() {
        for (new playerId = 0; playerId < MAX_PLAYERS; playerId++) {
            for (new subjectId = 0; subjectId < MAX_PLAYERS; subjectId++)
                this->destroyPlayerInfoLabel(playerId, subjectId);
        }
    }

    /**
     * Method used to create one's textlabel for an other player.
     *
     * @param playerId Id of the player to create the label for (who will notice the result).
     * @param subjectId If of the player who's playerinfo is being shown to an other player.
     */
    private createPlayerInfoLabel(playerId, subjectId) {
        if (m_playerInfoLabelId[playerId][subjectId] != PlayerText3D: INVALID_3DTEXT_ID)
            this->destroyPlayerInfoLabel(playerId, subjectId);

        // Create and attach the 3D textlabel to our subject.
        m_playerInfoLabelId[playerId][subjectId] = CreatePlayer3DTextLabel(playerId, "_",
            Color::White, 0.0 /* offset X */, 0.0 /* offset Y */, -1.0 /* offset Z */,
            40.0 /* draw distance */, subjectId, Vehicle::InvalidId, 1);

        return 1;
    }

    /**
     * Method used to destroy one's textlabel for an other player.
     *
     * @param playerId Id of the player to destroy the label for (who will notice the result).
     * @param subjectId If of the player who's playerinfo is being shown to an other player.
     */
    private destroyPlayerInfoLabel(playerId, subjectId) {
        DeletePlayer3DTextLabel(playerId, m_playerInfoLabelId[playerId][subjectId]);
        m_playerInfoLabelId[playerId][subjectId] = PlayerText3D: INVALID_3DTEXT_ID;

        return 1;
    }

    /**
     * Method used to update one's playerinfo for an other player.
     *
     * @param playerId Id of the player to update the info for (who will notice the result).
     * @param subjectId If of the player who's playerinfo is being shown to an other player.
     */
    private updatePlayerInfo(playerId, subjectId) {
        // Update the textlabels, but only if they're currently being shown.
        if (m_labelsHidden[playerId] == true)
            return 0;

        if (m_playerInfoLabelId[playerId][subjectId] == PlayerText3D: INVALID_3DTEXT_ID) {
            this->createPlayerInfoLabel(playerId, subjectId);
            return 1;
        }

        new labelText[128];
        format(labelText, sizeof(labelText),
            "{B4CCE8}Ping: {FF8E02}%d - {B4CCE8}FPS: {FF8E02}%d\r\n{B4CCE8}Packetloss: {FF8E02}%.1f\%",
            GetPlayerPing(subjectId), PlayerManager->framesPerSecond(subjectId), NetStats_PacketLossPercent(subjectId));

        UpdatePlayer3DTextLabelText(playerId, m_playerInfoLabelId[playerId][subjectId], Color::White, labelText);

        return 1;
    }

    /**
     * When a player connects to our server, we check their setting regarding the playerinfo label
     * and create labels for every player if they like to see such information.
     * After that we check if other players want to see this newly connected player's info, and
     * create labels if necessary.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_labelsHidden[playerId] = false;

        // If this player wants to see some playerinfo, create it for them!
        if (PlayerSettings(playerId)->isPlayerInfoEnabled() == true) {
            for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
                if (Player(subjectId)->isNonPlayerCharacter() == true)
                    continue;

                this->createPlayerInfoLabel(playerId, subjectId);
            }
        }

        // Other players might want to see this fella's playerinfo as well, so lets check on that.
        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (Player(subjectId)->isNonPlayerCharacter() == true)
                continue;

            if (PlayerSettings(subjectId)->isPlayerInfoEnabled() == false)
                continue;

            this->createPlayerInfoLabel(subjectId, playerId);
        }

        return 1;
    }

    /**
     * When a player disconnects we make sure textlabels are deleted accordingly.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        // If the player had the playerinfo setting enabled, we've to destroy all their textlabels.
        if (PlayerSettings(playerId)->isPlayerInfoEnabled() == true) {
            for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
                if (Player(subjectId)->isNonPlayerCharacter() == true)
                    continue;

                this->destroyPlayerInfoLabel(playerId, subjectId);
            }
        }

        // Other players might had a textlabel going for this player, we have to delete that as well.
        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (Player(subjectId)->isNonPlayerCharacter() == true)
                continue;

            if (PlayerSettings(subjectId)->isPlayerInfoEnabled() == false)
                continue;

            this->destroyPlayerInfoLabel(subjectId, playerId);
        }

        return 1;
    }

    /**
     * On each second, for each player checks are executed to see whether the textlabels should get
     * created, destroyed or updated.
     *
     * @param playerId Id of the player to check the playerinfo textlabel status for.
     */
    @list(SecondTimerPerPlayer)
    public onSecondTimerTick(playerId) {
        if (Player(playerId)->isNonPlayerCharacter() == true)
            return 0;

        // If the player is participating in a minigame (excluding FightClub fights), we hide
        // the other player's their 3D labels.
        if ((PlayerSpectateHandler->isSpectating(playerId) == true
            || (IsPlayerInMinigame(playerId) && !CFightClub__IsPlayerFighting(playerId)))
            && PlayerSettings(playerId)->isPlayerInfoEnabled() == true && m_labelsHidden[playerId] == false) {
            for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
                if (Player(subjectId)->isNonPlayerCharacter() == true)
                    continue;

                this->destroyPlayerInfoLabel(playerId, subjectId);
            }

            m_labelsHidden[playerId] = true;
        }

        // If a player isn't currently in a minigame, but the textlabels are still hidden, recreate
        // them for this player.
        if (PlayerSpectateHandler->isSpectating(playerId) == false && !IsPlayerInMinigame(playerId)
            && PlayerSettings(playerId)->isPlayerInfoEnabled() == true && m_labelsHidden[playerId] == true) {
            for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
                if (Player(subjectId)->isNonPlayerCharacter() == true)
                    continue;

                this->createPlayerInfoLabel(playerId, subjectId);
            }

            m_labelsHidden[playerId] = false;
        }

        // Update current existing textlabels for players who've enabled the playerinfo setting.
        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); subjectId++) {
            if (Player(subjectId)->isNonPlayerCharacter() == true)
                continue;

            if (PlayerSettings(subjectId)->isPlayerInfoEnabled() == false)
                continue;

            this->updatePlayerInfo(subjectId, playerId);
        }

        return 1;
    }

    /**
     * Supporting command to let players change their setting regarding the playerinfo textlabels,
     * showing a player's FPS, ping and packetloss percentage. This setting is saved for registered
     * players.
     *
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param params Any further text that the player passed to the command.
     * @command /my playerinfo [on/off]
     */
    @switch(PlayerCommand, "playerinfo")
    public onPlayerPlayerInfoCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* players don't need admins to change this setting for them */

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "The Player Info feature (FPS/ping/packetloss) currently is %s{FFFFFF} for you.",
                (PlayerSettings(subjectId)->isPlayerInfoEnabled() ?
                    "{33AA33}enabled" : "{DC143C}disabled"));

            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, " Usage: /my playerinfo [on/off]");

            return 1;
        }

        new bool: enabledPlayerInfo = Command->booleanParameter(params, 0) == true;
        PlayerSettings(subjectId)->setPlayerInfoEnabled(enabledPlayerInfo);

        format(message, sizeof(message), "The Player Info feature has been %s{33AA33} for you.",
            (enabledPlayerInfo ? "{33AA33}enabled" : "{DC143C}disabled"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }
};
