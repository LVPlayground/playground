// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Each race track has certain information associated with it. The difficulty, name, position of the
 * race indicator, and so on. The RaceTrackLoader will provide us with this information and we store
 * it here so that it can be available for the rest of the gamemode.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RaceTrack <raceId (MaximumNumberOfRaceTracks)> {
    // What is the Id of this race track in the database?
    new m_databaseId;

    // What is the name of this race?
    new m_name[32];

    // How many players can participate in this race at any given time?
    new m_maxPlayers;

    // What should the weather be in this race's environment?
    new m_environmentWeather;

    // What time should it be in this race's environment?
    new m_environmentTime;

    // Which vehicle model Id will be used for driving in this race?
    new m_vehicleModel;

    // What is the difficulty level of this race?
    new RaceDifficulty: m_difficuly;

    // User Id of the player who set the current record on this track.
    new m_recordUserId;

    // Nickname of the player who set the current record on this track.
    new m_recordUserName[24];

    // The number of milliseconds that player took to finish the race.
    new m_recordTime;

    /**
     * Initializes the basic information of this race track based on what we've read from the
     * database. All the arguments will be stored in the RaceTrack class.
     *
     * @param databaseId Id of this race in the database, which we map results to.
     * @param name Name of the race, displayed in various user interfaces.
     * @param maxPlayers How many players can participate in this race at the same time?
     * @param weather What is the weather Id which should apply for this race.
     * @param time What is the time (hour) which should apply for this race.
     * @param difficulty Difficulty level of this race.
     */
    public initialize(databaseId, name[], maxPlayers, weather, time, vehicleModel, RaceDifficulty: difficulty) {
        m_databaseId = databaseId;
        strncpy(m_name, name, sizeof(m_name));
        m_maxPlayers = maxPlayers;
        m_environmentWeather = weather;
        m_environmentTime = time;
        m_vehicleModel = vehicleModel;
        m_difficuly = difficulty;

        // Announce to the RaceController that we have been initialized.
        RaceController->onRaceInitialized(raceId);
    }

    /**
     * Creates an indicator on the minimap to indicate to players that this is a spot where a race
     * can be started. Furthermore, we'll create a pickup which players can walk in to, after which
     * they will be offered the chance to actually start this race (or just see records).
     *
     * @param positionX X-coordinate of the position where the indicator should be.
     * @param positionY Y-coordinate of the position where the indicator should be.
     * @param positionZ Z-coordinate of the position where the indicator should be.
     */
    public createIndicator(Float: positionX, Float: positionY, Float: positionZ) {
        // TODO: Create an indicator of this race, a race icon, on the minimap.
        // TODO: Create a pickup or checkpoint for players to start this race.
        #pragma unused positionX, positionY, positionZ
    }

    /**
     * Sets who the current record holder of this race is, and with what time. This method will only
     * update the gamemode's internal state and will not make any modifications to the database.
     *
     * @param userId Id of the user who set this record.
     * @param userName Nickname of the user who set this record.
     * @param recordTime The total time, in milliseconds, the user spend on the game.
     */
    public setRecordHolder(userId, userName[], recordTime) {
        m_recordUserId = userId;
        strncpy(m_recordUserName, userName, sizeof(m_recordUserName));
        m_recordTime = recordTime;
    }

    /**
     * Returns whether a race has been created with this race Id. We'll simply check whether the
     * set database Id is something other than the default zero, which implies we've been initialized.
     *
     * @return boolean Has a race track with this race Id been initialized?
     */
    public inline bool: exists() {
        return (!!m_databaseId);
    }
};
