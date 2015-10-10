// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Include the deathmatch minigames which are available on the server.
#include "Features/Minigames/Deathmatch/Games/MinigunMadness.pwn"
#include "Features/Minigames/Deathmatch/Games/SniperMadness.pwn"

/**
 * The Deathmatch Controller controls the individual deathmatch minigames which may be active right
 * now in Las Venturas Playground. It's the main receiver for the minigame progress methods.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class DeathmatchController {
    // The amount of money a player has to pay in order to participate in a deathmatch minigame.
    const DeathmatchMinigameSignupPrice = 10000;

    // The minimum number of players needed in order to start a deathmatch minigame.
    const DeathmatchMinigameMinimumPlayerCount = 2;

    // The maximum number of players who can participate in a deathmatch minigame at once.
    const DeathmatchMinigameMaximumPlayerCount = 8;

    /**
     * Returns the amount of money which is required in order for a player to sign up to any
     * deathmatch minigame. The method will be automatically accessed from the MinigameSignup class.
     *
     * @param minigameId Id of the minigame in case we want to specialize the price. Ignored.
     * @return integer The amount of money a player has to pay to sign up for a minigame.
     */
    @switch(MinigameSignupPrice, DeathmatchMinigame)
    public deathmatchMinigameSignupPrice(minigameId) {
        return DeathmatchMinigameSignupPrice;

        #pragma unused minigameId
    }

    /**
     * Returns the minimum number of players who need to have signed up in order to start a deathmatch
     * minigame. If less than this number of players has signed up, the game will be aborted.
     *
     * @param minigameId Id of the minigame in case we want to specialize the count. Ignored.
     * @return integer The minimum number of participants in a deathmatch minigame.
     */
    @switch(MinigameMinimumPlayerCount, DeathmatchMinigame)
    public deathmatchMinigameMinimumPlayerCount(minigameId) {
        return DeathmatchMinigameMinimumPlayerCount;

        #pragma unused minigameId
    }

    /**
     * Returns the maximum number of participants deathmatch minigames are able to support. The
     * Signup Controller will use this to kick off the minigame when it's full.
     *
     * @param minigameId Id of the minigame in case we want to specialize the count. Ignored.
     * @return integer The maximum number of participants in a deathmatch minigame.
     */
    @switch(MinigameMaximumPlayerCount, DeathmatchMinigame)
    public deathmatchMinigameMaximumPlayerCount(minigameId) {
        return DeathmatchMinigameMaximumPlayerCount;

        #pragma unused minigameId
    }
};
