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
            'playerweaponshot', EntityLogger.prototype.onPlayerWeaponShot.bind(this));

        this.callbacks_.addEventListener(
            'playertext', EntityLogger.prototype.onPlayerText.bind(this));
        this.callbacks_.addEventListener(
            'playercommandtext', EntityLogger.prototype.onPlayerCommandText.bind(this));

        this.callbacks_.addEventListener(
            'vehicledeath', EntityLogger.prototype.onVehicleDeath.bind(this));
        this.callbacks_.addEventListener(
            'vehiclemod', EntityLogger.prototype.onVehicleMod.bind(this));
        this.callbacks_.addEventListener(
            'vehiclepaintjob', EntityLogger.prototype.onVehiclePaintjob.bind(this));
        this.callbacks_.addEventListener(
            'vehiclerespray', EntityLogger.prototype.onVehicleRespray.bind(this));
        this.callbacks_.addEventListener(
            'vehiclesirenstatechange', EntityLogger.prototype.onVehicleSirenStateChange.bind(this));

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Records that |player| has connected to the server. This generates a session Id for the player
    // that can be used to track events for a given session.
    onPlayerConnect(player) {
        this.sessions_.set(player, SessionId.generateForPlayer(player));
        this.writer_.writeAttributedEvent(player, 'playerconnect', {
            nickname: player.name,
            gpci: player.gpci,
            ip: player.ip,
            players: server.playerManager.count
        });
    }

    // Records that |player| has disconnected from the server. This removes the session Id assigned
    // to the player from the set of active sessions.
    onPlayerDisconnect(player, reason) {
        this.writer_.writeAttributedEvent(player, 'playerdisconnect', {
            reason: reason,
            players: server.playerManager.count
        });

        this.sessions_.delete(player);
    }

    // Records that |player| has logged in to their account.
    onPlayerLogin(player) {
        this.writer_.writeAttributedEvent(player, 'playerlogin', {
            level: player.level
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Records that a player has given damage to another player.
    onPlayerGiveDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const victim = server.playerManager.getById(event.damagedid);
        if (!victim || !this.sessions_.has(victim))
            return;  // invalid event

        const position = player.position;

        this.writer_.writeAttributedEvent(player, 'playergivedamage', {
            position: this.vectorToArray(position),
            distance: victim.position.distanceTo(position),

            victim_session: this.sessions_.get(victim),
            victim_user_id: victim.userId,

            amount: event.amount,
            weaponid: event.weaponid,
            bodypart: event.bodypart
        });
    }

    // Records that a player has either died, or has been killed by another player.
    onPlayerDeath(event) {
        const killee = server.playerManager.getById(event.playerid);
        if (!killee || !this.sessions_.has(killee))
            return;  // invalid event

        let record = {
            position: this.vectorToArray(killee.position),
            reason: event.reason
        };

        const killer = server.playerManager.getById(event.killerid);
        if (!killer || !this.sessions_.has(killer)) {
            this.writer_.writeAttributedEvent(killee, 'playerdeath', record);
            return;
        }

        record.killer_session = this.sessions_.get(killer);
        record.killer_user_id = killer.userId;

        this.writer_.writeAttributedEvent(killee, 'playerkill', record);
    }

    // Records that a player has taken damage from another player.
    onPlayerTakeDamage(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const position = player.position;

        let record = {
            position: this.vectorToArray(position),

            amount: event.amount,
            weaponid: event.weaponid,
            bodypart: event.bodypart
        };

        const issuer = server.playerManager.getById(event.issuerid);
        if (issuer && this.sessions_.has(issuer)) {
            record.distance = issuer.position.distanceTo(position);

            record.issuer_session = this.sessions_.get(issuer);
            record.issuer_user_id = issuer.userId;
        }

        this.writer_.writeAttributedEvent(player, 'playertakedamage', record);
    }

    // Records that a player has shot a weapon at another entity.
    onPlayerWeaponShot(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const position = player.position;
        const target = new Vector(event.fX, event.fY, event.fZ);

        let record = {
            position: this.vectorToArray(position),
            target: this.vectorToArray(target),

            hit_type: event.hittype,
            weaponid: event.weaponid
        };

        if (event.hittype === 1 /* BULLET_HIT_TYPE_PLAYER */) {
            const victim = server.playerManager.getById(event.hitid);
            if (victim && this.sessions_.has(victim)) {
                record.distance = victim.position.distanceTo(position);

                record.victim_session = this.sessions_.get(victim);
                record.victim_user_id = victim.userId;
            }
        }

        this.writer_.writeAttributedEvent(player, 'playerweaponshot', record);
    }

    // ---------------------------------------------------------------------------------------------

    // Records that a player has said something in main chat.
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        this.writer_.writeAttributedEvent(player, 'text', {
            text: event.text
        });
    }

    // Records that a player has executed a command.
    onPlayerCommandText(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        const cmdtext = event.cmdtext;
        if (!cmdtext || cmdtext.includes('/modlogin'))
            return;  // blacklisted command- don't log passwords

        this.writer_.writeAttributedEvent(player, 'cmdtext', {
            cmdtext: cmdtext
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Records that a vehicle has been destroyed.
    onVehicleDeath(event) {
        const vehicleId = event.vehicleid;
        const vehicleModel = this.getVehicleModelId(vehicleId);

        if (!vehicleModel)
            return;  // invalid event

        const position = pawnInvoke('GetVehiclePos', 'iFFF', vehicleId);
        this.writer_.writeAttributedEvent(player, 'vehicledeath', {
            vehicle_model: vehicleModel,
            position: position
        });
    }

    // Records that a vehicle has been modified by a particular driver.
    onVehicleMod(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        this.writer_.writeAttributedEvent(player, 'vehiclemod', {
            vehicle_model: this.getVehicleModelId(event.vehicleid),
            component_id: event.componentid
        });
    }

    // Records that a vehicle has received a new paintjob, issued by a particular driver.
    onVehiclePaintjob(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        this.writer_.writeAttributedEvent(player, 'vehiclepaintjob', {
            vehicle_model: this.getVehicleModelId(event.vehicleid),
            paintjob_id: event.paintjobid
        });
    }

    // Records that a vehicle has been resprayed, done by a particular driver.
    onVehicleRespray(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        this.writer_.writeAttributedEvent(player, 'vehiclerespray', {
            vehicle_model: this.getVehicleModelId(event.vehicleid),
            primary_color: event.color1,
            secondary_color: event.color2
        });
    }

    // Records that a vehicle has had its siren state changed, done by a particular driver.
    onVehicleSirenStateChange(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !this.sessions_.has(player))
            return;  // invalid event

        this.writer_.writeAttributedEvent(player, 'vehiclesirenstatechange', {
            vehicle_model: this.getVehicleModelId(event.vehicleid),
            enabled: event.newstate
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Converts the |vector| to an array having values for the X, Y and Z coordinates.
    vectorToArray(vector) {
        return [ vector.x, vector.y, vector.z ];
    }

    // Returns the model Id for the given |vehicleid|. The vehicle does not have to have been
    // created by the VehicleManager in order for this to work.
    getVehicleModelId(vehicleid) {
        if (vehicleid < 0 || vehicleid >= 2000)
            return 0;  // invalid vehicle

        return pawnInvoke('GetVehicleModel', 'i', vehicleid);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        server.playerManager.removeObserver(this);
    }
}

exports = EntityLogger;
