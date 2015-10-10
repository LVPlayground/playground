// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Each individual train will be represented as a TrainDriver instance. This will spawn the actual
 * train and its carriages, while also requesting the non player character who'll drive it.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class TrainDriver <trainId (NumberOfTrainDrivers)> {
    // What is the handler Id we'll have associated for the train drivers?
    public const TrainDriverHandlerId = @counter(NpcHandler);

    // What is the vehicle Id associated with this train?
    new m_vehicleId = Vehicle::InvalidId;

    /**
     * Initializes the train driver with the given nickname and script and requests the NPC to be
     * connected through the NPC Manager, in a way that will make us receive events.
     *
     * @param nickname Nickname this train driver should be having.
     * @param script Name of the script associated with the train driver.
     * @param positionX The x-coordinate of the point where the train should be created.
     * @param positionY The y-coordinate of the point where the train should be created.
     * @param positionZ The z-coordinate of the point where the train should be created.
     */
    public initialize(nickname[], script[], Float: positionX, Float: positionY, Float: positionZ) {
        NPCManager->request(nickname, script, TrainDriver::TrainDriverHandlerId, trainId);
        if (m_vehicleId == Vehicle::InvalidId)
            m_vehicleId = VehicleManager->createVehicle(538, positionX, positionY, positionZ, 200.0);
    }

    /**
     * When the train driver spawns somewhere in San Andreas, we need to put them in the vehicle
     * which has been created for them, making sure they're able to drive it.
     *
     * @param playerId Id of the player which represents this train driver.
     */
    @switch(OnNpcSpawn, TrainDriver::TrainDriverHandlerId)
    public onTrainDriverSpawn(playerId) {
        SetPlayerVirtualWorld(playerId, World::MainWorld);
        PutPlayerInVehicle(playerId, m_vehicleId, 0);
        // TODO: Set the bot's color.
    }
};
