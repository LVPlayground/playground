// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActivityRecorder = require('features/activity_log/activity_recorder.js'),
      Feature = require('components/feature_manager/feature.js'),
      ScopedCallbacks = require('base/scoped_callbacks.js'),
      Vector = require('base/vector.js');

// The activity log feature keeps track of many in-game events and logs them to the database. This
// is part of an effort to gather more information with Las Venturas Playground, enabling analysis
// of area, vehicle and weapon usage among many other statistics.
class ActivityLog extends Feature {
  constructor(playground) {
    super(playground);

    this.callbacks_ = new ScopedCallbacks();
    this.recorder_ = new ActivityRecorder(server.database);
    
    // Translates OnPawnEventName to respectively `onPawnEventName` or `pawneventname`.
    const toMethodName = name => name.charAt(0).toLowerCase() + name.slice(1);
    const toEventName = name => name.slice(2).toLowerCase();

    [
      'OnPlayerResolvedDeath',  // { playerid, killerid, reason }
      'OnPlayerWeaponShot',     // { playerid, weaponid, hittype, hitid, fX, fY, fZ }
      'OnVehicleDeath'          // { vehicleid }

    ].forEach(name =>
        this.callbacks_.addEventListener(toEventName(name), this.__proto__[toMethodName(name)].bind(this)));
  }

  // Called when a confirmed death has happened with the corrected Id of the killer, if any. The
  // |event| contains the { playerid, killerid, reason } about the death.
  onPlayerResolvedDeath(event) {
    const player = server.playerManager.getById(event.playerid);
    if (!player)
      return;

    const userId = player.isRegistered() ? player.account.userId : null;
    const position = player.position;

    const killer = server.playerManager.getById(event.killerid);
    if (!killer)
      this.recorder_.writeDeath(userId, position, event.reason);
    else
      this.recorder_.writeKill(userId, killer.isRegistered() ? killer.account.userId : null, position, event.reason);
  }

  // Called when a player has fired from a weapon. Only |event|s that hit a player or a vehicle will
  // be recorded, with all available information and the distance of the shot.
  onPlayerWeaponShot(event) {
    if (event.hittype != 1 /* BULLET_HIT_TYPE_PLAYER */ &&
        event.hittype != 2 /* BULLET_HIT_TYPE_VEHICLE */)
      return;

    const player = server.playerManager.getById(event.playerid);
    if (!player)
      return;

    const userId = player.isRegistered() ? player.account.userId : null;
    const position = player.position;

    let targetUserId = null;
    if (event.hittype == 1 /* BULLET_HIT_TYPE_PLAYER */) {
      const targetPlayer = server.playerManager.getById(event.hitid);
      if (targetPlayer && targetPlayer.isRegistered())
        targetUserId = targetPlayer.account.userId;
    }

    // TODO(Russell): It would be great if we could consider the driver of the vehicle that's being
    // hit here as well, but iterating over all players for every shot would be too expensive :/.

    const targetDistance = new Vector(event.fX, event.fY, event.fZ).magnitude;

    this.recorder_.writeHit(userId, targetUserId, targetDistance, event.weaponid, position);
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
