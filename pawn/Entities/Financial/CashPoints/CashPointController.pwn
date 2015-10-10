// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Cash points are physical objects that will be placed within the gamemode, close proximity to
 * which will allow players to access their banking account. The actual locations are stored in a
 * JSON data file, and will be loaded by the class' constructor.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class CashPointController {
    // What is the maximum number of cash points that can be created in LVP?
    public const MaximumNumberOfCashPoints = 70;

    // The maximum distance a player may be standing away from the cash-point. We create a square
    // area around them, so it may end up being slightly more than this.
    public const MaximumDistanceSquare = 5.0;

    // We need a layer on the Zone Manager for keeping track whether a player is currently in range
    // of a cash point or not. All cash points in the JSON file will be automatically registered.
    public const CashPointLayerId = @counter(ZoneLayer);

    // In which file have the cash point locations been stored?
    const CashPointDataFile = "data/cash_points.json";

    // How many cash-points have been registered with the gamemode?
    new m_cashPointCount = 0;

    // We keep track of whether a player is in range of a cash point, because this is a requirement
    // for the various banking commands out there. We currently don't care about which one.
    new bool: m_playerInRangeOfCashPoint[MAX_PLAYERS];

    // Keep track of whether we have shown an informative message to a player.
    new bool: m_hasShownInformativeMessage[MAX_PLAYERS];

    /**
     * The cash point controller will start by initializing the cash points that should be located
     * around Las Venturas Playground. The positions are stored in a JSON data file for more easy
     * manipulation and mapping. The radius is configurable, and for each of the machines the
     * location (X, Y, Z), rotation (angle) and interior Id may be set
     *
     * Data format example:
     * [
     *     [100.0, 200.0, 300.0, 180.0,  0],
     *     [110.0, 220.0, 330.0, 180.0, 15]
     * ]
     */
    public __construct() {
        new Node: machineList = JSON->parse(CashPointDataFile);
        if (machineList == JSON::InvalidNode) {
            printf("[CashPointController] ERROR: Unable to load the cash-point data.");
            return;
        }

        // Create our layer in the Zone Manager, so it can process all the checkpoints.
        ZoneManager->createLayer(CashPointController::CashPointLayerId);

        m_cashPointCount = 0;
        for (new Node: currentMachineNode = JSON->firstChild(machineList); currentMachineNode != JSON::InvalidNode; currentMachineNode = JSON->next(currentMachineNode)) {
            if (m_cashPointCount >= CashPointController::MaximumNumberOfCashPoints)
                break; // passed the maximum amount of cash points.

            new Node: machineSettingNode = JSON->firstChild(currentMachineNode);
            new Float: position[3], Float: rotation, interiorId;

            JSON->readFloat(machineSettingNode, position[0]); // X-coordinate.
            machineSettingNode = JSON->next(machineSettingNode);

            JSON->readFloat(machineSettingNode, position[1]); // Y-coordinate.
            machineSettingNode = JSON->next(machineSettingNode);

            JSON->readFloat(machineSettingNode, position[2]); // Z-coordinate.
            machineSettingNode = JSON->next(machineSettingNode);

            JSON->readFloat(machineSettingNode, rotation); // rotation.
            machineSettingNode = JSON->next(machineSettingNode);

            JSON->readInteger(machineSettingNode, interiorId);
            if (JSON->getType(machineSettingNode) != JSONInteger)
                continue; // either the data is incomplete or it's incorrect.

            // The data is complete. Create the cash point itself, and register a new zone in our
            // layer for the Zone Manager to make sure that we can check whether a player is in
            // range of a cash point or not.
            CashPoint(m_cashPointCount++)->initialize(position[0], position[1], position[2], rotation, interiorId);
            ZoneLayer(CashPointController::CashPointLayerId)->createZone(position[0] - CashPointController::MaximumDistanceSquare,
                position[0] + CashPointController::MaximumDistanceSquare, position[1] - CashPointController::MaximumDistanceSquare,
                position[1] + CashPointController::MaximumDistanceSquare, position[2] + 10.0);
        }

        // Only send out an error message if we are unable to create any cashpoint at all. Otherwise
        // it'll just spam the console during gamemode startup, which we don't appreciate.
        if (m_cashPointCount == 0)
            printf("[CashPointController] ERROR: Could not load any cash points.");

        JSON->close();
    }

    /**
     * Determine whether a player is in range of a cash-point, which will activate certain commands
     * such as /bank and /withdraw for those who cannot use the commands anywhere.
     *
     * @param playerId Id of the player to check the range for.
     * @return bool Is the player in range of a cash-point?
     */
    public inline bool: isPlayerInRangeOfCashPoint(playerId) {
        return m_playerInRangeOfCashPoint[playerId];
    }

    /**
     * This method will be called by the Zone Manager when a player is near to a cash point. We'll
     * mark them as such, asthis will enable certain commands, and send them a message about their
     * new abilities and commands if this is relevant.
     *
     * @param playerId Id of the player who's near a cash point.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerEnterZone, CashPointController::CashPointLayerId)
    public onPlayerNearCashPoint(playerId, zoneId) {
        m_playerInRangeOfCashPoint[playerId] = true;
        if (IsPlayerInAnyVehicle(playerId))
            return; // never show messages for players in vehicles.

        if (m_hasShownInformativeMessage[playerId])
            return;

        m_playerInRangeOfCashPoint[playerId] = true;

        // Show a message to them about what they can do when they're in range of a cash point. We
        // will only show this message once, so mark it as "being shown" here.
        m_hasShownInformativeMessage[playerId] = true;

        // Players need to be registered with LVP if they want to use a bank account. Otherwise we
        // can't help them -- money not being persistent would just be confusing.
        if (Player(playerId)->isRegistered() == false) {
            SendClientMessage(playerId, Color::Error, "Sorry, only registered players can use the ATM machines!");
            SendClientMessage(playerId, Color::Information, "* Register now on {44CCFF}http://sa-mp.nl/{FFFFFF}!");
            return;
        }

        SendClientMessage(playerId, Color::Information, "Welcome at one of the Las Venturas Bank's ATM machines. How may we help you?");
        SendClientMessage(playerId, Color::Red, "/bank{FFFFFF} - Deposit funds directly into your account.");
        SendClientMessage(playerId, Color::Red, "/withdraw{FFFFFF} - Withdraw funds from your account into your wallet.");
        SendClientMessage(playerId, Color::Red, "/balance{FFFFFF} - Get information on the balance currently available in your account.");

        if (BankAccount(playerId)->type() != PremierBankAccount)
            SendClientMessage(playerId, Color::Information, "Tired of having to use ATM machines? Upgrade your account at our branch near the Planning Department.");

        #pragma unused zoneId
    }

    /**
     * When a player moves away from a check point again, we need to mark them as such as well. We
     * don't want the /bank, /balance and /withdraw commands to continue working regardless.
     *
     * @param playerId Id of the player who isn't near a cash point anymore.
     * @param zoneId Id of the zone in the layer which they just entered.
     */
    @switch(OnPlayerLeaveZone, CashPointController::CashPointLayerId)
    public onPlayerMoveAwayFromCashPoint(playerId, zoneId) {
        m_playerInRangeOfCashPoint[playerId] = false;
        #pragma unused zoneId
    }

    /**
     * Make sure that we'll be able to show informative messages to players who have just connected
     * to the server, and mark them as being out of range of a cash point.
     *
     * @param playerId Id of the player who has just connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerInRangeOfCashPoint[playerId] = false;
        m_hasShownInformativeMessage[playerId] = false;
    }

    /**
     * Retrieve the number of cash-points that has been registered with the gamemode.
     *
     * @return integer
     */
    public inline count() {
        return (m_cashPointCount);
    }
}
