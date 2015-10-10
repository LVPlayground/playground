// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 13: Hill Race
//
// Mutli-lap Hill Race
//

#define RACE13           13

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE13)
{
    // Set the race's ID number, used internally
    race_set_id( RACE13 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Hill" );
    race_set_maxtime( 500 );
    race_set_vehicle( 471 );
    race_set_weather( 9 );
    race_set_maydrop( 1 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 2 );
    race_set_nos( 0 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 1012.5720, -6.9400, 91.2500, 278.6901, 2, 2);
    race_add_spawn( 1011.1252, -0.6554, 91.2978, 275.3743, 3, 3);
    race_add_spawn( 1006.2891, -1.9850, 91.6500, 278.9543, 6, 6);
    race_add_spawn( 1007.1085, -6.7077, 91.6500, 285.7739, 126, 126);
    race_add_spawn( 1002.8780, -7.8951, 91.9500, 285.6202, 0,0);
    race_add_spawn( 1004.3960, -2.8087, 91.9500, 280.6389, 86, 86);

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 1111.8815, 4.1156, 64.0000, 10.0 );
    race_add_checkpoint( 878.1915, -37.6495, 62.0000, 10.0 );
    race_add_checkpoint( 699.2062, -20.1443, 28.0000, 10.0 );
    race_add_checkpoint( 1012.0726, -3.0955, 91.0000, 10.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race13 command. No messing around needed in the command files!
    return 1;
}
