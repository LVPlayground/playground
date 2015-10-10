// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

        Las Venturas Playground version 2.9294.0
        
        Bowl-ing derby by Jay
    

        09/04/2011
    
*******************************************************************************/


#define DERBY15           15




derby_create(DERBY15)
{

    derby_set_id(DERBY15);

    derby_set_name("Bowl-ing");

    derby_set_interior(0);

    derby_set_vehicle(405);
    
    derby_set_timelimit(260);
    
    derby_set_height_limit(100);
    
    derby_add_spawn(3775.44311523,-1308.77124023,122.47602081,358.87402344);
    derby_add_spawn(3765.07617188,-1284.36132812,113.33392334,0.00000000);
    derby_add_spawn(3791.68554688,-1218.96777344,128.28576660,179.41223145);
    derby_add_spawn(3829.32568359,-1286.40063477,133.36990356,94.55859375);
    derby_add_spawn(3718.69384766,-1291.44470215,142.36791992,94.55383301);


    derby_add_object(18882,3777.68530273,-1266.65051270,130.87023926,0.00000000,0.00000000,0.00000000);
    return 1;
}

