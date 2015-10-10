// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * When race track data has been retrieved from the database, the MySQL plugin will invoke this
 * method allowing us to forward it to the RaceTrackLoader. Free up the result immediately after we
 * received it, because we don't want to leak the memory.
 *
 * @param resultId Id of the result set which contains the track information.
 * @param dataId Extra data supplied to the query. Unused.
 */
forward OnRaceTrackDataAvailable(resultId, dataId);
public OnRaceTrackDataAvailable(resultId, dataId) {
    RaceTrackLoader->onRaceTrackDataAvailable(resultId);
    DatabaseResult(resultId)->free();

    #pragma unused dataId
}

/**
 * All race information -- tracks, spawn positions, environment information and timing information,
 * will be stored in the database. The RaceTrackLoader is responsible for one-time initialization
 * of that data from the database back to the gamemode.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class RaceTrackLoader {
    /**
     * Execute a query on the MySQL database requesting all the race information to be fed back to
     * Las Venturas Playground. We can initialize the individual RaceTrack information based on the
     * data, which will enable the race system to work correctly.
     */
    public loadTrackData() {
        Database->query("SELECT " ...
                        "  race_tracks.race_track_id, race_id, race_name, race_indicator_x, race_indicator_y, race_indicator_z, " ...
                        "  race_max_players, race_weather, race_time, race_vehicle_model, race_difficulty, " ...
                        "  MIN(result_time) AS result_time, users.user_id, users.username " ...
                        "FROM " ...
                        "  race_tracks " ...
                        "LEFT JOIN " ...
                        "  race_results ON race_results.race_track_id = race_tracks.race_track_id " ...
                        "LEFT JOIN " ...
                        "  users ON users.user_id = race_results.result_user_id " ...
                        "WHERE " ...
                        "  deleted = 0 " ...
                        "GROUP BY " ...
                        "  race_tracks.race_track_id", "OnRaceTrackDataAvailable", 0);
    }

    /**
     * When race track information has become available from the database, we'll initialize the
     * associated RaceTrack objects. These will feed the /race command and allow players to start
     * a race itself. Just before a race starts, we'll fetch more information from the database.
     *
     * @param resultId Id of the result set which contains the track information.
     */
    public onRaceTrackDataAvailable(resultId) {
        if (DatabaseResult(resultId)->count() == 0)
            return;

        new raceName[32], recordUserName[24];
        while (DatabaseResult(resultId)->next()) {
            new raceId = DatabaseResult(resultId)->readInteger("race_id");
            if (raceId <= 0 || raceId >= MaximumNumberOfRaceTracks || RaceTrack(raceId)->exists())
                continue; // the race's Id is invalid, or a race with this Id already exists.

            new databaseId   = DatabaseResult(resultId)->readInteger("race_track_id"),
                maxPlayers   = DatabaseResult(resultId)->readInteger("race_max_players"),
                weather      = DatabaseResult(resultId)->readInteger("race_weather"),
                time         = DatabaseResult(resultId)->readInteger("race_time"),
                vehicleModel = DatabaseResult(resultId)->readInteger("race_vehicle_model");

            new RaceDifficulty: difficulty = this->readRaceDifficulty(resultId);
            DatabaseResult(resultId)->readString("race_name", raceName);

            // Initialize the basic information from the race itself. This will mark the RaceTrack
            // as existing as well, meaning it will show up in various commands.
            RaceTrack(raceId)->initialize(databaseId, raceName, maxPlayers, weather, time, vehicleModel, difficulty);

            new Float: indicatorPositionX = DatabaseResult(resultId)->readFloat("race_indicator_x"),
                Float: indicatorPositionY = DatabaseResult(resultId)->readFloat("race_indicator_y"),
                Float: indicatorPositionZ = DatabaseResult(resultId)->readFloat("race_indicator_z");

            // Create the visual race indicator on the minimap, and register a checkpoint so the
            // player will be able to start a race without having to type any command at all.
            RaceTrack(raceId)->createIndicator(indicatorPositionX, indicatorPositionY, indicatorPositionZ);

            new recordTime   = DatabaseResult(resultId)->readInteger("result_time"),
                recordUserId = DatabaseResult(resultId)->readInteger("user_id");
            DatabaseResult(resultId)->readString("username", recordUserName);

            // Set the current record holder for this game. This hypothetically can be changed while
            // the gamemode is running, so we have a separate method for sharing this.
            RaceTrack(raceId)->setRecordHolder(recordUserId, recordUserName, recordTime);
        }
    }

    /**
     * Reads the race's difficulty from the database result. This has been stored as an ENUM in the
     * database, thus the MySQL plugin will return it to us as a string.
     *
     * @param resultId Id of the database result set we're currently reading.
     * @return RaceDifficulty Difficulty level of the current race.
     */
    private RaceDifficulty: readRaceDifficulty(resultId) {
        new difficulty[8];

        DatabaseResult(resultId)->readString("race_difficulty", difficulty);
        if (!strcmp(difficulty, "easy", true, 4))
            return EasyRaceDifficulty;

        if (!strcmp(difficulty, "hard", true, 4))
            return HardRaceDifficulty;

        return NormalRaceDifficulty;
    }
};
