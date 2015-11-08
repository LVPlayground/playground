// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#if Feature::DisableRaces == 0

/**********************************************************
 *
 * Las Venturas Playground v3.0 OnObjectMoved
 *
 **********************************************************/

public OnObjectMoved(objectid)
{
    CheckVehicleMissileExplode(objectid);
    return 1;
}

#endif
