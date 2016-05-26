/**
 * Copyright (c) 2006-2015 Las Venturas Playground
 *
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program; if
 * not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA
 * 02110-1301, USA.
 */

/**
 * Peter's a really cool guy who founded Las Venturas Playground. He used to have an infernus parked
 * in the casino's garden across the ship, but it disappeared with the new vehicle manager. The least
 * we could do is place it back, right?
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class PeterVehicleFeature {
    // The unique Id of the vehicle when created upon gamemode initialization.
    new m_peterVehicleId = Vehicle::InvalidId;

    // The unique Id of the 3D textlabel floating above the vehicle.
    new Text3D: m_peterVehicleLabelId = Text3D: INVALID_3DTEXT_ID;

    // The location and rotation of the famous infernus.
    new Float: m_positionAndRotation[4] = { 2171.2183, 1546.9447, 10.5474, 89.3339};

    // The primary and secondary colors of the famous infernus.
    new m_colors[2] = { 6, 6 };

    /**
     * When the gamemode loads, we need to prepare the vehicle which is going to be spawned in
     * the Las Venturas Playground.
     */
    @list(OnGameModeInit)
    public initialize() {
        m_peterVehicleId = VehicleManager->createVehicle(
            411 /* modelId */, m_positionAndRotation[0], m_positionAndRotation[1], m_positionAndRotation[2],
            m_positionAndRotation[3], m_colors[0], m_colors[1]);

        m_peterVehicleLabelId = Create3DTextLabel("Peter's Infernus", Color::Warning, 0.0 /* positionX */,
                                                  0.0 /* positionY */, 0.0 /* positionZ */,
                                                  30 /* draw distance */, World::MainWorld,
                                                  1 /* line of sight */);

        SetVehicleNumberPlate(m_peterVehicleId, "Peter");
        Attach3DTextLabelToVehicle(m_peterVehicleLabelId, m_peterVehicleId, 0.0 /* offsetX */,
                                   0.0 /* offsetY */, 1.5 /* offsetZ */);
    }

    /**
     * When Peter's vehicle is streamed in for a player, we can (un)lock the vehicle.
     *
     * @param vehicleId Id of the vehicle which streamed in.
     * @param playerId Id of the player for whom this vehicle became in-range.
     */
    @list(OnVehicleStreamIn)
    public onVehicleStreamIn(vehicleId, playerId) {
        if (vehicleId != m_peterVehicleId)
            return;

        if (Account(playerId)->userId() == 59504 /* Peter */)
            SetVehicleParamsForPlayer(vehicleId, playerId, 0 /* hide objective */, 0 /* unlocked */);
        else
            SetVehicleParamsForPlayer(vehicleId, playerId, 0 /* hide objective */, 1 /* locked */);
    }
};