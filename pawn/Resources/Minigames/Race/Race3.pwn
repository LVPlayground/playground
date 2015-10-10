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

#define RACE3           3

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE3)
{
    // Set the race's ID number, used internally
    race_set_id( RACE3 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Hard" );
    race_set_maxtime( 500 );
    race_set_vehicle( 495 );
    race_set_weather( 19 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 19, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -2314.5796, -1688.9640, 482.1374, 228.2500, 118,117 );
    race_add_spawn( -2311.5325, -1685.5397, 482.3105, 228.2500, 118,117 );
    race_add_spawn( -2321.0486, -1683.1886, 482.5830, 228.2500, 118,117 );
    race_add_spawn( -2318.0005, -1679.7029, 482.7208, 228.2500, 118,117 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( -2311.4260, -1803.4481, 441.3239, 5.0 );
    race_add_checkpoint( -2454.2014, -1721.3575, 431.0783, 5.0 );
    race_add_checkpoint( -2442.3752, -1810.6946, 410.8098, 5.0 );
    race_add_checkpoint( -2464.0090, -1467.5111, 390.1514, 5.0 );
    race_add_checkpoint( -2195.4294, -1718.8141, 376.9669, 5.0 );
    race_add_checkpoint( -2574.7395, -1502.9620, 359.3747, 5.0 );
    race_add_checkpoint( -2336.5457, -1294.4033, 309.8994, 5.0 );
    race_add_checkpoint( -2671.9932, -1394.0084, 254.8836, 5.0 );
    race_add_checkpoint( -2519.1565, -1109.7725, 177.7137, 5.0 );
    race_add_checkpoint( -2735.0449, -1875.6464, 140.3829, 5.0 );
    race_add_checkpoint( -2105.4460, -1884.1783, 110.8674, 5.0 );
    race_add_checkpoint( -2376.2031, -2195.9500, 33.6848, 10.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

