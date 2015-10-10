// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 16: Engine in jeopardy
//
// Long around-san andreas race by Peta. Awesomeish
//

#define RACE16           16

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE16)
{
    // Set the race's ID number, used internally
    race_set_id( RACE16 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Engine in Jeopardy" );
    race_set_maxtime( 900 );
    race_set_vehicle( 506 );
    race_set_weather( 18 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 0 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -1717.0920, 2729.6956, 60.6684, 94.7970, 2, 2 );
    race_add_spawn( -1716.8855, 2735.6892, 60.6534, 92.8246, 3, 3 );
    race_add_spawn( -1727.5999, 2734.7563, 60.3241, 99.3993, 6, 6 );
    race_add_spawn( -1726.3347, 2729.1487, 60.4328, 99.7658, 126, 126 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( -1824.6049, 2687.7178, 55.2326, 20 );
    race_add_checkpoint( -2369.8110, 2673.3589, 58.4730, 20 );
    race_add_checkpoint( -2761.9258, 2326.4995, 70.4007, 20 );
    race_add_checkpoint( -2686.4072, 1276.7740, 55.0548, 20 );
    race_add_checkpoint( -2728.1528, 1194.9135, 53.4120, 20 );
    race_add_checkpoint( -2741.5789, 1065.4812, 47.3571, 20 );
    race_add_checkpoint( -2750.4963, 558.1094, 14.0232, 20 );
    race_add_checkpoint( -2706.7727, 396.6914, 3.9920, 20 );
    race_add_checkpoint( -2718.4114, -208.9361, 4.3283, 20 );
    race_add_checkpoint( -2809.5627, -236.1055, 6.6557, 20 );
    race_add_checkpoint( -2823.4019, -520.3840, 6.6711, 20 );
    race_add_checkpoint( -2920.7031, -1828.1611, 28.8118, 20 );
    race_add_checkpoint( -2515.1147, -2303.0359, 28.7382, 20 );
    race_add_checkpoint( -2011.0298, -2679.2017, 53.5270, 20 );
    race_add_checkpoint( -1868.2625, -2689.4612, 53.7187, 20 );
    race_add_checkpoint( -1421.5271, -2924.8066, 46.5503, 20 );
    race_add_checkpoint( -807.2044, -2823.7854, 54.8958, 20 );
    race_add_checkpoint( 9.0281, -2659.4180, 39.8763, 20 );
    race_add_checkpoint( -34.1066, -1409.4628, 11.1239, 20 );
    race_add_checkpoint( -9.9637, -1520.3156, 1.9381, 20 );
    race_add_checkpoint( 183.8065, -1620.0725, 14.0624, 20 );
    race_add_checkpoint( 1046.5314, -1916.3070, 12.5833, 20 );
    race_add_checkpoint( 1331.8281, -2556.5718, 12.9995, 20 );
    race_add_checkpoint( 2176.0281, -2455.6440, 12.9999, 20 );
    race_add_checkpoint( 2818.7908, -2120.0334, 10.5562, 20 );
    race_add_checkpoint( 2907.7153, -1280.7788, 10.4996, 20 );
    race_add_checkpoint( 2896.8247, -530.5847, 12.0993, 20 );
    race_add_checkpoint( 2863.3318, 60.0397, 18.1064, 20 );
    race_add_checkpoint( 2790.0806, 222.6425, 10.4771, 20 );
    race_add_checkpoint( 2759.4832, 1057.4618, 10.6627, 20 );
    race_add_checkpoint( 2662.4219, 2481.1721, 6.4650, 20 );
    race_add_checkpoint( 1621.5908, 2474.0405, 6.7010, 20 );
    race_add_checkpoint( 1028.2135, 2547.7932, 10.4779, 20 );
    race_add_checkpoint( 551.6702, 2658.2495, 45.1471, 20 );
    race_add_checkpoint( -168.9174, 2635.8899, 63.3417, 20 );
    race_add_checkpoint( -626.9508, 2752.9534, 60.3572, 20 );
    race_add_checkpoint( -1395.9663, 2700.5176, 57.0329, 20 );
    race_add_checkpoint( -1691.7866, 2728.2393, 61.3857, 20 );

    // And we're done, the entire race is now loaded and playable under the
    // /race16 command. No messing around needed in the command files!
    return 1;
}
