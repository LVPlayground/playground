// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// VIPs can spawn various vehicle during a cruise, which we list here.
new g_spawnableCruiseVehicles[30] = {
    402 /* buffalo */, 407 /* firetruck */, 411 /* infernus */, 415 /* cheetah */, 416 /* ambulance */,
    424 /* bf-injection */, 429 /* banshee */, 437 /* coach */, 441 /* rc-bandit */, 444 /* monster */,
    451 /* turismo */, 452 /* speeder */, 468 /* sanchez */, 481 /* BMX */, 487 /* maverick */,
    493 /* jetmax */, 494 /* hotring racer */, 495 /* sandking */, 504 /* bloodring banger */,
    514 /* tanker */, 522 /* NRG-500 */, 541 /* bullet */, 560 /* sultan */, 562 /* elegy */,
    568 /* bandito */, 571 /* kart */, 584 /* petrol trailer */, 589 /* club */, 598 /* police car */,
    603 /* phoenix */
};

/**
 * A Cruise is a great way to spend time exploring the San Andreas map. A player is appointed to 
 * lead the cruise and all parcitipants are supposed to follow that person driving arround the map.
 *
 * @author Joeri de Graaf <oostcoast@sa-mp.nl>
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class CruiseController {
    // What is the dialog Id that will be used for the cruise vehicles list?
    public const DialogId = @counter(OnDialogResponse);

    // Who is the current cruise leader?
    new m_cruiseLeaderId = Player::InvalidId;

    // Keep track of the global cruise message distribution frequency.
    new m_globalCruiseMessageFrequency = 0;

    /**
     * Returns whether a cruise is active.
     *
     * @return boolean Is there a cruise active?
     */
    public inline bool: isCruiseActive() {
        return (m_cruiseLeaderId != Player::InvalidId);
    }

    /**
     * Returns the Id of the player that is currently leading the cruise.
     *
     * @return integer PlayerId of the current cruise leader.
     */
    public inline getCruiseLeaderId() {
        return (m_cruiseLeaderId);
    }

    /**
     * Makes the specified playerId the leader of the cruise.
     *
     * @param playerId Id of the player who should be made cruise leader.
     */
    public inline setCruiseLeader(playerId) {
        m_cruiseLeaderId = playerId;
    }

    /**
     * Returns whether a player is near the cruise leader. Useful for features like fixing your car
     * which should only be availible if you are near the leader.
     *
     * @return boolean Is the player near the current cruise leader?
     */
    public bool: isPlayerNearCruiseLeader(playerId) {
        /// @todo Use the new Zone Handler instead of IsPlayerInRangeOfPoint for this method,
        /// once it is able to detect cities.
        if (this->isCruiseActive() == false)
            return false;

        new Float: playerPosition[3];
        GetPlayerPos(m_cruiseLeaderId, playerPosition[0], playerPosition[1], playerPosition[2]);

        if (IsPlayerInRangeOfPoint(playerId, 500.0, playerPosition[0], playerPosition[1], playerPosition[2]))
            return true;

        else return false;
    }

    /**
     * Returns whether the cruise is still inside Las Venturas. Some features like fixing you car
     * are disabled inside Las Venturas to prevent abuse.
     *
     * @return boolean Is the cruise within the city limits of Las Venturas?
     */
    public bool: isCruiseInsideLasVenturas() {
        /// @todo Use the new Zone Handler instead of IsPlayerInRangeOfPoint for this method,
        /// once it is able to detect cities.
        if (IsPlayerInRangeOfPoint(m_cruiseLeaderId, 1300.0, 2136.0, 1894.0, 10.0))
            return true;

        else return false;
    }

    /**
     * Sends out a global chat message saying a cruise is active to be triggered by a timer.
     * A message will only be broadcasted only if there is a cruise active.
     */
    @list(MinuteTimer)
    public broadcastCruiseIsRunning() {
        if (this->isCruiseActive() == false)
            return 0;

        if (m_globalCruiseMessageFrequency == 1) { /* two minutes */
            new message[128];

            SendClientMessageToAllEx(Color::Warning, "-------------------");
            format(message, sizeof(message),
                "*** Cruise Control: {FFFFFF}There is currently a cruise running! %s leads, use \"/ctp %d\" to join!",
                Player(m_cruiseLeaderId)->nicknameString(), m_cruiseLeaderId);
            SendClientMessageToAllEx(Color::Warning, message);

            for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
                if (this->isPlayerNearCruiseLeader(playerId) == false)
                    continue;

                SendClientMessage(playerId, Color::Warning,
                    "*** Cruise Control: {FFFFFF}VIPs: you can use \"/cruise car\" to spawn a vehicle of choice!");

                SendClientMessage(playerId, Color::Warning,
                    "*** Cruise Control: {FFFFFF}You can use \"/vr\" and \"/flip\" outside Las Venturas to repair/flip your vehicle!");
            }

            SendClientMessageToAllEx(Color::Warning, "-------------------");

            m_globalCruiseMessageFrequency = 0;
        } else m_globalCruiseMessageFrequency++;

        return 1;
    }

    /**
     * Hooks into OnPlayerDisconnect in order to decide if the cruise has to end because the leader
     * has left the server. Also reset the last /cruise car usage time.
     *
     * @param playerId Id of the player who left the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (this->isCruiseActive() == true && playerId == m_cruiseLeaderId) {
            this->setCruiseLeader(Player::InvalidId);

            SendClientMessageToAllEx(Color::Warning, "-------------------");
            SendClientMessageToAllEx(Color::Warning,
                "*** Cruise Control: {FFFFFF}The cruise leader has left the server, the cruise has ended!");
            SendClientMessageToAllEx(Color::Warning, "-------------------");
        }

        return 1;
    }

    /**
     * Handle the response from the cruise vehicle list dialog when a VIP player decides to spawn
     * a cruise vehicle.
     *
     * @param playerId Id of the player who is spawning a cruise vehicle.
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     */
    @switch(OnDialogResponse, CruiseController::DialogId)
    public onDialogResponse(playerId, DialogButton: response, listItem, inputText[]) {
        if (response == RightButton)
            return 1; /* dialog closed */

        new cruiseVehicleModel = g_spawnableCruiseVehicles[listItem],
            Float: playerPosition[3], Float: playerRotation;
        GetPlayerPos(playerId, playerPosition[0], playerPosition[1], playerPosition[2]);
        GetPlayerFacingAngle(playerId, playerRotation);

        new cruiseVehicleId = VehicleManager->createVehicle(cruiseVehicleModel, playerPosition[0],
            playerPosition[1], playerPosition[2] + 1, playerRotation, -1, -1, 0, World::MainWorld);

        if (cruiseVehicleId == Vehicle::InvalidId) {
            SendClientMessage(playerId, Color::Error, "Sorry, we can't spawn this vehicle!");
            return 1;
        }

        // By marking it as a OpenWorldVehicle, this vehicle will get removed from the gamemode if
        // it respawns.
        Vehicle(cruiseVehicleId)->markOpenWorldVehicle();

        if (IsPlayerInAnyVehicle(playerId))
            SetVehicleToRespawn(GetPlayerVehicleID(playerId));

        PutPlayerInVehicle(playerId, cruiseVehicleId, 0);

        new message[128];
        format(message, sizeof(message), "%s (Id:%d) spawned a %s during a cruise.",
            Player(playerId)->nicknameString(), playerId, VehicleModel(cruiseVehicleModel)->nameString());
        Admin(playerId, message);

        return 1;
        #pragma unused inputText
    }
};
