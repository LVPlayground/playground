// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
                Las Venturas Playground v2.90 - Derby 2.
    This derby is a new derby to 2.90 and replaces the old (sucky)
    derby 3. Based off the SA:MP gamemode, RC Barnstorm, this derby
    consists of players spawning in rc barons and having to shoot eachother
    down using the RC cannon. Quite a fun derby.

*******************************************************************************/


#define DERBY2           2

derby_create(DERBY2)
{

    derby_set_id(DERBY2);

    derby_set_name("RC Barnstorm");

    derby_set_interior(0);

    derby_set_vehicle(464);

    derby_set_bounds( 200.0, -200.0, 200.0, -200.0 );

    derby_toggle_countdown(false);

    derby_toggle_blips(false);


    derby_add_spawn(73.7883,73.4238,2.4082,260.5399);
    derby_add_spawn(6.9850,27.9988,2.4112,201.7691);
    derby_add_spawn(0.6782,-16.0898,2.4076,161.7720);
    derby_add_spawn(46.3365,-88.3937,2.4092,180.7382);
    derby_add_spawn(72.4389,-127.2939,2.4107,113.5616);
    derby_add_spawn(128.1940,-144.1725,2.4094,78.9676);
    derby_add_spawn(93.3146,-32.4889,2.4085,186.0631);
    derby_add_spawn(130.7054,-93.4983,2.4124,73.8375);
    derby_add_spawn(117.4049,4.2989,2.4112,337.1284);
    derby_add_spawn(26.1622,135.8739,2.4094,248.1580);
    derby_add_spawn(45.5705,86.7586,2.0753,147.3342);
    derby_add_spawn(54.9881,2.2997,1.1132,95.7173);
/*  derby_add_spawn(60.1321,55.5239,2.4038,325.2209);
    derby_add_spawn(60.9184,47.9302,5.7706,342.8299);
    derby_add_spawn(70.0303,-22.0071,2.4113,165.2789);
    derby_add_spawn(138.3093,-83.2640,2.4152,4.0455);
    derby_add_spawn(25.5989,94.6100,2.4041,150.8322);
    derby_add_spawn(54.8308,-139.6148,2.4119,258.7639);*/
    return 1;
}

