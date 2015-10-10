// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 17: Las Venturas Speedway
//
// High speed Las Venturas race by Badeend.
//

#define RACE17           17

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE17)
{
    // Set the race's ID number, used internally
    race_set_id( RACE17 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Las Venturas Speedway" );
    race_set_maxtime( 700 );
    race_set_vehicle( 411 );
    race_set_weather( 1 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 368.8084, 2712.7344, 60.3313, 253.8853, 2, 2 );
    race_add_spawn( 364.6701, 2707.4717, 60.3130, 255.4552, 3, 3 );
    race_add_spawn( 351.1531, 2717.8337, 60.0806, 253.8805, 6, 6 );
    race_add_spawn( 351.6018, 2712.0168, 60.1581, 252.2946, 126, 126 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 538.9194, 2724.6736, 64.6785, 15 );
    race_add_checkpoint( 876.3699, 2600.8982, 28.0628, 15 );
    race_add_checkpoint( 750.5639, 2425.9263, 19.7620, 15 );
    race_add_checkpoint( 813.2634, 1943.5251, 6.3483, 15 );
    race_add_checkpoint( 837.8973, 1544.9940, 17.6426, 15 );
    race_add_checkpoint( 831.1591, 1224.7460, 27.1050, 15 );
    race_add_checkpoint( 148.6667, 893.9843, 20.2712, 15 );
    race_add_checkpoint( -280.3624, 795.9366, 14.9622, 15 );
    race_add_checkpoint( -314.9128, 920.8738, 10.9802, 15 );
    race_add_checkpoint( -629.5778, 1213.6079, 11.4369, 15 );
    race_add_checkpoint( -730.9415, 1238.4574, 13.1399, 15 );
    race_add_checkpoint( -984.5506, 1725.4557, 30.5340, 15 );
    race_add_checkpoint( -1335.7333, 2011.6588, 53.7400, 15 );
    race_add_checkpoint( -1084.9189, 2702.1829, 45.5969, 15 );
    race_add_checkpoint( -631.4655, 2752.7312, 60.3756, 15 );
    race_add_checkpoint( -300.0888, 2632.9792, 62.8659, 15 );
    race_add_checkpoint( 368.8035, 2712.7349, 60.3325, 15 );


    // And we're done, the entire race is now loaded and playable under the
    // /race17 command. No messing around needed in the command files!
    return 1;
}
