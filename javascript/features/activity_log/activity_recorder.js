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

// Query to insert a new row in the `activity_log_kills` table.
const ACTIVITY_LOG_KILLS_INSERT = `
    INSERT INTO
      activity_log_kills
      (user_id, killer_id, activity_timestamp, activity_position_x, activity_position_y, activity_position_z, activity_reason)
    VALUES
      (?, ?, NOW(), ?, ?, ?, ?)`;

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
};

exports = ActivityRecorder;
