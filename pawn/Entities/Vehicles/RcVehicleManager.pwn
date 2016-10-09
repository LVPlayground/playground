// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Remote controllable vehicles are broken in a very interesting way in Grand Theft Auto: you cannot
 * "just" enter them. Instead, we need to put the player in the vehicle manually if they're close
 * enough and pressing the right key combinations.
 *
 * This class keeps track of the remote controllable vehicles which have been created in the Las
 * Venturas Playground world. When a player then activates that key combination, we'll check if they
 * are in range of any RC vehicle and will try to enter them.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RcVehicleManager {
    // How many remote controllable vehicles can be created at most in Las Venturas Playground? This
    // is an ordered buffer, so increasing this size won't affect performance too much.
    const NumberOfRemoteControllableVehicles = 30;

    // How many units may a player be removed from a remote controllable vehicle before we allow
    // them to try and enter it? The value should be similar to that of "real" vehicles.
    const RemoteControllableVehicleEnterRange = 3.0;

    // An ordered buffer for the remote controllable vehicles in LVP.
    new m_remoteControllableVehicles[NumberOfRemoteControllableVehicles];

    // How many remote controllable vehicles have been created in total?
    new m_remoteControllableVehicleCount;

    /**
     * Register a certain vehicle as being a remote controllable vehicle. We'll add it to our buffer
     * which makes sure that we check whether the player can enter it.
     *
     * @param vehicleId Id of the vehicle which should be registered as an RC vehicle.
     */
    public registerRemoteControllableVehicle(vehicleId) {
        if (m_remoteControllableVehicleCount >= NumberOfRemoteControllableVehicles) {
            printf("[RcVehicleManager] ERROR: Cannot register vehicle %d: buffer overflow.", vehicleId);
            return;
        }

        m_remoteControllableVehicles[m_remoteControllableVehicleCount++] = vehicleId;
    }

    /**
     * Removes a certain vehicle from being registered as a remote controllable vehicle. This is
     * important so that we don't try to determine whether the player can enter a non-existing
     * vehicle every time someone tries to enter a vehicle.
     *
     * @param vehicleId Id of the RC vehicle which is about to be removed.
     */
    public removeRemoteControllableVehicle(vehicleId) {
        if (m_remoteControllableVehicleCount == 0)
            return; // there are no remote controllable vehicles..

        for (new bufferIndex = 0; bufferIndex < m_remoteControllableVehicleCount; ++bufferIndex) {
            if (m_remoteControllableVehicles[bufferIndex] != vehicleId)
                continue;

            m_remoteControllableVehicles[bufferIndex] = m_remoteControllableVehicles[m_remoteControllableVehicleCount - 1];
            m_remoteControllableVehicles[--m_remoteControllableVehicleCount] = 0;
            break;
        }
    }

    /**
     * Detect whether a player may be trying to enter a remote controllable vehicle. There are some
     * more conditionals which we have to check for. If all pass, we'll call the normal code path
     * for all vehicles (i.e. access detection). If that passes too, put them in the vehicle.
     *
     * @param playerId Id of the player who may be put in a remote controllable vehicle.
     * @return boolean Whether we were able to put the player in the RC vehicle.
     */
    public bool: requestEnterVehicle(playerId) {
        new vehicleId = Vehicle::InvalidId;

        // Iterate through the remote controllable vehicles to find the right one.
        for (new bufferIndex = 0; bufferIndex < m_remoteControllableVehicleCount; ++bufferIndex) {
            if (!IsVehicleStreamedIn(m_remoteControllableVehicles[bufferIndex], playerId))
                continue;

            new Float: vehiclePosition[3];
            GetVehiclePos(m_remoteControllableVehicles[bufferIndex], vehiclePosition[0], vehiclePosition[1], vehiclePosition[2]);

            // Check if the player is in range of the vehicle. If they are, we have found the one
            // they're interested in and can exit this loop as well.
            if (IsPlayerInRangeOfPoint(playerId, RemoteControllableVehicleEnterRange, vehiclePosition[0], vehiclePosition[1], vehiclePosition[2])) {
                vehicleId = m_remoteControllableVehicles[bufferIndex];
                break;
            }
        }

        // Were we able to locate the remote controllable vehicle the player was trying to enter?
        if (vehicleId == Vehicle::InvalidId)
            return false;

        // Finally, put the player in the vehicle.
        PutPlayerInVehicle(playerId, vehicleId, 0);
        return true;
    }

    /**
     * Being in a remote controllable vehicle is nice, but it'd be cool to leave them as well. That
     * is exactly what this method handles. In the OnPlayerKeyStateChange event we already checked
     * and verified that the player is in an RC vehicle, so let's pull them out.
     *
     * @param playerId Id of the player who's trying to leave an RC vehicle.
     * @param vehicleId Id of the vehicle which the player is trying to leave.
     */
    public requestLeaveVehicle(playerId, vehicleId) {
        new Float: vehiclePosition[3];

        // Get the vehicle's current position, and set the player's position to exactly that (but a
        // little bit higher). The RemovePlayerFromVehicle method won't work for RC vehicles.
        GetVehiclePos(vehicleId, vehiclePosition[0], vehiclePosition[1], vehiclePosition[2]);
        SetPlayerPos(playerId, vehiclePosition[0], vehiclePosition[1], vehiclePosition[2] + 1);
    }
};
