// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 12: Done in 60 Seconds
//
// Short race, can be done within 60 seconds, easy race.
//

#define RACE12           12

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE12)
{
    // Set the race's ID number, used internally
    race_set_id( RACE12 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Done in 60 Seconds" );
    race_set_maxtime( 500 );
    race_set_vehicle( 568 );
    race_set_weather( 19 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 0 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 1556.8678, 16.1826, 23.7281, 188.1612, 2, 2);
    race_add_spawn( 1561.7576, 16.1826, 23.7281, 188.1612, 3, 3);
    race_add_spawn( 1559.7313, 25.4698, 23.7150, 193.1370, 6, 6);
    race_add_spawn( 1554.5973, 25.4698, 23.7150, 193.0343, 126, 126);

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 1543.0714, -156.2551, 16.0628, 20.0 );
    race_add_checkpoint( 1231.5793, -120.1746, 38.7492, 20.0 );
    race_add_checkpoint( 808.6498, -114.8761, 23.3172, 20.0);
    race_add_checkpoint( 458.0771, -282.9442, 9.3985, 20.0 );
    race_add_checkpoint( 306.8331, -374.6607, 9.1149, 20.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race12 command. No messing around needed in the command files!
    return 1;
}
