// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The map objects class provides a command allowing staff to try out potential changes to the map.
 * When successful, these changes may be implemented in JavaScript to power the new handler.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class MapObjects {
    // Whether the map objects experiment is active.
    new bool: m_active = false;

    /**
     * Returns whether the map objects experiment is active.
     *
     * @return boolean Is the experiment active?
     */
    public isActive() {
        return m_active;
    }

    /**
     * Called when a player connects to the server. In here we remove a number of objects from the
     * map which we know are not going to be necessary for the feature, when it has been enabled.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        if (!m_active)
            return;

        RemoveBuildingForPlayer(playerId, 8493, 2001.1406, 1555.1016, 24.8750, 10.0);
        RemoveBuildingForPlayer(playerId, 9159, 2001.1406, 1555.1016, 24.8750, 10.0);
        RemoveBuildingForPlayer(playerId, 8981, 2000.5938, 1548.9141, 24.4375, 10.0);
        RemoveBuildingForPlayer(playerId, 1503, 1998.0078, 1544.1953, 12.9609, 10.0);
        RemoveBuildingForPlayer(playerId, 8836, 2027.8828, 1552.1641, 11.2578, 10.0);
        RemoveBuildingForPlayer(playerId, 3498, 2029.7891, 1550.5625, 7.6016, 10.0);
        RemoveBuildingForPlayer(playerId, 3498, 2027.8672, 1540.1094, 7.6016, 10.0);
        RemoveBuildingForPlayer(playerId, 3524, 2005.2344, 1549.6719, 13.7266, 10.0);
        RemoveBuildingForPlayer(playerId, 3524, 2005.4375, 1539.8438, 13.7266, 10.0);
        RemoveBuildingForPlayer(playerId, 3524, 2024.3438, 1540.3906, 11.3125, 10.0);
        RemoveBuildingForPlayer(playerId, 3524, 2025.8281, 1550.3359, 11.3594, 10.0);
        RemoveBuildingForPlayer(playerId, 3524, 1996.0469, 1549.7422, 13.7266, 10.0);
        RemoveBuildingForPlayer(playerId, 3524, 1995.8203, 1539.7813, 13.7266, 10.0);
        RemoveBuildingForPlayer(playerId, 8423, 2028.7813, 1554.9453, 22.1094, 10.0);
        RemoveBuildingForPlayer(playerId, 3434, 2028.7500, 1556.9844, 23.7188, 10.0);
        RemoveBuildingForPlayer(playerId, 3434, 2028.7500, 1552.9063, 23.7188, 10.0);
        RemoveBuildingForPlayer(playerId, 9129, 2028.7656, 1554.9453, 33.5469, 10.0);
        RemoveBuildingForPlayer(playerId, 3482, 2028.7500, 1552.9063, 23.7188, 10.0);
        RemoveBuildingForPlayer(playerId, 8978, 2028.7813, 1554.9453, 22.1094, 10.0);
        RemoveBuildingForPlayer(playerId, 8977, 2001.1406, 1555.1016, 24.8750, 10.0);

        CreatePlayerObject(playerId, 18248, 2016.5385, 1557.5077, 17.7390, 0, 0, 301.0798);
        CreatePlayerObject(playerId, 3594, 2015.3341, 1529.9375, 10.2238, 0, 0, 54.9881);
        CreatePlayerObject(playerId, 1415, 2024.1046, 1551.4060, 9.8868, 0, 0, 186.1724);
        CreatePlayerObject(playerId, 851, 2025.9159, 1552.1045, 10.0665, 0, 0, 0);
        CreatePlayerObject(playerId, 1338, 2019.7738, 1538.5535, 9.7424, 0, 0, 0);
        CreatePlayerObject(playerId, 1347, 2021.0679, 1537.4795, 10.3555, 0, 0, 0);
        CreatePlayerObject(playerId, 3593, 2016.3004, 1528.9978, 10.2505, 0, 0, 347.6111);
        CreatePlayerObject(playerId, 645, 2030.5367, 1531.6088, 9.8100, 3.1416, 0, 25.1074);
        CreatePlayerObject(playerId, 961, 2020.1830, 1531.9095, 9.7041, 0, 0, 0);
        CreatePlayerObject(playerId, 760, 2029.0150, 1540.6987, 9.6534, 0, 0, 0);
        CreatePlayerObject(playerId, 18253, 2008.9211, 1544.6842, 12.0270, 0, 0, 0);
        CreatePlayerObject(playerId, 18253, 2008.9388, 1544.6953, 8.2650, 0, 0, 0);
        CreatePlayerObject(playerId, 18609, 2007.6007, 1543.6754, 15.9063, 0, 0, 333.2314);
    }

    /**
     * Command to toggle whether the map object experiment should be active. Only usable by the
     * Management until the feature will be property reimplemented.
     *
     * @param playerId Id of the player who issued this command.
     * @param player Id or name of the player to fix.
     * @command /mapobj [on/off]
     */
    @command("mapobj")
    public onMapObjCommand(playerId, params[]) {
        if (Player(playerId)->isManagement() == false)
            return 0;

        if (Command->parameterCount(params) >= 1) {
            m_active = Command->booleanParameter(params, 0);
            ShipManager->toggleMapObjects(m_active);

            SendClientMessage(playerId, Color::Success, "Experiment enabled. Note that reconnection is necessary.");
            return 1;
        }

        SendClientMessage(playerId, Color::Information, "Usage: /mapobj [on/off]");
        return 1;
    }
};
