// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActivityRecorder = require('features/activity_log/activity_recorder.js'),
      Feature = require('components/feature_manager/feature.js'),
      ScopedCallbacks = require('base/scoped_callbacks.js');

// The activity log feature keeps track of many in-game events and logs them to the database. This
// is part of an effort to gather more information with Las Venturas Playground, enabling analysis
// of area, vehicle and weapon usage among many other statistics.
class ActivityLog extends Feature {
  constructor(playground) {
    super(playground);

    this.callbacks_ = new ScopedCallbacks();
    this.recorder_ = new ActivityRecorder(playground.database);
    
    // Translates OnPawnEventName to respectively `onPawnEventName` or `pawneventname`.
    const toMethodName = name => name.charAt(0).toLowerCase() + name.slice(1);
    const toEventName = name => name.slice(2).toLowerCase();

    [
      'OnPlayerResolvedDeath',  // { playerid, killerid, reason }
      'OnVehicleDeath'          // { vehicleid }

    ].forEach(name =>
        this.callbacks_.addEventListener(toEventName(name), this.__proto__[toMethodName(name)].bind(this)));
  }

  // Called when a confirmed death has happened with the corrected Id of the killer, if any. The
  // |event| contains the { playerid, killerid, reason } about the death.
  onPlayerResolvedDeath(event) {
    const player = Player.get(event.playerid);
    if (!player)
      return;

    const userId = player.isRegistered() ? player.account.userId : null;
    const position = player.position;

    const killer = Player.get(event.killerid);
    if (!killer)
      this.recorder_.writeDeath(userId, position, event.reason);
    else
      this.recorder_.writeKill(userId, killer.isRegistered() ? killer.account.userId : null, position, event.reason);
  }

  // Called when a vehicle has died. The |event| contains the { vehicleid }.
  onVehicleDeath(event) {
    const vehicle = new Vehicle(event.vehicleid);
    if (!vehicle)
      return;

    const modelId = vehicle.modelId;
    const position = vehicle.position;

    this.recorder_.writeVehicleDeath(modelId, position);
  }
};

exports = ActivityLog;
