// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Delegate for vehicle commands. Not all vehicles manageable are created by the Vehicles system,
// some are created by other systems such as Houses or gang zones. They can still benefit from the
// ability to save and change vehicles.
export class VehicleCommandDelegate {
    // Called when the |player| wishes to save the vehicle they're driving. Must return a sequence
    // of options ({ label, listener }) that can be considered by the system.
    async getVehicleSaveCommandOptions(player, target, vehicle) { return []; }

    // Called when the |player| wishes to delete the vehicle they're driving. Must return TRUE when
    // the vehicle is managed by this delegate, and, depending on flow, may've been deleted.
    async onVehicleDeleteCommand(player, target, vehicle) { return false; }
}
