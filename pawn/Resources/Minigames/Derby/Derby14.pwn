// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

        Las Venturas Playground version 2.92 - Build 10

        TroubleSpiral - Mapped by LastTRace


        30/10/2010

    Added by Jay

*******************************************************************************/


#define DERBY14           14




derby_create(DERBY14)
{

    derby_set_id(DERBY14);

    derby_set_name("Playground");

    derby_set_interior(0);

    derby_set_vehicle(411);

    derby_set_timelimit(260);

    derby_set_height_limit(70);

    // derby_add_pickup(DERBY_PICKUP_TYPE, Float:x, Float:y, Float:z, respawn_time_in_seconds=-1);
    derby_add_pickup(DERBY_PICKUP_RANDOM,2255.3835,1100.0012,86.0260, 10);

    /*
    These where added for testing.
    derby_add_pickup(DERBY_PICKUP_REPAIR,2262.5916,1109.9175,79.3321, -1);
    derby_add_pickup(DERBY_PICKUP_FIX,2221.5959,1145.8798,79.2818, -1);
    derby_add_pickup(DERBY_PICKUP_TYRE_POP,2261.7361,1163.4604,79.2818, -1);
    derby_add_pickup(DERBY_PICKUP_BARREL,2245.4412,1104.3367,79.3027, -1);
*/
    derby_add_spawn(2283.48901367,1111.20300293,78.59999847,0.00000000);
    derby_add_spawn(2267.52416992,1159.56713867,79.35469055,80.00000000);
    derby_add_spawn(2321.85131836,1102.09216309,79.35462952,0.00000000);
    derby_add_spawn(2240.99414062,1004.22851562,79.35469055,279.99755859);


    // objects
    derby_add_object(18483,2283.48901367,1111.20300293,78.59999847,0.00000000,0.00000000,20.00000000); //object(cuntsrod07) (1)
    derby_add_object(18483,2244.00000000,1125.60314941,78.57988739,0.00000000,0.00000000,110.00000000); //object(cuntsrod07) (2)
    derby_add_object(18483,2218.17285156,1085.36791992,78.49956512,0.00000000,0.00000000,19.99511719); //object(cuntsrod07) (3)
    derby_add_object(18483,2263.72021484,1063.37963867,78.60616302,0.00000000,0.00000000,104.99996948); //object(cuntsrod07) (4)
    derby_add_object(1655,2247.51562500,1096.40039062,79.59999847,0.00000000,0.00000000,289.99511719); //object(waterjumpx2) (10)
    derby_add_object(1655,2261.21923828,1101.84497070,79.80000305,0.00000000,0.00000000,114.99996948); //object(waterjumpx2) (11)
    derby_add_object(1655,2251.69995117,1106.04907227,79.80000305,0.00000000,0.00000000,205.00000000); //object(waterjumpx2) (12)
    derby_add_object(1655,2257.06152344,1092.18652344,79.80000305,0.00000000,0.00000000,24.99938965); //object(waterjumpx2) (13)
    derby_add_object(16096,2252.54101562,1099.76660156,80.37601471,0.00000000,0.00000000,25.00000000); //object(des_a51guardbox04) (1)
    derby_add_object(16096,2255.60009766,1097.90002441,80.37000275,0.00000000,0.00000000,24.99938965); //object(des_a51guardbox04) (2)
    derby_add_object(16096,2254.50000000,1100.69995117,80.37000275,0.00000000,0.00000000,23.00000000); //object(des_a51guardbox04) (3)
    derby_add_object(16096,2253.80004883,1097.09997559,80.37000275,0.00000000,0.00000000,26.10000610); //object(des_a51guardbox04) (4)
    derby_add_object(18483,2266.57666016,1052.77197266,78.61008453,0.00000000,0.00000000,104.99630737); //object(cuntsrod07) (6)
    derby_add_object(3666,2227.92626953,1141.21032715,79.10834503,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (1)
    derby_add_object(3666,2247.23413086,1085.75134277,79.14328766,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (2)
    derby_add_object(3666,2265.43579102,1094.33679199,79.14328766,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (3)
    derby_add_object(3666,2303.35107422,1129.10388184,79.13712311,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (4)
    derby_add_object(3666,2258.76464844,1112.75585938,79.25479889,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (5)
    derby_add_object(3666,2309.57543945,1110.29467773,79.13712311,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (6)
    derby_add_object(3666,2282.96533203,1028.33666992,79.14995575,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (7)
    derby_add_object(3666,2264.83886719,1021.03515625,79.26423645,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (8)
    derby_add_object(3666,2189.01367188,1064.76806641,79.02293396,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (9)
    derby_add_object(3666,2183.22265625,1080.80737305,79.10100555,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (10)
    derby_add_object(3666,2240.99902344,1104.29394531,79.23922729,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (11)
    derby_add_object(3666,2246.18066406,1147.30468750,79.11701202,0.00000000,0.00000000,0.00000000); //object(airuntest_las) (12)
    return 1;
}

