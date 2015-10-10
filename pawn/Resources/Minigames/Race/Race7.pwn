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

#define RACE7           7

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE7)
{
    // Set the race's ID number, used internally
    race_set_id( RACE7 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "8-Track" );
    race_set_maxtime( 500 );
    race_set_vehicle( 475 );
    race_set_weather( 19 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 19, 0 );
    race_set_laps( 2 );
    race_set_interior( 7 );
    race_set_nos( 1 );

    // Define the spawnpoints that we'll use for this race;
    race_add_spawn( -1405.7216, -248.1979, 1043.3230, 345.0000, 2, 0 );
    race_add_spawn( -1400.2555, -250.0760, 1043.3141, 345.0000, 3, 0 );
    race_add_spawn( -1402.1246, -259.6405, 1043.4586, 345.0000, 6, 0 );
    race_add_spawn( -1407.8430, -257.6935, 1043.4655, 345.0000, 126, 0 );

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( -1398.1869,-209.2265,1042.9015,10.0 );
    race_add_checkpoint( -1509.1356,-155.7791,1049.5349,10.0 );
    race_add_checkpoint( -1417.6971,-276.9879,1050.9963,10.0 );
    race_add_checkpoint( -1292.4058,-152.4673,1050.0980,10.0 );
    race_add_checkpoint( -1373.9670,-278.4475,1044.6830,10.0 );

    // And we're done, the entire race is now loaded and playable under the
    // /race1 command. No messing around needed in the command files!
    return 1;
}

