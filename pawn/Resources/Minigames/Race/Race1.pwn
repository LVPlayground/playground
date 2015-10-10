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

#define RACE1           1

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE1)
{
    // Set the race's ID number, used internally
    race_set_id( RACE1 );
    
    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "Easy" );
    race_set_maxtime( 500 );
    race_set_vehicle( 411 );
    race_set_weather( 18 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 12, 0 );
    race_set_laps( 1 );
    race_set_nos( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( 2877.3500, -1586.1000, 10.6021, 341.0, -1, -1 );
    race_add_spawn( 2882.2500, -1587.7000, 10.6035, 341.0, -1, -1 );
    race_add_spawn( 2895.9500, -1592.1000, 10.6109, 341.0, -1, -1 );
    race_add_spawn( 2900.8500, -1593.7000, 10.6021, 341.0, -1, -1 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 2905.7305, -1335.2546, 10.5547, 23.0 );
    race_add_checkpoint( 2821.5581, -1141.8853, 15.8710, 10.0 );
    race_add_checkpoint( 2391.7834, -1154.3229, 28.2620, 10.0 );
    race_add_checkpoint( 2128.0623, -1083.0441, 23.8318, 10.0 );
    race_add_checkpoint( 1831.9017, -1030.3024, 36.1764, 10.0 );
    race_add_checkpoint( 1708.6503, -1094.7461, 56.0305, 10.0 );
    race_add_checkpoint( 1606.3248, -1715.6747, 27.8894, 25.0 );
    race_add_checkpoint( 1469.1903, -2124.5723, 13.2589, 25.0 );
    race_add_checkpoint( 1339.2551, -2457.6050, 13.2338, 25.0 );
    race_add_checkpoint( 1677.8434, -2675.8174, 5.7187, 25.0 );
    race_add_checkpoint( 2154.1982, -2621.6726, 13.2282, 20.0 );
    race_add_checkpoint( 2219.4734, -2346.1616, 13.2265, 20.0 );
    race_add_checkpoint( 2486.6650, -2162.4805, 13.3195, 20.0 );
    race_add_checkpoint( 2829.9673, -2007.4019, 10.7871, 20.0 );
    race_add_checkpoint( 2875.0083, -1591.7281, 10.5547, 30.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

