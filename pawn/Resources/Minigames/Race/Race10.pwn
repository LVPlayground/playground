// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 11: Stunt Race
//
// This is a Stunt Race in the desert of Las Venturas.
// Don't fall into the water ;-)
//
//

#define RACE10           10

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE10)
{
    // Set the race's ID number, used internally
    race_set_id( RACE10 );
    
    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Stunt" );
    race_set_maxtime( 500 );
    race_set_vehicle( 522 );
    race_set_weather( 18 );
    race_set_maydrop( 1 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 0 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -778.4225, 2759.0835, 45.3440 ,177.6984, 2, 2 );
    race_add_spawn( -772.2282, 2759.8003, 45.3440, 178.1397, 3, 3 );
    race_add_spawn( -766.4672, 2759.8386, 45.3440, 181.0551, 6, 6 );
    race_add_spawn( -759.2542, 2759.1931, 45.3440, 183.8960, 126, 126 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.

    race_add_checkpoint( -775.3583, 2696.6189, 45.0000, 20.0 );
    race_add_checkpoint( -702.8538, 2693.9250, 53.0000, 20.0 );
    race_add_checkpoint( -742.0288, 2644.8337, 62.0000, 20.0 );
    race_add_checkpoint( -732.6309, 2519.0000, 74.0000, 20.0 );
    race_add_checkpoint( -767.6415, 2562.2788, 83.5000, 20.0 );
    
    race_add_checkpoint( -729.2518, 2338.2024, 124.0000, 20.0 ); // 5
    race_add_checkpoint( -867.1990, 2308.8481, 157.0000, 20.0 ); // 6

    race_add_checkpoint( -1073.0059, 2293.6985, 86.0000, 20.0 );
    race_add_checkpoint( -1066.7391, 2122.7620, 86.0000, 20.0 );
    race_add_checkpoint( -1231.6827, 1936.8845, 41.0000, 20.0 );
    race_add_checkpoint( -1125.2462, 1803.8903, 40.0000, 20.0 );
    race_add_checkpoint( -880.7231, 1957.6317, 58.0000, 20.0 );
    race_add_checkpoint( -399.7307, 2080.0403, 60.0000, 20.0 );
    race_add_checkpoint( -275.6849, 2088.8210, 26.0000, 20.0 );
    race_add_checkpoint( -33.2263, 2245.8982, 37.0000, 20.0 );
    race_add_checkpoint( -114.7226, 2457.9204, 12.0000, 20.0 );
    race_add_checkpoint( -353.8941, 2502.2002, 35.0000, 20.0 );
    race_add_checkpoint( -741.2192, 2641.6074, 63.0000, 20.0 );
    race_add_checkpoint( -699.6169, 2692.1382, 54.0000, 20.0 );
    race_add_checkpoint( -774.3716, 2695.6714, 45.0000, 20.0 );
    race_add_checkpoint( -1203.2061, 2688.1670, 44.0000, 20.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race11 command. No messing around needed in the command files!
    return 1;
}
