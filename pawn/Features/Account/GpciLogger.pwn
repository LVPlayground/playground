// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

native gpci(playerid, serial[], len);

/**
 * Logs the "gpci" id of players upon their connection to a file, allowing bots to parse these files
 * and determine, among with other signals, whether the player might be evading a ban.
 *
 * The gpci is determined based on information derived from the Grand Theft Auto: San Andreas
 * installation directory the player is using to connect to Las Venturas Playground. It is not
 * a unique id, so shouldn't be used as a definitive signal on its own.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class GpciLogger {
    /**
     * Writes the player's gpci to a file upon their connection.
     *
     * @param playerId Id of the player who has connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        new File: handle = fopen("gpci/gpci.txt", io_append);
        if (!handle)
            return;

        new playerRecord[MAX_PLAYER_NAME /* nickname */ + 3 /* id */ + 16 /* ip */ + 40 /* gpci */ + 5 /* separators */ + 1 /* null */], 
            playerGpci[40 + 1];

        gpci(playerId, playerGpci, sizeof(playerGpci));

        format(playerRecord, sizeof(playerRecord), "%s,%i,%s,%s\r\n",
            Player(playerId)->nicknameString(), playerId,
            Player(playerId)->ipAddressString(), playerGpci);

        fwrite(handle, playerRecord);
        fclose(handle);
    }
};
