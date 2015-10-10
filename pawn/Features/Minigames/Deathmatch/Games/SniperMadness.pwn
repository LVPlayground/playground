// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Sniper Madness minigame is a free-for-all deathmatch minigame in which players spawn at the
 * powerplant to the north-east of Las Venturas with a sniper. They'll have full health and armour,
 * be invisible for all other players and the environment will be foggy.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SniperMadness {
    // The minigame Id which represents the Sniper Madness.
    public const MinigameId = @counter(Minigame);

    // The publicly visible name for this deathmatch minigame.
    public const Name = "Sniper Madness";

    // The command players should execute if they want to play this minigame.
    public const Command = "sniper";

    /**
     * Players are able to start or join the Sniper Madness minigame by typing the /sniper command.
     * When they do, they will be signed up for the minigame if that's possible.
     *
     * @param playerId Id of the player who's interested in joining this minigame.
     * @param params Additional parameters passed on to the command. Ignored.
     * @command /sniper
     */
    @command("sniper")
    public onSniperCommand(playerId, params[]) {
        MinigameSignup->joinMinigame(playerId, DeathmatchMinigame, SniperMadness::MinigameId,
            SniperMadness::Name, SniperMadness::Command);

        return 1;
        #pragma unused params
    }
};
