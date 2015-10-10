// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground: Race 14: City Sprint Extended
//
// 100% Highway. Start in Los Santos, drive to and trough Las Venturas, heading to San Fierro, to your final destination with a nice jump.
// City Sprint Extended
//

#define RACE15           15

// race_start( )
// This function gets called when we need to initialize this new
// race. All we do in here is defining the race's spawn positions, name
// and checkpoints. Easier then with the previous system :)
race_start(RACE15)
{
    // Set the race's ID number, used internally
    race_set_id( RACE15 );

    // What is the name of this race? Which vehicle do we drive in? What should
    // the weather and time be like? Those variables are being set here;
    race_set_name( "City Sprint Extended" );
    race_set_maxtime( 1000 );
    race_set_vehicle( 411 );
    race_set_weather( 4 );
    race_set_maydrop( 0 );
    race_set_airrace( 0 );
    race_set_time( 20, 0 );
    race_set_laps( 1 );
    race_set_nos( 1 );
    race_set_interior( 0 );
    // Define the spawnpoints that we'll use for this race;
// Test spawn @ SF Bridgje
//  race_add_spawn( -1890.7885, 27.6741, 38.2361, 174.0289, 2, 2);

    race_add_spawn( 1630.4734, 285.8659, 20.7371, 252.9830, 2, 2);
    race_add_spawn( 1631.9850, 290.3414, 20.7175, 251.7530, 3, 3);
    race_add_spawn( 1636.5731, 305.1968, 20.7111, 252.6350, 6, 6);
    race_add_spawn( 1638.0416, 309.6904, 20.7110, 251.5423, 126, 126);
    race_add_spawn( 1628.4142, 312.9040, 20.7094, 251.5635, 1, 1);
    race_add_spawn( 1626.9298, 308.1634, 20.7050, 251.6584, 44, 44);
    race_add_spawn( 1622.6078, 293.5043, 20.7130, 253.0704, 72, 72);
    race_add_spawn( 1620.8280, 288.7975, 20.7711, 255.2323, 99, 99);

    // Offcourse, the checkpoints have to be defined as well, so the race
    // actually goes somewhere. There's a max of ~50 checkpoints.
    
    race_add_checkpoint( 2527.1902, 301.4518, 28.7159, 25.0); // check1 25
    race_add_checkpoint( 2830.6904, -2031.9003, 10.7305, 20.0); // check2 20
    race_add_checkpoint( 2167.7913, -2498.2324, 13.0000, 20.0); // check3 20
    race_add_checkpoint( 1480.5842, -2124.8042, 13.3327, 20.0); // check4 20
    race_add_checkpoint( 1603.5464, -1358.9771, 28.9286, 20.0); // check5 20
    
    race_add_checkpoint( 1703.8666, -490.8130, 33.4572, 15.0 );
    race_add_checkpoint( 1797.2146, 1049.9962, 6.4339, 15.0 );
    race_add_checkpoint( 1332.9120, 2444.0181, 6.4307, 15.0 );
    race_add_checkpoint( 908.3096, 724.3782, 10.5618, 15.0 );
    race_add_checkpoint( -493.1227, 591.6815, 16.7494, 15.0 );

    race_add_checkpoint( -1155.7820, 1083.4637, 39.6095, 15.0 );
    race_add_checkpoint( -1900.9398, -74.9416, 37.8640, 20.0); // 13 20
    race_add_checkpoint( -2865.5303, -867.3607, 7.3114, 20.0); // 14 20
    race_add_checkpoint( -2468.1340, -2416.6948, 32.3613, 30.0); // 15 30?
    race_add_checkpoint( -1120.0519, -2858.0693, 67.3437, 20.0); // 16 20
    race_add_checkpoint( -287.1518, -1693.9447, 14.5121, 25.0); // 17 25
    race_add_checkpoint( 631.8193, -1216.4985, 17.7345, 30.0); // 18 30
    
    // And we're done, the entire race is now loaded and playable under the
    // /race15 command. No messing around needed in the command files!
    return 1;
}
