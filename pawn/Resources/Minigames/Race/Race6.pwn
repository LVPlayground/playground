// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 1: Coast Takedown
//
// This race is the first race that can be played on Las Venturas Playground,
// it happens near the Los Santos coast, and forces you to drive around
// Los Santos. You come around the airport, and yay, back you go again.
//

#define RACE6           6

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE6)
{
    // Set the race's ID number, used internally
    race_set_id( RACE6 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Dirty" );
    race_set_maxtime( 500 );
    race_set_vehicle( 468 );
    race_set_weather( 10 );
    race_set_maydrop( 1 );
    race_set_airrace( 0 );
    race_set_time( 11, 0 );
    race_set_laps( 2 );
    race_set_interior( 4 );

    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -1382.5000, -660.0000, 1055.7100, 90.0000, 6, 5 );
    race_add_spawn( -1382.5000, -663.0000, 1055.7100, 90.0000, 6, 5 );
    race_add_spawn( -1382.5000, -666.0000, 1055.7100, 90.0000, 6, 5 );
    race_add_spawn( -1382.5000, -669.0000, 1055.7100, 90.0000, 6, 5 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( -1427.6289, -663.8555, 1059.7811, 7.0 );
    race_add_checkpoint( -1482.5558, -657.6473, 1055.5725, 7.0 );
    race_add_checkpoint( -1478.5491, -611.9074, 1055.9659, 7.0 );
    race_add_checkpoint( -1419.6672, -621.9334, 1052.3190, 7.0 );
    race_add_checkpoint( -1445.0730, -682.8519, 1053.2527, 7.0 );
    race_add_checkpoint( -1350.8408, -719.4795, 1055.5349, 7.0 );
    race_add_checkpoint( -1377.5194, -683.7310, 1053.4545, 7.0 );
    race_add_checkpoint( -1341.7905, -633.4376, 1053.7496, 7.0 );
    race_add_checkpoint( -1369.7123, -590.2598, 1055.7078, 7.0 );
    race_add_checkpoint( -1523.5306, -603.0933, 1055.7491, 7.0 );
    race_add_checkpoint( -1437.4156, -739.8591, 1053.9781, 7.0 );
    race_add_checkpoint( -1293.4811, -721.4753, 1052.9530, 7.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

