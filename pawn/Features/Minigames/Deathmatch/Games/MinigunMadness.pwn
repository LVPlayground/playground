// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Minigun Madness is a free-for-all minigame in which each player receives a minigun and is
 * tasked to kill all the other players. Simple, effective and fast.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class MinigunMadness {
    // The minigame Id which represents the Minigun Madness.
    public const MinigameId = @counter(Minigame);

    // The publicly visible name for this deathmatch minigame.
    public const Name = "Minigun Madness";

    // The command players should execute if they want to play this minigame.
    public const Command = "minigun";

    /**
     * Players are able to start or join the Minigum Madness minigame by typing the /minigun command.
     * When they do, they will be signed up for the minigame if that's possible.
     *
     * @param playerId Id of the player who's interested in joining this minigame.
     * @param params Additional parameters passed on to the command. Ignored.
     * @command /minigun
     */
    @command("minigun")
    public onMinigunCommand(playerId, params[]) {
        MinigameSignup->joinMinigame(playerId, DeathmatchMinigame, MinigunMadness::MinigameId,
            MinigunMadness::Name, MinigunMadness::Command);

        return 1;
        #pragma unused params
    }
};
