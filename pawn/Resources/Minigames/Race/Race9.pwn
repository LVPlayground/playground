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

#define RACE9           9

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE9)
{
    // Set the race's ID number, used internally
    race_set_id( RACE9 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Air" );
    race_set_maxtime( 500 );
    race_set_vehicle( 553 );
    race_set_weather( 10 );
    race_set_maydrop( 0 );
    race_set_airrace( 1 );
    race_set_time( 19, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    
    race_set_type( RACE_TYPE_AIR );
    
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -40.0000, 2482.0000, 20.7756, 270.0000, 6, 6 );
    race_add_spawn( -40.0000, 2520.0000, 20.8245, 270.0000, 3, 3 );
    race_add_spawn( -76.0000, 2482.0000, 20.0034, 270.0000, 2, 2 );
    race_add_spawn( -76.0000, 2520.0000, 20.0209, 270.0000, 126, 126 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 170.1583, 2503.0449, 17.8560, 20.0 );
    race_add_checkpoint( 385.0237, 2503.8149, 34.9587, 20.0 );
    race_add_checkpoint( 642.8912, 2480.0293, 62.1707, 20.0 );
    race_add_checkpoint( 752.4961, 2292.8137, 66.6466, 20.0 );
    race_add_checkpoint( 694.2375, 2089.6992, 78.4949, 20.0 );
    race_add_checkpoint( 520.8702, 2029.0107, 80.4278, 20.0 );
    race_add_checkpoint( -28.4064, 2168.2700, 87.5384, 20.0 );
    race_add_checkpoint( -241.5567, 2224.7742, 83.0340, 20.0 );
    race_add_checkpoint( -530.3356, 2173.4734, 115.1792, 20.0 );
    race_add_checkpoint( -669.1522, 1959.9420, 126.0853, 20.0 );
    race_add_checkpoint( -598.2023, 1586.1543, 137.0659, 20.0 );
    race_add_checkpoint( -530.2527, 1252.4521, 119.5862, 20.0 );
    race_add_checkpoint( -798.1266, 699.9220, 68.9815, 20.0 );
    race_add_checkpoint( -1028.6144, 463.5259, 28.3715, 20.0 );
    race_add_checkpoint( -1131.3033, 359.0857, 17.4839, 20.0 );
    race_add_checkpoint( -1401.8673, 90.9214, 14.8761, 20.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

