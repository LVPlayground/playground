// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Each pilot will be receiving an airplane which it uses to fly around San Andreas. It flies from
 * airport to airport, optionally transferring people with them (at least, so we pretend). We
 * employ non-player characters to do this for us automatically.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlanePilot <pilotId (NumberOfPlanePilots)> {
    // What is the handler Id we'll have associated for the plane pilots?
    public const PlanePilotHandlerId = @counter(NpcHandler);

    // What is the vehicle Id associated with this train?
    new m_vehicleId = Vehicle::InvalidId;

    /**
     * Initializes the plane pilot by requesting an NPC to connect to the server, and creating the
     * vehicle the pilot will be needing to fly around in.
     *
     * @param nickname Nickname this plane pilot should be having.
     * @param script Name of the script associated with the plane pilot.
     * @param positionX The x-coordinate of the point where the plane should be created.
     * @param positionY The y-coordinate of the point where the plane should be created.
     * @param positionZ The z-coordinate of the point where the plane should be created.
     * @param rotation The rotation which has to be applied to the spawned airplane.
     */
    public initialize(nickname[], script[], Float: positionX, Float: positionY, Float: positionZ, Float: rotation) {
        NPCManager->request(nickname, script, PlanePilot::PlanePilotHandlerId, pilotId);
        if (m_vehicleId == Vehicle::InvalidId)
            m_vehicleId = VehicleManager->createVehicle(577, positionX, positionY, positionZ, rotation, 8, 7);
    }

    /**
     * When the pilot spawns, we have to put them in the right virtual world (to make sure others
     * can see them flying the planes) and put them in their designated airplane. Such cheap labour.
     *
     * @param playerId Id of the player which represents this plane pilot.
     */
    @switch(OnNpcSpawn, PlanePilot::PlanePilotHandlerId)
    public onPlanePilotSpawn(playerId) {
        SetPlayerVirtualWorld(playerId, World::MainWorld);
        PutPlayerInVehicle(playerId, m_vehicleId, 0);
        // TODO: Set the bot's color.
    }
};
