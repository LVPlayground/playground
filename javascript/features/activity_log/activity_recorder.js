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
      (? NOW(), ?, ?, ?)`;

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

  // Writes the hit to the database, indicating that |userId| (may be NULL) has hit |targetId| (may
  // be NULL) with a |weaponId| at a distance of |targetDistance|.
  writeHit(userId, targetId, targetDistance, weaponId, position) {
    this.database_.query(ACTIVITY_LOG_HITS_INSERT, userId, targetId, targetDistance, weaponId,
                         position.x, position.y, position.z);
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
};

exports = ActivityRecorder;
