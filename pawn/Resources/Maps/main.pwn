// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

    // L.V airport gate:
    AirportGate = CreateDynamicObject(980, 1705.672852, 1607.490845, 11.840168, 0, 359.1406, 253.2473);

    // GANG BASE:
    CreateDynamicObject(3279, 1517.376465,2787.717285,9.545935, 0, 0, 92);
    CreateDynamicObject(1245, 1538.463379,2736.225098,10.990989, 0, 0, 0);
    CreateDynamicObject(1684,1510.388062,2747.078857,11.310190, 0, 0, 240);

    // Ramp @ Boat race
    CreateDynamicObject(1655,130.0000,-1900.0000,0.5000, 0, 0, 270);

    // These are 3 gates blocking the entrance to the garages during derby minigames in the arena
    CreateDynamicObject(980, -1442.8855, 935.6336, 1036.5052, 0, 359.1406, 350.0);
    CreateDynamicObject(980, -1461.1471, 939.3623, 1036.6312, 0, 359.1406, 345.0);
    CreateDynamicObject(980, -1423.9363, 934.0000, 1036.4257, 0, 359.1406, 0.0);

    // Vent blocker in cailgulars casino:
    CreateDynamicObject(1500, 2142.30, 1621.13, 1000.16, 0.00, 0.00, 0.00);

#if Feature::DisableFights == 0
    #include    Resources/Maps/IslandDM.pwn
#endif
