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

#define RACE8           8

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE8)
{
    // Set the race's ID number, used internally
    race_set_id( RACE8 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Boat" );
    race_set_maxtime( 500 );
    race_set_vehicle( 493 );
    race_set_weather( 19 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 15, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 13.0000, -567.0000, 1.0000, 135.0000, 2, 2 );
    race_add_spawn( 9.0000, -563.0000, 1.0000, 135.0000, 3, 3 );
    race_add_spawn( 23.0000, -557.0000, 1.0000, 135.0000, 6, 6 );
    race_add_spawn( 19.0000, -553.0000, 1.0000, 135.0000, 126, 126 );

    race_set_type( RACE_TYPE_BOAT );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( -66.3354, -639.4377, -0.0964, 15.0 );
    race_add_checkpoint( -134.8734, -844.1473, -0.1112, 15.0 );
    race_add_checkpoint( -33.1181, -912.2854, -0.1076, 15.0 );
    race_add_checkpoint( 58.0642, -928.6135, -0.1221, 15.0 );
    race_add_checkpoint( 78.2700, -1135.0116, -0.2398, 15.0 );
    race_add_checkpoint( 42.9509, -1302.9492, -0.1279, 15.0 );
    race_add_checkpoint( 51.5589, -1524.7551, -0.2030, 15.0 );
    race_add_checkpoint( -20.7162, -1840.7646, -0.3418, 15.0 );
    race_add_checkpoint( 125.9118, -1899.8772, 1.1587, 15.0 );
    race_add_checkpoint( 156.9572, -1899.8772, 10.0766, 15.0 );
    race_add_checkpoint( 370.2351, -1961.7347, -0.1861, 15.0 );
    race_add_checkpoint( 722.8077, -1912.9171, -0.0889, 15.0 );
    race_add_checkpoint( 724.3759, -1504.1586, 0.1684, 15.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

