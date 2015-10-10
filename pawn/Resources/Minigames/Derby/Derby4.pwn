// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*       Las Venturas Playground v2.90 - Derby 4: Hydra Dogfight.               *                                                                              *
*                                                                              *
*   This derby consists of players having to fly around Las Venturas and       *
*   shoot eachother down using hydra missiles. World boundires apply to make   *
*   it slightly more interesting.                                              *
*                                                                              *
*                               Author: Jay                                    *
*                               Date: 14/02/2009                               *
********************************************************************************/

#define DERBY4      4

derby_create(DERBY4)
{
    derby_set_id(DERBY4);

    derby_set_name("Hydra Dogfights");

    derby_set_interior(0);
    
    derby_set_vehicle(520);
    
    derby_toggle_countdown(false);

    derby_set_bounds(2216.413, 1002.005, 2324.229, 715.1132);

    derby_add_spawn(1484.0715,1724.1497,10.3529,180.3527);
    derby_add_spawn(1471.0756,1196.9135,10.3607,1.1638);
    derby_add_spawn(1472.0077,1723.1943,10.3475,183.0180);
    derby_add_spawn(1482.6915,1197.6506,10.3597,358.5121);
    return 1;
}
