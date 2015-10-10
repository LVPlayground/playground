// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

//
// Las Venturas Playground v2.90: Race 18: Mesa Madness by Jay
// Off-road race based in the dark, foggy, woods.
//

#define RACE18           18

race_start(RACE18)
{
    race_set_id(RACE18);
    race_set_name("Mesa Madness");
    race_set_maxtime(500);
    race_set_vehicle(500);
    race_set_weather(9);
    race_set_maydrop(0);
    race_set_airrace(0);
    race_set_time(0, 0);
    race_set_laps(1);


    race_add_spawn(-1915.9377,-2439.2542,30.7299,313.3792,21,119); // mesaspawn
    race_add_spawn(-1921.6271,-2433.3635,30.7312,316.3447,25,119); // mesaspawn
    race_add_spawn(-1926.7228,-2438.7107,30.7341,316.3755,28,119); // mesaspawn
    race_add_spawn(-1921.5603,-2444.2600,30.7331,312.9531,40,84); // mesaspawn

    race_add_checkpoint(-1854.9363,-2371.3862,31.9938,7.0); // cp
    race_add_checkpoint(-1719.4147,-2301.3030,44.9742,7.0); // cp
    race_add_checkpoint(-1673.4406,-2201.1877,34.8303,7.0); // cp
    race_add_checkpoint(-1573.7371,-2153.3320,13.6885,7.0); // cp
    race_add_checkpoint(-1431.0292,-2159.2581,11.6884,7.0); // cp
    race_add_checkpoint(-1342.0476,-2181.6409,21.9176,7.0); // cp
    race_add_checkpoint(-1270.0862,-2246.1228,22.3072,7.0); // cp
    race_add_checkpoint(-1214.0620,-2346.6350,17.4722,7.0); // cp
    race_add_checkpoint(-1110.9178,-2374.7708,34.7326,7.0); // cp
    race_add_checkpoint(-1020.1384,-2374.8943,59.8157,7.0); // cp
    race_add_checkpoint(-949.6635,-2344.5205,60.3829,7.0); // cp
    race_add_checkpoint(-961.6672,-2258.8723,49.4597,7.0); // cp
    race_add_checkpoint(-905.7588,-2182.9595,31.1421,7.0); // cp
    race_add_checkpoint(-794.6434,-2101.5320,24.7534,7.0); // cp
    race_add_checkpoint(-832.1113,-1913.2195,12.0612,7.0); // cp
    race_add_checkpoint(-676.1771,-1876.8115,8.5934,7.0); // cp
    race_add_checkpoint(-671.9634,-1927.4009,11.6823,7.0); // cp
    race_add_checkpoint(-668.1000,-1989.6804,24.4009,7.0); // cp
    race_add_checkpoint(-624.6624,-2025.2240,34.4671,7.0); // cp
    race_add_checkpoint(-503.8593,-2028.1571,50.7865,7.0); // cp
    race_add_checkpoint(-448.8830,-1988.5353,31.5156,7.0); // cp
    race_add_checkpoint(-442.2830,-1916.2329,6.5086,7.0); // cp
    return 1;
}

