// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ActivityRecorder = require('features/activity_log/activity_recorder.js');
const Feature = require('components/feature_manager/feature.js');
const ScopedCallbacks = require('base/scoped_callbacks.js');
const Murmur3Hash = require('features/activity_log/murmur3hash.js');

// IRC tag used to show the players name, id, ip and gpci
const JoinIpGpciTag = 'joinipgpci';

// The activity log feature keeps track of many in-game events and logs them to the database. This
// is part of an effort to gather more information with Las Venturas Playground, enabling analysis
// of area, vehicle and weapon usage among many other statistics.
class ActivityLog extends Feature {
  constructor() {
    super();

    this.callbacks_ = new ScopedCallbacks();
    this.recorder_ = new ActivityRecorder(server.database);

    // Translates OnPawnEventName to respectively `onPawnEventName` or `pawneventname`.
    const toMethodName = name => name.charAt(0).toLowerCase() + name.slice(1);
    const toEventName = name => name.slice(2).toLowerCase();

    [
      'OnPlayerResolvedDeath',  // { playerid, killerid, reason }
//    'OnPlayerWeaponShot',     // { playerid, weaponid, hittype, hitid, fX, fY, fZ }
      'OnPlayerConnect',        // { playerid }
      'OnPlayerLogin',          // { playerid, userid, gangid }
      'OnPlayerGuestLogin',     // { playerId  }
      'OnPlayerDisconnect',     // { playerid, reason }

    ].forEach(name =>
        this.callbacks_.addEventListener(toEventName(name), this.__proto__[toMethodName(name)].bind(this)));

    this.playerSessionIdMap_ = new Map(); // { playerid, sessionid )

    // To be able to show the IP and GPCI on IRC
    this.announce_ = this.defineDependency('announce');
  }

  // Called when a confirmed death has happened with the corrected Id of the killer, if any. The
  // |event| contains the { playerid, killerid, reason } about the death.
  onPlayerResolvedDeath(event) {
    const player = server.playerManager.getById(event.playerid);
    if (!player)
      return;

    const userId = player.isRegistered() ? player.userId : null;
    const position = player.position;

    const killer = server.playerManager.getById(event.killerid);
    if (!killer)
      this.recorder_.writeDeath(userId, position, event.reason);
    else
      this.recorder_.writeKill(userId, killer.isRegistered() ? killer.userId : null, position, event.reason);
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

    const userId = player.isRegistered() ? player.userId : null;
    const position = player.position;

    let targetUserId = null;
    if (event.hittype == 1 /* BULLET_HIT_TYPE_PLAYER */) {
      const targetPlayer = server.playerManager.getById(event.hitid);
      if (targetPlayer && targetPlayer.isRegistered())
        targetUserId = targetPlayer.userId;
    }

    // TODO(Russell): It would be great if we could consider the driver of the vehicle that's being
    // hit here as well, but iterating over all players for every shot would be too expensive :/.

    const targetDistance = new Vector(event.fX, event.fY, event.fZ).magnitude;

    this.recorder_.writeHit(userId, targetUserId, targetDistance, event.weaponid, position);
  }

  // Called when a player connects. Logs the name, numeric variant of their ip and hashed serial to
  // the database to be able to keep track of them.
  onPlayerConnect(event) {
    const player = server.playerManager.getById(event.playerid);
    if (!player || player.isNpc())
      return;

    const numericIpAddress = this.ip2long(player.ipAddress);
    const hashedGpci = Murmur3Hash.generateHash(player.gpci);

    this.announce_.announceToIRC(JoinIpGpciTag, player.id, player.ipAddress, player.name, hashedGpci);

    this.recorder_.getIdFromWriteInsertSessionAtConnect(player.name, numericIpAddress, hashedGpci).then (result => {
      this.playerSessionIdMap_.set(player.id, result.sessionId);
    });
  }

  // Called at the moment a player logged in with a correct password. In this successful case we can
  // update the session with the userid of the player.
  onPlayerLogin(event) {
    const player = server.playerManager.getById(event.playerid);
    if (!player || player.isNpc())
      return;

    if (!this.playerSessionIdMap_.has(player.id))
      return;

    const sessionId = this.playerSessionIdMap_.get(player.id);
    this.recorder_.writeUpdateSessionAtLogin(sessionId, player.userId);
  }

  // Called at the moment a player with an already used nickname wants to play as guest. In that
  // case his name changes and we should adjust that in the db.
  onPlayerGuestLogin(event) {
    const player = server.playerManager.getById(event.playerId);
    if (!player || player.isNpc())
      return;

    if (!this.playerSessionIdMap_.has(player.id))
      return;

    const sessionId = this.playerSessionIdMap_.get(player.id);
    const guestPlayerName = pawnInvoke('GetPlayerName', 'iS', player.id);

    this.recorder_.writeUpdateSessionAtGuestLogin(sessionId, guestPlayerName);
  }

  // Called when a player somehow leaves the server.
  onPlayerDisconnect(event) {
    if (!this.playerSessionIdMap_.has(event.playerid))
      return;

    const sessionId = this.playerSessionIdMap_.get(event.playerid);
    this.recorder_.writeUpdateSessionAtDisconnect(sessionId, Date.now());

    this.playerSessionIdMap_.delete(event.playerid);
  }

  // TODO: move this to a better place!
  // Converts an IP to an int to store in the database
  ip2long (ip) {
    const numericParts = ip.split('.');

    return ((((((+numericParts[0])*256)
               +(+numericParts[1]))*256)
               +(+numericParts[2]))*256)
               +(+numericParts[3]);
  }
};

exports = ActivityLog;
