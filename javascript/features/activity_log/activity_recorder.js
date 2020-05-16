// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Query to insert new rows in the `activity_log_deaths` table.
const ACTIVITY_LOG_DEATHS_INSERT = `
    INSERT INTO
      activity_log_deaths
      (user_id, activity_timestamp, activity_position_x, activity_position_y, activity_position_z, activity_reason)
    VALUES
      (?, NOW(), ?, ?, ?, ?)`;

// Query to insert a new row in the `activity_log_hits` table.
const ACTIVITY_LOG_HITS_INSERT = `
    INSERT INTO
      activity_log_hits
      (user_id, target_id, target_distance, weapon_id, activity_timestamp, activity_position_x, activity_position_y, activity_position_z)
    VALUES
      (?, ?, ?, ?, NOW(), ?, ?, ?)`;

// Query to insert a new row in the `activity_log_kills` table.
const ACTIVITY_LOG_KILLS_INSERT = `
    INSERT INTO
      activity_log_kills
      (user_id, killer_id, activity_timestamp, activity_position_x, activity_position_y, activity_position_z, activity_reason)
    VALUES
      (?, ?, NOW(), ?, ?, ?, ?)`;

// Query to insert a new row in the `activity_log_vehicle_deaths` table.
const ACTIVITY_LOG_VEHICLE_DEATHS = `
    INSERT INTO
      activity_log_vehicle_deaths
      (model_id, activity_timestamp, activity_position_x, activity_position_y, activity_position_z)
    VALUES
      (?, NOW(), ?, ?, ?)`;

// Query to insert a new row in the `sessions` table.
const ACTIVITY_LOG_SESSION_PLAYER_CONNECT_INSERT = `
    INSERT INTO
      sessions
      (session_date, session_duration, user_id, nickname, ip_address, gpci_hash)
    VALUES
      (NOW(), 0, 0, ?, ?, ?)`;

// Query to update the session-row of the player on successful login in the `sessions` table.
const ACTIVITY_LOG_SESSION_PLAYER_LOGIN_UPDATE = `
    UPDATE
      sessions
    SET
      sessions.user_id = ?
    WHERE
      sessions.session_id = ?`;

// Query to update the session-row of the player on successful login in the `sessions` table.
const ACTIVITY_LOG_SESSION_PLAYER_GUEST_LOGIN_UPDATE = `
    UPDATE
      sessions
    SET
      sessions.nickname = ?
    WHERE
      sessions.session_id = ?`;

// Query to get the session_date datetime of the disconnecting player in the `sessions` table.
const ACTIVITY_LOG_SESSION_START_DATETIME_SELECT = `
    SELECT
      sessions.session_date
    FROM
      sessions
    WHERE
      sessions.session_id = ?`;

// Query to update the session-row of the disconnecting player in the `sessions` table.
const ACTIVITY_LOG_SESSION_PLAYER_DISCONNECT_UPDATE = `
    UPDATE
      sessions
    SET
      sessions.session_duration = ?
    WHERE
      sessions.session_id = ?`;

// -------------------------------------------------------------------------------------------------

// The activity recorder is responsible for actually recording the events that took place in-game,
// in a more generalized fashion so that they can be written to the database.
class ActivityRecorder {
  constructor(database) {
    this.database_ = database;
  }

  // Writes a death to the database, indicating that |userId| (may be NULL) has died at |position|
  // for the given |reason|.
  writeDeath(userId, position, reason) {
    this.database_.query(ACTIVITY_LOG_DEATHS_INSERT, userId, position.x, position.y, position.z, reason);
  }

  // Writes a kill to the database, indicating that |userId| (may be NULL) has been killed by
  // |killerId| (may be NULL) at |position| for the given |reason|.
  writeKill(userId, killerId, position, reason) {
    this.database_.query(ACTIVITY_LOG_KILLS_INSERT, userId, killerId, position.x, position.y, position.z, reason);
  }

  // Writes the death of a vehicle of |modelId| at |position| to the database.
  writeVehicleDeath(modelId, position) {
    this.database_.query(ACTIVITY_LOG_VEHICLE_DEATHS, modelId, position.x, position.y, position.z);
  }

  // Writes a new session to the database of a player who just connected to log name, numeric
  // variant of their ip and hashed serial.
  // Returns the id of that row to be ablo to update it correctly later on.
  getIdFromWriteInsertSessionAtConnect(playerName, numericIpAddress, hashedGpci) {
    return this.database_.query(ACTIVITY_LOG_SESSION_PLAYER_CONNECT_INSERT, playerName, numericIpAddress, hashedGpci).then(result => {
      if (result.insertId === null)
        throw new Error('Unexpectedly got NULL as the inserted id.');

      return {
          sessionId: result.insertId
      };
    });
  }

  // Updates the row by rowId at login with the id of the registered user
  writeUpdateSessionAtLogin(sessionId, userId) {
    this.database_.query(ACTIVITY_LOG_SESSION_PLAYER_LOGIN_UPDATE, userId, sessionId);
  }

  // Updates the row by rowId at login with the id of the registered user
  writeUpdateSessionAtGuestLogin(sessionId, guestPlayerName) {
    this.database_.query(ACTIVITY_LOG_SESSION_PLAYER_GUEST_LOGIN_UPDATE, guestPlayerName, sessionId);
  }

  // Updates the row by rowId when the player disconnects from the server to write the session dura-
  // tion in seconds
  writeUpdateSessionAtDisconnect(sessionId, currentDateTime) {
      this.database_.query(ACTIVITY_LOG_SESSION_START_DATETIME_SELECT, sessionId).then(results => {
          if (results.rows.length !== 1)
              return null;

          const startDateTime = Date.parse(results.rows[0].session_date);
          if (!Number.isFinite(startDateTime))
              return null;

          const sessionDurationInSeconds = (currentDateTime / 1000) - (startDateTime / 1000);
          this.database_.query(
              ACTIVITY_LOG_SESSION_PLAYER_DISCONNECT_UPDATE, sessionDurationInSeconds, sessionId);
      });
  }
};

export default ActivityRecorder;
