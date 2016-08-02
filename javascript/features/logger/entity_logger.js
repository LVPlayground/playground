// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');
const SessionId = require('features/logger/session_id.js');

// The entity logger is responsible for creating log entities for the observable methods on the
// entity managers, for example the PlayerManager.
class EntityLogger {
    constructor(writer, sessions) {
        this.writer_ = writer;
        this.sessions_ = sessions;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playergivedamage', EntityLogger.prototype.onPlayerGiveDamage.bind(this));
        this.callbacks_.addEventListener(
            'playerresolveddeath', EntityLogger.prototype.onPlayerDeath.bind(this));
        this.callbacks_.addEventListener(
            'playertakedamage', EntityLogger.prototype.onPlayerTakeDamage.bind(this));
        this.callbacks_.addEventListener(
            'playertext', EntityLogger.prototype.onPlayerText.bind(this));
        this.callbacks_.addEventListener(
            'playerweaponshot', EntityLogger.prototype.onPlayerWeaponShot.bind(this));

        server.playerManager.addObserver(this);
    }

    // Records that |player| has connected to the server. This generates a session Id for the player
    // that can be used to track events for a given session.
    onPlayerConnect(player) {
        this.sessions_.set(player, SessionId.generateForPlayer(player));

        this.writer_.writeEvent('playerconnect', {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: 0,
            ip: player.ip
        });
    }

    // Records that |player| has disconnected from the server. This removes the session Id assigned
    // to the player from the set of active sessions.
    onPlayerDisconnect(player, reason) {
        this.writer_.writeEvent('playerdisconnect', {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: player.userId,
            ip: player.ip
        });

        this.sessions_.delete(player);
    }

    // Records that a player has given damage to another player.
    onPlayerGiveDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const victim = server.playerManager.getById(event.damagedid);
        if (!victim || !this.sessions_.has(victim))
            return;  // invalid event

        const position = player.position;

        this.writer_.writeEvent('playergivedamage', {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: player.userId,
            ip: player.ip,

            // Information specific to this event.
            position_x: position.x,
            position_y: position.y,
            position_z: position.z,

            victim_session: this.sessions_.get(victim),
            victim_nickname: victim.name,
            victim_user_id: victim.userId,
            victim_ip: victim.ip,

            amount: event.amount,
            reason: event.weaponid,
            bodypart: event.bodypart
        });
    }

    // Records that a player has either died, or has been killed by another player.
    onPlayerDeath(event) {
        const killee = server.playerManager.getById(event.playerid);
        if (!killee || !this.sessions_.has(killee))
            return;  // invalid event

        const position = killee.position;

        let record = {
            session: this.sessions_.get(killee),
            nickname: killee.name,
            user_id: killee.userId,
            ip: killee.ip,

            // Information specific to this event.
            position_x: position.x,
            position_y: position.y,
            position_z: position.z,
            reason: event.reason
        };

        const killer = server.playerManager.getById(event.killerid);
        if (!killer || !this.sessions_.has(killer)) {
            this.writer_.writeEvent('playerdeath', record);
            return;
        }

        record.killer_session = this.sessions_.get(killer);
        record.killer_nickname = killer.name;
        record.killer_user_id = killer.userId;
        record.killer_ip = killer.ip;

        this.writer_.writeEvent('playerkill', record);
    }

    // Records that a player has taken damage from another player.
    onPlayerTakeDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const position = player.position;

        let record = {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: player.userId,
            ip: player.ip,

            // Information specific to this event.
            position_x: position.x,
            position_y: position.y,
            position_z: position.z,

            amount: event.amount,
            reason: event.weaponid,
            bodypart: event.bodypart
        };

        const victim = server.playerManager.getById(event.issuerid);
        if (victim && this.sessions_.has(victim)) {
            record.victim_session = this.sessions_.get(victim);
            record.victim_nickname = victim.name;
            record.victim_user_id = victim.userId;
            record.victim_ip = victim.ip;
        }

        this.writer_.writeEvent('playertakedamage', record);
    }

    // Records that a player has said something in main chat.
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        this.writer_.writeEvent('text', {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: player.userId,
            ip: player.ip,

            // Information specific to this event.
            text: event.text
        });
    }

    // Records that a player has shot a weapon at another entity.
    onPlayerWeaponShot(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const position = player.position;
        const target = new Vector(event.fX, event.fY, event.fZ);

        let record = {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: player.userId,
            ip: player.ip,

            // Information specific to this event.
            hit_distance: position.distanceTo(target),
            hit_type: event.hittype,

            position_x: position.x,
            position_y: position.y,
            position_z: position.z,

            target_x: target.x,
            target_y: target.y,
            target_z: target.z
        };

        if (event.hittype === 1 /* BULLET_HIT_TYPE_PLAYER */) {
            const victim = server.playerManager.getById(event.hitid);
            if (victim && this.sessions_.has(victim)) {
                record.victim_session = this.sessions_.get(victim);
                record.victim_nickname = victim.name;
                record.victim_user_id = victim.userId;
                record.victim_ip = victim.ip;
            }
        }

        this.writer_.writeEvent('playerweaponshot', record);
    }

    // Records that |player| has logged in to their account.
    onPlayerLogin(player) {
        this.writer_.writeEvent('playerlogin', {
            session: this.sessions_.get(player),
            nickname: player.name,
            user_id: player.userId,
            ip: player.ip,

            // Specific to this event.
            level: player.level
        });
    }

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        server.playerManager.removeObserver(this);
    }
}

exports = EntityLogger;
