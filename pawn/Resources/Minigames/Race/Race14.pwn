// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 14: City Sprint
//
// 100% Highway. Start in Los Santos, drive to and trough Las Venturas, heading to San Fierro, to your final destination with a nice jump.
// City Sprint
//

#define RACE14           14

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE14)
{
    // Set the race's ID number, used internally
    race_set_id( RACE14 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "City Sprint" );
    race_set_maxtime( 500 );
    race_set_vehicle( 411 );
    race_set_weather( 4 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 1 );
    race_set_interior( 0 );
    // Define the spaw  npoints that we'll use for this race;
    race_add_spawn( 2714.8213, -1607.9265, 12.6562, 90.9192, 2,2);
    race_add_spawn( 2714.9331, -1613.8628, 12.5697, 89.0452, 3,3);
    race_add_spawn( 2714.7214, -1621.8331, 12.5741, 89.3843, 6,6);
    race_add_spawn( 2714.8240, -1627.4323, 12.6164, 89.6255, 126,126);
    race_add_spawn( 2724.6624, -1608.3180, 12.5716, 87.4708, 1,1);
    race_add_spawn( 2724.6968, -1614.0995, 12.5723, 88.6297, 44,44);
    race_add_spawn( 2724.5264, -1621.7615, 12.5708, 89.9921, 72,72);
    race_add_spawn( 2724.6069, -1627.4740, 12.5708, 89.8337, 99,99);

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    race_add_checkpoint( 1763.2716, -1499.9639, 12.6031, 15.0 );
    race_add_checkpoint( 1703.8666, -490.8130, 33.4572, 20.0 );
    race_add_checkpoint( 1797.3105, 823.0392, 10.6596, 20.0);
//  race_add_checkpoint( 1797.2146, 1049.9962, 6.4339, 15.0 );
    race_add_checkpoint( 1332.9120, 2444.0181, 6.4307, 20.0 );
    race_add_checkpoint( 908.3096, 724.3782, 10.5618, 20.0 );
    race_add_checkpoint( -493.1227, 591.6815, 16.7494, 20.0 );
    race_add_checkpoint( -1155.7820, 1083.4637, 39.6095, 20.0 );
    race_add_checkpoint( -1904.1321, -543.6371, 37.9615, 20.0 );
//  race_add_checkpoint( -1892.6221, -1542.1233, 21.7500, 20.0 );
    race_add_checkpoint( -1897.9269, -1434.0074, 34.8176, 20.0);
    
    // And we're done, the entire race is now loaded and playable under the
    // /race14 command. No messing around needed in the command files!
    return 1;
}
