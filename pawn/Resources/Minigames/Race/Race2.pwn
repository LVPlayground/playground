// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// -------------------------------------------------------------------------------------------------
//
// Converted: normal_race.json
//
// -------------------------------------------------------------------------------------------------

//
// Las Venturas Playground: Race 1: Coast Takedown
//
// This race is the first race that can be played on Las Venturas Playground,
// it happens near the Los Santos coast, and forces you to drive around
// Los Santos. You come around the airport, and yay, back you go again.
//

#define RACE2           2

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE2)
{
    // Set the race's ID number, used internally
    race_set_id( RACE2 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Normal" );
    race_set_maxtime( 500 );
    race_set_vehicle( 522 );
    race_set_weather( 18 );
    race_set_maydrop( 1 );
    race_set_airrace( 0 );
    race_set_time( 21, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 1164.2050, -1134.6285, 23.2254, 358.50, -1, -1 );
    race_add_spawn( 1162.5023, -1134.1244, 23.2352, 358.50, -1, -1 );
    race_add_spawn( 1160.8435, -1134.5485, 23.2356, 358.50, -1, -1 );
    race_add_spawn( 1159.3264, -1134.6077, 23.2293, 358.50, -1, -1 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 1158.0519, -916.3906, 42.2880, 15.0 );
    race_add_checkpoint( 1248.9576, -336.7861, 6.1752, 15.0 );
    race_add_checkpoint( 1352.7019, -34.6912, 34.1436, 15.0 );
    race_add_checkpoint( 1459.8367, 174.4490, 25.2380, 15.0 );
    race_add_checkpoint( 1142.8296, 402.8703, 25.5250, 15.0 );
    race_add_checkpoint( 575.6768, 285.1383, 17.4089, 15.0 );
    race_add_checkpoint( 500.4075, -283.3174, 39.8664, 15.0 );
    race_add_checkpoint( 264.3361, -569.4389, 38.8921, 15.0 );
    race_add_checkpoint( -94.4051, -1025.6466, 23.6669, 15.0 );
    race_add_checkpoint( 3.5686, -1475.0807, 3.6614, 15.0 );
    race_add_checkpoint( -35.6812, -1388.7163, 10.7921, 15.0 );
    race_add_checkpoint( 641.9627, -1221.3713, 17.8376, 15.0 );
    race_add_checkpoint( 1147.4009, -1145.0419, 23.2263, 25.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

