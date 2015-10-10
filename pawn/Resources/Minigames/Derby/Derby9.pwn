// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

        Las Venturas Playground version 2.91 - Build 19
        
    Another derby using the heightlimit. Spawns in LS on a small roof with glendales.


    Author: James "Jay" Wilkinson
    03/04/2010
    Jay@ww3samp.com


    Copyright(c) Las Venturas Playground 2006 - 2010
    http://www.sa-mp.nl
    
*******************************************************************************/


#define DERBY9           9




derby_create(DERBY9)
{

    derby_set_id(DERBY9);

    derby_set_name("Glendale Knockoff");

    derby_set_interior(0);

    derby_set_vehicle(604);

    derby_set_timelimit(60);
    
    derby_set_height_limit(23);
    
    derby_countdown_mode(DERBY_COUNTDOWN_FREEZE);

    derby_add_spawn(105.7646,-297.5073,26.9187,176.7283);
    derby_add_spawn(103.2484,-327.7744,26.4674,359.1966);
    derby_add_spawn(72.4374,-327.1983,26.5737,359.5457);
    derby_add_spawn(72.4607,-297.1990,26.9800,178.1536);
    derby_add_spawn(32.2245,-326.4200,26.7049,357.6919);
    derby_add_spawn(30.3863,-296.0876,26.9559,178.1714);

    
    return 1;
}

