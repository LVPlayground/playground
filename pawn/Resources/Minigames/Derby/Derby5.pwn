// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
                Las Venturas Playground v2.90 - Derby 5.
    This derby consists of players spawning in police boats. They have
    to use the police boats cannon to shoot eachother. Quite fun,
    and a nice idea to. Credits to Erin for the idea.

*******************************************************************************/


#define DERBY5           5

derby_create(DERBY5)
{

    derby_set_id(DERBY5);

    derby_set_name("Police Boat");

    derby_set_interior(0);

    derby_set_vehicle(430);

    derby_countdown_mode(DERBY_COUNTDOWN_ENGINE);

    derby_add_spawn(-1486.7183,617.3679,-0.3315,312.5613);
    derby_add_spawn(-1469.1826,783.8342,-0.1445,279.2388);
    derby_add_spawn(-1361.6873,784.1740,-0.2586,150.9152);
    derby_add_spawn(-1362.7871,651.7639,-0.6585,182.6288);
    derby_add_spawn(-1376.5602,587.2054,-0.3422,116.0857);
    return 1;
}