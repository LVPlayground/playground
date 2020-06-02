// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to insert a new row in the `sessions` table.
const CREATE_PLAYER_SESSION_QUERY = `
    INSERT INTO
        sessions
        (session_date, session_duration, user_id, nickname, ip_address, gpci_hash)
    VALUES
        (NOW(), 0, 0, ?, INET_ATON(?), ?)`;

// Query to associate a session with user information of a particular account.
const ASSOCIATE_PLAYER_SESSION_QUERY = `
    UPDATE
        sessions
    SET
        sessions.user_id = ?
    WHERE
        sessions.session_id = ?`;

// Query to associate a player's latest nickname with their active session.
const CHANGE_NAME_PLAYER_SESSION_QUERY = `
    UPDATE
        sessions
    SET
        sessions.nickname = ?
    WHERE
        sessions.session_id = ?`;

// Query to store a player's death in the database.
const RECORD_DEATH_QUERY = `
    INSERT INTO
        activity_log_deaths
        (user_id, activity_timestamp, activity_position_x, activity_position_y, activity_position_z,
         activity_reason)
    VALUES
        (?, NOW(), ?, ?, ?, ?)`;

// Query to store a murder (!!!) on the server in the database.
const RECORD_KILL_QUERY = `
    INSERT INTO
        activity_log_kills
        (user_id, killer_id, activity_timestamp, activity_position_x, activity_position_y,
         activity_position_z, activity_reason)
    VALUES
        (?, ?, NOW(), ?, ?, ?, ?)`;

// Query to finalize an entry in the `sessions` table.
const FINALIZE_PLAYER_SESSION_QUERY = `
    UPDATE
        sessions
    SET
        sessions.session_duration = TIMESTAMPDIFF(SECOND, session_date, NOW())
    WHERE
        sessions.session_id = ?`;

// -------------------------------------------------------------------------------------------------

// The activity recorder is responsible for actually recording the events that took place in-game,
// in a more generalized fashion so that they can be written to the database.
export class ActivityRecorder {
    static kInvalidSessionId = -1;

    // Creates a session in the database for the given |player|, and returns the created session Id.
    async createPlayerSession(player) {
        const result = await server.database.query(
            CREATE_PLAYER_SESSION_QUERY, player.name, player.ip, player.serial);
        
        return result?.insertId ?? ActivityRecorder.kInvalidSessionId;
    }

    // Updates the |sessionId| with user information now that the |player| has identified to their
    // account. This will ensure accurate tracking of playing time.
    async updateSessionOnIdentification(sessionId, player) {
        if (sessionId === ActivityRecorder.kInvalidSessionId)
            return;  // the session could not be created when they connected
        
        server.database.query(ASSOCIATE_PLAYER_SESSION_QUERY, player.account.userId, sessionId);
    }

    // Updates the |sessionId| with the |player|'s most recent nickname, after it has changed.
    async updateSessionOnNameChange(sessionId, player) {
        if (sessionId === ActivityRecorder.kInvalidSessionId)
            return;  // the session could not be created when they connected
        
        server.database.query(CHANGE_NAME_PLAYER_SESSION_QUERY, player.name, sessionId);
    }

    // Records that the given |player| has died because of the given |reason|.
    recordPlayerDeath(player, reason) {
        const position = player.position;

        server.database.query(
            RECORD_DEATH_QUERY, player.account.userId, position.x, position.y, position.z, reason);
    }

    // Records that the given |player| has been killed by |killer| because of the given |reason|.
    recordPlayerKill(player, killer, reason) {
        const position = player.position;

        server.database.query(
            RECORD_KILL_QUERY, player.account.userId, killer.account.userId, position.x, position.y,
            position.z, reason);
    }

    // Finalizes a player's session in the database. This makes sure that the session's duration is
    // updated appropriately, for statistical purposes.
    async finalizePlayerSession(sessionId) {
        if (sessionId === ActivityRecorder.kInvalidSessionId)
            return;  // the session could not be created when they connected

        server.database.query(FINALIZE_PLAYER_SESSION_QUERY, sessionId);
    }
}
