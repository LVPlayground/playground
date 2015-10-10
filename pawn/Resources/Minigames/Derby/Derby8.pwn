// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

        Las Venturas Playground version 2.91 - Build 19
        
    New and first derby to use the height limit functionallity. Players
    spawn in an infernus on top of the Stadium in Los Santos and have to
    push eachother off!


    Author: James "Jay" Wilkinson
    03/04/2010
    Jay@ww3samp.com


    Copyright(c) Las Venturas Playground 2006 - 2010
    http://www.sa-mp.nl
    
*******************************************************************************/


#define DERBY8           8



derby_create(DERBY8)
{

    derby_set_id(DERBY8);

    derby_set_name("Stadium Pushout");

    derby_set_interior(0);

    derby_set_vehicle(411);

    derby_set_timelimit(60);
    
    derby_set_height_limit(33);
    
    derby_countdown_mode(DERBY_COUNTDOWN_FREEZE);

    derby_add_spawn(2724.5347, -1695.0281, 36.7653, 191.9675);
    derby_add_spawn(2751.1086, -1825.6765, 36.6874, 2.3994);
    derby_add_spawn(2672.7542, -1765.3245, 37.1026, 268.4554);
    derby_add_spawn(2803.4539, -1759.7716, 36.9369, 87.9803);
    derby_add_spawn(2678.6702, -1790.8400, 36.8025, 300.1769);
    derby_add_spawn(2794.2986, -1726.0154, 36.8700, 121.4944);
    
    derby_add_pickup(DERBY_PICKUP_NOS,2738.4424,-1761.4875,43.8244,-1);
    return 1;
}

