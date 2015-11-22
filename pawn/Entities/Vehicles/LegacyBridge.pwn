// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// -------------------------------------------------------------------------------------------------
// TODO: Figure out what to do with the following information.

AnyPlayerInVehicle(vehicleId) {
    // TODO: Implement me.
    return 0;
    #pragma unused vehicleId
}

// -----------------------------------------------
// Feature: Locking a vehicle's doors.

IsVehicleLocked(vehicleId) {
    new engine, lights, alarm, doors, bonnet, boot, objective;
    GetVehicleParamsEx(vehicleId, engine, lights, alarm, doors, bonnet, boot, objective);

    if (doors == 1)
        return 1;
    else
        return 0;
}

SetVehicleLocked(vehicleId, bool: locked = true) {
    new engine, lights, alarm, doors, bonnet, boot, objective;
    GetVehicleParamsEx(vehicleId, engine, lights, alarm, doors, bonnet, boot, objective);

    if (locked == true)
        SetVehicleParamsEx(vehicleId, engine, lights, alarm, 1 /* locked */, bonnet, boot, objective);
    else
        SetVehicleParamsEx(vehicleId, engine, lights, alarm, 0 /* unlocked */, bonnet, boot, objective);

    return 1;
}
