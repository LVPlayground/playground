// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

public OnDynamicObjectMoved(objectid) {
    if (CheckHotAirBalloonMovement(objectid))
        return 1;

    if (objectid == AirportGate) {
        if (!isGateOpen) isGateOpen = true;
        else if (isGateOpen) isGateOpen = false;
    }

    OnMapDynamicObjectMoved(objectid);

    return 1;
}