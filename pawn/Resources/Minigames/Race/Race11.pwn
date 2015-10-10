// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 11: Woody Race
//
// Race in the former woods of Red County.
//
//

#define RACE11           11

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE11)
{
    // Set the race's ID number, used internally
    race_set_id( RACE11 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Woody" );
    race_set_maxtime( 500 );
    race_set_vehicle( 470 );
    race_set_weather( 20 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 0 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -548.3867, -191.9115, 78.3978, 270.0302, 2, 2 );
    race_add_spawn( -547.8912, -187.0549, 78.3994, 268.8917, 3, 3);
    race_add_spawn( -556.1069, -191.9115, 78.3978, 270.0285, 6, 6 );
    race_add_spawn( -555.0574, -187.0549, 78.3984, 268.8903, 126, 126);

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.

    race_add_checkpoint( -454.1565, -185.5415, 76.9277, 20.0 );
    race_add_checkpoint( -363.1364, -48.6441, 39.5548, 20.0 );
    race_add_checkpoint( -297.0025, 101.5197, 7.3743, 20.0 );
    race_add_checkpoint( -319.2949, 179.8812, 6.1279, 20.0 );
    race_add_checkpoint( -668.1946, 151.8933, 27.1900, 20.0 );
    race_add_checkpoint( -610.5020, -76.2268, 63.2484, 20.0 );
    race_add_checkpoint( -489.6745, 28.4533, 46.7863, 20.0 );
    race_add_checkpoint( -701.7272, 224.4477, 2.5663, 20.0 );
    race_add_checkpoint( -770.3952, 19.8339, 33.3204, 20.0 );
    race_add_checkpoint( -671.7669, 6.0282, 66.5000, 20.0 );
    race_add_checkpoint( -828.1807, -165.5912, 65.3650, 20.0 );
    race_add_checkpoint( -545.5344, -188.9454, 78.4008, 20.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race11 command. No messing around needed in the command files!
    return 1;
}
