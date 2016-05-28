// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define MINIGUN_VIRTUAL_WORLD 5

SetPlayerUpForMinigun(playerId) {
    enum spawnInfo {
        Float: posX,
        Float: posY,
        Float: posZ,
        Float: angle
    }

    new Float: randomMinigunSpawns[37][spawnInfo] = {
        {2544.5032, 2805.8840, 19.9922,  257.5800},
        {2556.2554, 2832.5313, 19.9922,    1.9000},
        {2561.9175, 2848.5532, 19.9922,  256.6609},
        {2613.9866, 2848.4475, 19.9922,  102.2487},
        {2611.5500, 2845.7542, 16.7020,   87.5428},
        {2545.9243, 2839.1824, 10.8203,  176.2378},
        {2647.6553, 2805.0278, 10.8203,  285.1536},
        {2672.9387, 2800.3374, 10.8203,   60.4288},
        {2672.8306, 2792.1057, 10.8203,  121.8451},
        {2647.7834, 2697.5884, 19.3222,  353.1684},
        {2654.5427, 2720.3474, 19.3222,  303.5359},
        {2653.2063, 2738.2432, 19.3222,  342.1389},
        {2641.1350, 2703.2019, 25.8222,  191.6982},
        {2599.1304, 2700.7249, 25.8222,   76.3487},
        {2606.1384, 2721.5237, 25.8222,  261.2564},
        {2597.3745, 2748.0884, 23.8222,  273.2050},
        {2595.0657, 2776.6729, 23.8222,  254.3630},
        {2601.3640, 2777.8101, 23.8222,  253.4439},
        {2584.3940, 2825.1748, 27.8203,  244.5475},
        {2631.8110, 2834.2593, 40.3281,  213.2975},
        {2632.2852, 2834.9390, 122.9219, 197.6725},
        {2646.1997, 2817.7070, 36.3222,  182.0474},
        {2685.8875, 2816.6575, 36.3222,  129.9525},
        {2691.1233, 2787.7883, 59.0212,  208.0777},
        {2717.8071, 2771.3464, 74.8281,   72.3429},
        {2695.2622, 2699.5488, 22.9472,   66.3686},
        {2688.8206, 2689.0039, 28.1563,   14.8979},
        {2655.0229, 2650.6807, 36.9154,  341.8097},
        {2570.4668, 2701.2876, 22.9507,  204.0154},
        {2498.9915, 2704.6204, 10.9844,  168.9241},
        {2524.1584, 2743.3735, 10.9917,  150.3771},
        {2498.3167, 2782.3357, 10.8203,  251.7015},
        {2504.5142, 2805.9763, 14.8222,  108.6137},
        {2522.2144, 2814.7087, 24.9536,  265.9478},
        {2510.6292, 2849.6384, 14.8222,  191.4991},
        {2618.2646, 2720.8005, 36.5386,  346.6828},
        {2690.9980, 2741.9060, 19.0722,   91.6099}
    };

    SetPlayerVirtualWorld(playerId, SNIPER_VIRTUAL_WORLD);
    SetPlayerWorldBounds(playerId, 2760.0, 2485.0, 2866.0, 2656.0);

    new randomPosition = random(2500) % sizeof(randomMinigunSpawns);
    SetPlayerPos(playerId, randomMinigunSpawns[randomPosition][posX], randomMinigunSpawns[randomPosition][posY],
        randomMinigunSpawns[randomPosition][posZ]);
    SetPlayerFacingAngle(playerId, randomMinigunSpawns[randomPosition][angle]);

    TogglePlayerControllable(playerId, false);
    SetPlayerSpecialAction(playerId, SPECIAL_ACTION_NONE);
    SetPlayerSkinEx(playerId, 75);
    TogglePlayerControllable(playerId, true);

    ResetPlayerWeapons(playerId);
    GiveWeapon(playerId, 38, 999999);

    for (new forPlayerId = 0; forPlayerId <= PlayerManager->highestPlayerId(); ++forPlayerId) {
        if (Player(forPlayerId)->isConnected() == false)
            continue;

        ShowPlayerNameTagForPlayer(forPlayerId, playerId, 0);
    }

    ColorManager->setPlayerMinigameColor(playerId, Color::MinigameTransparentRed);
}