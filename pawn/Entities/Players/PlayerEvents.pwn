// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * We encapsulate all callbacks in the PlayerEvents class for a few reasons. Firstly, this allows
 * us to have more control over what happens, and class-based debugging tools can jump in more
 * easily. Furthermore, some operations need to be prioritized in a non-random way.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerEvents <playerId (MAX_PLAYERS)> {
    /**
     * The OnPlayerConnect callback will be invoked by the SA-MP server once a player has connected
     * and is able to spawn. This is the time to initialize and reset settings for the player.
     *
     * @return integer Any value, as Pawn sets a requirement for public functions to return a value.
     */
    public onPlayerConnect() {
        if (this->detectInvalidConnectionValues())
            return Kick(playerId);

        PlayerManager->onPlayerConnect(playerId);
        Player(playerId)->onConnect();

        if (Player(playerId)->isNonPlayerCharacter() == false)
            Instrumentation->recordActivity(PlayerConnectActivity);

        Annotation::ExpandList<OnPlayerConnect>(playerId);

        return OnPlayerLVPConnect(playerId);
    }

    /**
     * Detects invalid values in the data the player has transmitted to the server. Invalid values
     * are often used to crash a server, which is a highly undesirable situation.
     *
     * @return boolean Whether invalid values were detected.
     */
    private bool: detectInvalidConnectionValues() {
        if (IsPlayerNPC(playerId))
            return false;  // NPCs send bogus data by default

        new nickname[128], hash[128];

        GetPlayerName(playerId, nickname, sizeof(nickname));
        gpci(playerId, hash, sizeof(hash));

        if (!(3 < strlen(nickname) <= MAX_PLAYER_NAME)) {
            printf("Player [%d] connected with an invalid nickname.", playerId);
            return true;  // a player's nickname must be [3, MAX_PLAYER_NAME] characters, inclusive
        }

        if (!(24 < strlen(hash) <= 64)) {
            printf("Player [%d, %s] connected with an invalid GPCI.", playerId, nickname);
            return true;  // a player's GPCI must be [24, 64] characters, inclusive
        }

        return false;
    }

    /**
     * After a player leaves the server, this method will be invoked allowing the gamemode to do all
     * required clean-up work. The reason parameter can have three valid values, namely (0) when the
     * player times out, (1) when they leave by closing GTA, or (2) when they are kicked or banned.
     *
     * @param reason The reason for the player's disconnection.
     */
    public onPlayerDisconnect(reason) {
        if (!Player(playerId)->isConnected())
            return 1;

        Annotation::ExpandList<OnPlayerDisconnect>(playerId);

        if (Player(playerId)->isNonPlayerCharacter() == false) {
            Instrumentation->recordActivity(PlayerDisconnectActivity, 
                Time->currentTime() - Player(playerId)->connectionTime());
        }

        /// @todo Get rid of the OnPlayerLVPDisconnect function.
        OnPlayerLVPDisconnect(playerId, reason);

        Player(playerId)->onDisconnect();
        PlayerManager->onPlayerDisconnect(playerId);

        return 1;
    }

    /**
     * Called up to fifty times per second for every player in the game. This is a very hot function
     * so please don't randomly add your code in here. Critical functionality should be optimized as
     * much as you can, as this historically shows up in profiles.
     */
    public onPlayerUpdate() {
        // Mark when we received the last update for this player, so that we can monitor whether
        // they've minimized their Grand Theft Auto game or not.
        Player(playerId)->setLastUpdate(Time->currentHighResolutionTime());

        return 1;
    }

    /**
     * Invoked when the player right-clicks anywhere on the San Andreas map, through the option
     * available to them in GTA's menu.
     *
     * @param positionX X-coordinate of the location where they clicked.
     * @param positionY Y-coordinate of the location where they clicked.
     * @param positionZ Z-coordinate of the location where they clicked. Inaccurate.
     */
    public onPlayerClickMap(Float: positionX, Float: positionY, Float: positionZ) {
        if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
            return 0;

        // Forward the OnPlayerClickMap callback to those who are interested in it.
        Annotation::ExpandList<OnPlayerClickMap>(playerId, positionX, positionY, positionZ);

        return 1;
    }

    /**
     * Invoked when the player clicks a selectable textdraw.
     *
     * @param clickedId Id of the textdraw which the player clicked on.
     */
    public onPlayerClickTextDraw(Text: clickedId) {
        if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter() == true)
            return 0;

        // A fix for the CancelSelectTextDraw loop which calls this function with INVALID_TEXT_DRAW.
        if (clickedId == Text: INVALID_TEXT_DRAW)
            return 1;

        // Forward the OnPlayerClickTextDraw callback to those who are interested in it.
        Annotation::ExpandList<OnPlayerClickTextDraw>(playerId, clickedId);

        return 1;
    }
};

/**
 * Forward each of the methods to their documented counterpart in the PlayerEvents class, where our
 * implementation will reside. The cost of introducing an additional call here is negligible.
 */
public OnPlayerConnect(playerid) { return PlayerEvents(playerid)->onPlayerConnect(); }
public OnPlayerDisconnect(playerid, reason) { return PlayerEvents(playerid)->onPlayerDisconnect(reason); }
public OnPlayerUpdate(playerid) { return PlayerEvents(playerid)->onPlayerUpdate(); }
public OnPlayerClickMap(playerid, Float:fX, Float:fY, Float:fZ) { PlayerEvents(playerid)->onPlayerClickMap(fX, fY, fZ); return 1; }
public OnPlayerClickTextDraw(playerid, Text:clickedid) { return PlayerEvents(playerid)->onPlayerClickTextDraw(clickedid); }