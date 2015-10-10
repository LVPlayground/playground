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

#define RACE5           5

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE5)
{
    // Set the race's ID number, used internally
    race_set_id( RACE5 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Desert" );
    race_set_maxtime( 500 );
    race_set_vehicle( 573 );
    race_set_weather( 8 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 13, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    // Define the spawnp    oints that we'll use for this race;
    race_add_spawn( -1418.5000, 1932.0000, 51.2134, 90.0000, 0, 1 );
    race_add_spawn( -1418.5000, 1936.0000, 51.0515, 90.0000, 0, 1 );
    race_add_spawn( -1418.5000, 1940.0000, 50.9114, 90.0000, 0, 1 );
    race_add_spawn( -1418.5000, 1944.0000, 50.7464, 90.0000, 0, 1 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( -1478.5768, 1944.7130, 49.6318, 15.0 );
    race_add_checkpoint( -1480.4943, 2104.0408, 45.4425, 7.0 );
    race_add_checkpoint( -1548.8434, 2362.9690, 44.5776, 7.0 );
    race_add_checkpoint( -1631.4436, 2377.7517, 48.4474, 7.0 );
    race_add_checkpoint( -1711.6392, 2323.4146, 31.6189, 7.0 );
    race_add_checkpoint( -1753.4559, 2307.9424, 38.3207, 7.0 );
    race_add_checkpoint( -1684.5565, 2397.2949, 57.6919, 7.0 );
    race_add_checkpoint( -1744.5092, 2459.0532, 72.3300, 7.0 );
    race_add_checkpoint( -1650.1862, 2472.4260, 86.7975, 7.0 );
    race_add_checkpoint( -1692.9191, 2653.1331, 65.5839, 7.0 );
    race_add_checkpoint( -1749.1893, 2725.1970, 59.8386, 7.0 );
    race_add_checkpoint( -1548.0096, 2732.8374, 61.9300, 7.0 );
    race_add_checkpoint( -1328.7554, 2680.1677, 50.4688, 20.0 );
    race_add_checkpoint( -1210.1863, 2686.9939, 45.9027, 7.0 );
    race_add_checkpoint( -776.8948, 2700.3457, 46.6973, 7.0 );
    race_add_checkpoint( -699.3571, 2685.3633, 56.4351, 7.0 );
    race_add_checkpoint( -741.4147, 2640.2720, 65.1460, 7.0 );
    race_add_checkpoint( -653.1020, 2485.6272, 75.2993, 7.0 );
    race_add_checkpoint( -388.2929, 2438.0869, 41.9622, 7.0 );
    race_add_checkpoint( -419.6777, 2290.1516, 41.8506, 7.0 );
    race_add_checkpoint( -632.4005, 2430.4814, 101.7104, 7.0 );
    race_add_checkpoint( -692.0605, 2377.3992, 129.8298, 7.0 );
    race_add_checkpoint( -748.7718, 2306.9734, 130.8087, 7.0 );
    race_add_checkpoint( -865.7283, 2308.6628, 160.0704, 10.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

