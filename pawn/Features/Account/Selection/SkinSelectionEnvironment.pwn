// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The Skin Selection feature will be done in a certain environment, i.e. in a certain virtual
 * world with forced time and weather. This class encapsulates that functionality.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SkinSelectionEnvironment {
    // Virtual world in which skin selection should take place.
    new m_virtualWorld;

    // Weather Id which should be active at this location, for anyone in skin selection.
    new m_weatherId;

    // Time of day (hours and minutes) which should be applied for this player.
    new m_time[2];

    // Position as which the player should be teleported.
    new Float: m_position[3];

    // Interior in which the skin group selection will take place.
    new m_interiorId;

    /**
     * Initializes the environment by reading from the passed data node. It should contain five keys
     * with data, namely 'world', for the virtual world, 'time', an array with [HH, MM] time for the
     * environment, 'weather' with the weather Id and 'position' for the teleport-to position. The
     * 'interior' key will be used to identify the right interior Id, usually zero (outside).
     *
     * @param dataNode Node in the data file which contains this information.
     */
    public initialize(Node: dataNode) {
        new Node: virtualWorldNode = JSON->find(dataNode, "world"),
            Node: weatherIdNode = JSON->find(dataNode, "weather"),
            Node: timeNode = JSON->find(dataNode, "time"),
            Node: positionNode = JSON->find(dataNode, "position"),
            Node: interiorNode = JSON->find(dataNode, "interior");

        // First apply the simple value nodes.
        if (virtualWorldNode != JSON::InvalidNode)
            JSON->readInteger(virtualWorldNode, m_virtualWorld);

        if (weatherIdNode != JSON::InvalidNode)
            JSON->readInteger(weatherIdNode, m_weatherId);

        if (interiorNode != JSON::InvalidNode)
            JSON->readInteger(interiorNode, m_interiorId);

        // Now use loops to cycle through the time and position nodes, which both are arrays and
        // thus have multiple actual values (which is a little bit trickier to read).
        if (timeNode != JSON::InvalidNode) {
            new Node: hourNode = JSON->firstChild(timeNode),
                Node: minuteNode = JSON->next(hourNode);

            JSON->readInteger(hourNode, m_time[0]);
            JSON->readInteger(minuteNode, m_time[1]);
        }

        if (positionNode != JSON::InvalidNode) {
            new Node: positionXNode = JSON->firstChild(positionNode),
                Node: positionYNode = JSON->next(positionXNode),
                Node: positionZNode = JSON->next(positionYNode);

            JSON->readFloat(positionXNode, m_position[0]);
            JSON->readFloat(positionYNode, m_position[1]);
            JSON->readFloat(positionZNode, m_position[2]);
        }
    }

    /**
     * Sets up the player in the skin selection environment, by applying all the environmental
     * settings to their client. This should be reset after selection is done.
     *
     * @param playerId Id of the player to set up the environment for.
     */
    public setUpForPlayer(playerId) {
        SetPlayerVirtualWorld(playerId, m_virtualWorld);
        SetPlayerWeather(playerId, m_weatherId);
        SetPlayerPos(playerId, m_position[0], m_position[1], m_position[2]);
        SetPlayerInterior(playerId, m_interiorId);

        TimeController->setPlayerOverrideTime(playerId, m_time[0], m_time[1]);
    }

    /**
     * Returns the virtual world in which skin selection takes place. We need to expose this because
     * of objects which may be created as part of a skin group.
     *
     * @return integer The Virtual World used for skin selection.
     */
    public inline virtualWorld() {
        return m_virtualWorld;
    }

    /**
     * Returns the interior Id in which skin selection takes place. We need to expose this because
     * of objects which may be created as part of a skin group.
     *
     * @return integer The Interior Id used for skin selection.
     */
    public inline interiorId() {
        return m_interiorId;
    }
};
