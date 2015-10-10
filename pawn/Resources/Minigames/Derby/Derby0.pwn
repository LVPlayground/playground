// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
                Las Venturas Playground v2.90 - Derby 1.
    This derby is featured in the bloodbowel. It is the same as the old
            derby 1, only re-done to use the new handler.

*******************************************************************************/


#define DERBY0           0

derby_create(DERBY0)
{

    derby_set_id(DERBY0);

    derby_set_name("Bloodbowl 1");

    derby_set_interior(15);

    derby_set_vehicle(504);

    derby_set_timelimit(3*60);

    derby_enable_cannon();

    derby_countdown_mode(DERBY_COUNTDOWN_ENGINE);

    derby_add_spawn(-1279.7775, 994.8470, 1037.0243, 90.000);
    derby_add_spawn(-1517.5975, 993.8068, 1037.4318, 270.0000);
    derby_add_spawn(-1410.2723,935.5204,1036.2429,268.945);
    derby_add_spawn(-1397.0000, 1058.9507, 1038.3235, 180.0000);
    derby_add_spawn(-1329.9623, 939.1003, 1036.1882, 25.8612);
    derby_add_spawn(-1501.0391, 962.1718, 1036.8732, 312.6543);
    derby_add_spawn(-1466.7170, 1052.3577, 1038.3087, 205.8057);
    derby_add_spawn(-1316.2698, 1045.6909, 1037.9373, 139.4159);

    derby_add_pickup(DERBY_PICKUP_RANDOM,-1440.9452,964.8389,1025.0952,20);

    return 1;
}

