// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
                Las Venturas Playground v2.90 - Derby 1.
    This derby is featured in the bike school and uses monster trucks. 
    It has been a classic derby in LVP for a while, and been re-added using
                    the new derby handler.

*******************************************************************************/


#define DERBY1           1

derby_create(DERBY1)
{

    derby_set_id(DERBY1);

    derby_set_name("Monster Truck");

    derby_set_interior(0);

    derby_set_vehicle(444);

    derby_set_timelimit(3*60);

    derby_countdown_mode(DERBY_COUNTDOWN_ENGINE);

    derby_add_spawn( 1152.0000, 1211.5000, 11.0444, 360.0000);
    derby_add_spawn( 1145.0000, 1211.5000, 10.1042, 360.0000);
    derby_add_spawn( 1138.0000, 1211.5000, 10.1041, 360.0000);
    derby_add_spawn( 1131.0000, 1211.5000, 10.1042, 360.0000);
    derby_add_spawn( 1124.0000, 1211.5000, 10.1041, 360.0000);
    derby_add_spawn( 1117.0000, 1211.5000, 10.1042, 360.0000);
    derby_add_spawn( 1110.0000, 1211.5000, 10.1041, 360.0000);
    derby_add_spawn( 1103.0000, 1211.5000, 10.1041, 360.0000);

        // Derby2 objecten door rippance:
    derby_add_object(3625,1135.150757,1306.274292,12.655489, 0, 0, 90);
    derby_add_object(3625,1124.537109,1306.346313,12.581337, 0, 0, 270);
    derby_add_object(16317,1151.526123,1254.440186,9.806462, 0, 0, 0);
    derby_add_object(647,1122.228394,1308.241455,14.553878, 0, 0, 0);
    derby_add_object(782,1110.417969,1353.680298,9.837138, 0, 0, 0);
    derby_add_object(18609,1121.429688,1245.572388,10.992801, 0, 0, 279);
    derby_add_object(18609,1120.243530,1261.043091,10.992801, 0, 0, 279);
    derby_add_object(13645,1157.054321,1290.627075,10.563171, 0, 0, 0);
    derby_add_object(13645,1159.980469,1290.727051,10.563171, 0, 0, 0);
    derby_add_object(13645,1162.834229,1290.832275,10.563171, 0, 0, 0);
    derby_add_object(13645,1165.702393,1290.900146,10.563171, 0, 0, 0);
    derby_add_object(13645,1165.436890,1306.551880,10.563171, 0, 0, 182);
    derby_add_object(13645,1162.492676,1306.564453,10.563171, 0, 0, 182);
    derby_add_object(13645,1159.645874,1306.386353,10.563171, 0, 0, 182);
    derby_add_object(13645,1156.699829,1306.192993,10.563171, 0, 0, 182);
    derby_add_object(13667,1164.485474,1352.464478,29.459023, 0, 0, 243);
    derby_add_object(2780,1157.483032,1298.132202,9.820313, 0, 0, 0);
    derby_add_object(2780,1164.159912,1298.344116,10.107550, 0, 0, 0);
    derby_add_object(2780,1136.658081,1300.326782,9.820313, 0, 0, 0);
    derby_add_object(2780,1123.237671,1313.078857,9.820313, 0, 0, 0);

    return 1;
}

