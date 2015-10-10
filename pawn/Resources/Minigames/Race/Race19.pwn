// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground v2.90: Race 19: RC Parking Style by Sander
// RC race in a parking garage
//

#define RACE19           19

race_start(RACE19)
{
    race_set_id(RACE19);
    race_set_name("RC Parking Style");
    race_set_maxtime(300);
    race_set_vehicle(441);
    race_set_weather(0);
    race_set_maydrop(0);
    race_set_airrace(0);
    race_set_time(0, 0);
    race_set_laps(3);

    race_add_spawn(2061.7471,2369.0178,49.4,357.7851,67,86); // rc1
    race_add_spawn(2060.1211,2369.7783,49.4,0.4658,67,86); // rc2
    race_add_spawn(2058.4124,2369.7004,49.4,1.4797,67,86); // rc3
    race_add_spawn(2056.9988,2370.5085,49.4,3.1854,67,86); // rc4

    race_add_checkpoint(2062.5371,2431.1934,48.6422,5.0); // rc1
    race_add_checkpoint(2075.1177,2384.9495,48.6501,5.0); // rc2
    race_add_checkpoint(2100.5930,2430.6802,48.6420,5.0); // rc3
    race_add_checkpoint(2103.0408,2384.5623,48.6424,5.0); // rc4
    race_add_checkpoint(2084.9346,2429.4468,48.6423,5.0); // rc5
    race_add_checkpoint(2065.2200,2382.9004,48.6500,5.0); // rc6
    return 1;
}

