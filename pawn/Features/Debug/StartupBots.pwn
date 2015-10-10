// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * As a useful aid in debugging overflow crashes, the server is able to connect any number of bots
 * during start-up. As a consequence of their presence, any actual human connecting to the server
 * will get at least the [number of bots] + 1 as their player Id.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class StartupBots {
    // What is the name of the Pawn script (without .amx) that the bots should use?
    const BotScriptName = "npcidle";

    /**
     * The constructor will connect the requested number of bots to the server.
     */
    public __construct() {
        if (!Debug::NumberOfBotsToConnectAtStartup)
            return;

        printf("[Loader] Connecting %d Startup Bots..", Debug::NumberOfBotsToConnectAtStartup);

        new nickname[32];
        for (new botId = 0; botId < Debug::NumberOfBotsToConnectAtStartup; ++botId) {
            format(nickname, sizeof(nickname), "LVP_B%03d", botId);
            ConnectNPC(nickname, BotScriptName);
        }
    }
};
