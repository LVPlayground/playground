// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*

Las Venturas Playground: Race 20 (Sabre Race)
This race happens in San Fierro and is driven with a Sabre.

Autor: [BA]Matthias aka GTA_Rules
Date: 24/03/09

*/

#define RACE20           20

race_start(RACE20)
{
    race_set_id( RACE20 );

    // General information
    race_set_name( "Sabre" );
    race_set_maxtime( 500 );
    race_set_vehicle( 475 );
    race_set_weather( 1 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 21, 0 );
    race_set_laps( 1 );
    race_set_interior( 0 );
    race_set_nos( 1 );

    // Spawnpoints for the race.
    race_add_spawn( -2264.9302,1017.2176,83.4396,179.0549, -1, -1 );
    race_add_spawn( -2264.6497,1034.3380,83.4973,179.0549, -1, -1 );
    race_add_spawn( -2257.0540,1015.7401,83.4222,179.0549, -1, -1 );
    race_add_spawn( -2257.3232,1034.6177,83.5006,179.0549, -1, -1 );

    // Race checkpoints
    race_add_checkpoint( -2241.2546, 808.4113, 49.1041, 21.0 );
    race_add_checkpoint( -2155.6948, 808.6836, 64.1273, 20.0 );
    race_add_checkpoint( -2156.1238, 732.5433, 69.1477, 20.0 );
    race_add_checkpoint( -2242.2910, 732.6274, 49.0856, 20.0 );
    race_add_checkpoint( -2280.7839, 566.1577, 34.8192, 25.0 );
    race_add_checkpoint( -2385.9646, 579.1406, 24.6362, 21.0 );
    race_add_checkpoint( -2401.7803, 707.2309, 34.8207, 30.0 );
    race_add_checkpoint( -2526.5664, 718.5619, 27.6695, 20.0 );
    race_add_checkpoint( -2515.7778, 908.2585, 64.6553, 20.0 );
    race_add_checkpoint( -2399.3843, 908.3198, 45.1021, 20.0 );
    race_add_checkpoint( -2371.8052, 1058.7590, 55.3809, 20.0 );
    race_add_checkpoint( -2004.7511, 1033.0240, 55.3734, 22.0 );
    race_add_checkpoint( -2003.8683, 921.3263, 45.1023, 20.0 );

    /* And done! Thanks to the beautiful race handler LVP made, there's nothing else to do! */
    return 1;
}
