// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#include "Entities/Vehicles/LegalModifications.pwn"

#include "Entities/Vehicles/VehicleModel.pwn"
#include "Entities/Vehicles/VehicleModelData.pwn"

#if Feature::DisableVehicleManager == 0
#include "Entities/Vehicles/VehicleSeat.pwn"
#endif  // Feature::DisableVehicleManager == 0

#include "Entities/Vehicles/Vehicle.pwn"
#include "Entities/Vehicles/VehicleManager.pwn"

#if Feature::DisableVehicleManager == 0
#include "Entities/Vehicles/VehicleStorageManager.pwn"
#include "Entities/Vehicles/VehicleAccessManager.pwn"
#endif  // Feature::DisableVehicleManager == 0

#include "Entities/Vehicles/RcVehicleManager.pwn"

#if Feature::DisableVehicleManager == 0
#include "Entities/Vehicles/VehicleCommands.pwn"
#include "Entities/Vehicles/LegacyBridge.pwn"
#endif  // Feature::DisableVehicleManager == 0

#include "Entities/Vehicles/VehicleEvents.pwn"

#if Feature::DisableVehicleManager == 1

// Define the dialog Id as value 65535, which isn't used elsewhere.
#define VehicleCommands::WarningDialogId 65535

// Empty functions part of the VehicleCommands class.
stock M42536_onVehicleCommand(playerId, params[]) {
    #pragma unused playerId, params
}
stock M42536_onVehicleCreateCommand(playerId, params[]) {
    #pragma unused playerId, params
}
stock M42536_onVehicleEnterCommand(playerId, params[]) {
    #pragma unused playerId, params
}
stock M42536_onVehicleSaveCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehicleAccessCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehicleDinitrogenMonoxideEngineCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehicleColorCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehiclePaintjobCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehicleHealthCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehicleRespawnCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onVehicleDestroyCommand(playerId, vehicleId, params[]) {
    #pragma unused playerId, vehicleId, params
}
stock M42536_onWarningDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
    #pragma unused playerId, button, listItem, inputText
}
stock M42536_onFixVehiclesCommand(playerId, params[]) {
    #pragma unused playerId, params
}

#endif  // Feature::DisableVehicleManager == 1
