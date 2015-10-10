// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Describe the "why" of this class here.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RaceController {
    // The highest race Id which has been loaded by the RaceTrackLoader.
    new m_highestRaceId;

    /**
     * Initializes the state of the race controller and starts requesting track information from the
     * database by asking the RaceTrackLoader to execute the necessary queries.
     */
    public __construct() {
        m_highestRaceId = 0;
#if Feature::EnableRaceSystem == 1
        RaceTrackLoader->loadTrackData();
#endif
    }

    /**
     * When a race track has been initialized, it will announce this to the controller so that we
     * can adjust the highest race Id if there is a need to.
     *
     * @param raceId Id of the race which has been loaded from the database.
     */
    public onRaceInitialized(raceId) {
        if (raceId > m_highestRaceId)
            m_highestRaceId = raceId;
    }

    /**
     * What is the highest race Id which has currently been loaded in Las Venturas Playground? In
     * various places we need to validate the race Id passed by a user or script, which this data is
     * essential in. Race Ids are not necessarilly sequential, so be sure to check for existence.
     *
     * @return integer The highest race Id which has been loaded by the gamemode.
     */
    public inline highestRaceId() {
        return m_highestRaceId;
    }
};
