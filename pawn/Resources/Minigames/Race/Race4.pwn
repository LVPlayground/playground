// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// -------------------------------------------------------------------------------------------------
//
// Converted: quad_race.json
//
// -------------------------------------------------------------------------------------------------

//
// Las Venturas Playground: Race 1: Coast Takedown
//
// This race is the first race that can be played on Las Venturas Playground,
// it happens near the Los Santos coast, and forces you to drive around
// Los Santos. You come around the airport, and yay, back you go again.
//

#define RACE4           4

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE4)
{
    // Set the race's ID number, used internally
    race_set_id( RACE4 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Quad" );
    race_set_maxtime( 500 );
    race_set_vehicle( 471 );
    race_set_weather( 10 );
    race_set_maydrop( 1 );
    race_set_airrace( 0 );
    race_set_time( 14, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 2470.0000, -44.2200, 26.0000, 0.0000, 0,6 );
    race_add_spawn( 2467.0000, -44.2200, 26.0000, 0.0000, 0,3 );
    race_add_spawn( 2464.0000, -44.2200, 26.0000, 0.0000, 0,2 );
    race_add_spawn( 2461.0000, -44.2200, 26.0000, 0.0000, 0,126 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 2463.9189, 0.5225, 25.8183, 6.0 );
    race_add_checkpoint( 2446.0042, 41.7219, 25.8181, 5.0 );
    race_add_checkpoint( 2393.9519, 55.0828, 25.8169, 5.0 );
    race_add_checkpoint( 2317.8340, 91.7213, 25.8186, 5.0 );
    race_add_checkpoint( 2128.1772, 96.3633, 35.2927, 5.0 );
    race_add_checkpoint( 1944.0861, 168.0800, 36.7602, 5.0 );
    race_add_checkpoint( 1686.3807, 236.1296, 12.9278, 5.0 );
    race_add_checkpoint( 1492.1356, 222.4829, 18.5314, 5.0 );
    race_add_checkpoint( 1282.8047, 238.4672, 18.8894, 5.0 );
    race_add_checkpoint( 1195.3429, 54.1080, 33.4319, 5.0 );
    race_add_checkpoint( 832.5940, 39.0481, 80.6674, 5.0 );
    race_add_checkpoint( 534.6672, 3.4700, 23.7687, 5.0 );
    race_add_checkpoint( 429.4599, 6.6637, 6.2969, 5.0 );
    race_add_checkpoint( 333.9486, -137.2542, 0.8972, 5.0 );
    race_add_checkpoint( 232.7163, -220.7253, 0.9068, 5.0 );
    race_add_checkpoint( 327.4531, -388.6572, 11.0782, 5.0 );
    race_add_checkpoint( 660.6066, -466.9832, 15.8172, 5.0 );
    race_add_checkpoint( 904.9564, -548.6035, 25.0286, 5.0 );
    race_add_checkpoint( 1241.4602, -311.1089, 9.4000, 5.0 );
    race_add_checkpoint( 1247.2717, -137.3090, 39.0679, 5.0 );
    race_add_checkpoint( 1429.9130, -213.1469, 7.4821, 5.0 );
    race_add_checkpoint( 1558.5165, -2.4910, 22.7247, 5.0 );
    race_add_checkpoint( 1588.5879, 127.1203, 29.5863, 5.0 );
    race_add_checkpoint( 2048.4924, 42.1756, 27.7466, 5.0 );
    race_add_checkpoint( 2293.5632, 24.1354, 25.8172, 5.0 );
    race_add_checkpoint( 2212.1897, -14.4100, 25.3346, 5.0 );
    race_add_checkpoint( 2124.0403, -89.4715, 1.5425, 5.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

