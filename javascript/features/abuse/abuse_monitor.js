// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The abuse monitor keeps an eye out for players who may abuse something on Las Venturas Playground
// and informs administrators of the event when something has been detected.
//
// The abuse monitor is able to detect the following kinds of abuse:
//     1) Illegal non-player character: connecting a non-player character from a remote host.
//     2) Illegal vehicle entry: entering a vehicle that is locked for the player.
//
class AbuseMonitor {
    constructor(announce, settings) {
        this.announce_ = announce;
        this.settings_ = settings;

        this.detected_ = new Map([
            [ AbuseMonitor.TYPE_ILLEGAL_NON_PLAYER_CHARACTER, new WeakMap() ],
            [ AbuseMonitor.TYPE_ILLEGAL_VEHICLE_ENTRY, new WeakMap() ]
        ]);

        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the maximum number of times to report a particular warning about a particular player.
    getReportLimit() { return this.settings_().getValue('abuse/warning_report_limit'); }

    // ---------------------------------------------------------------------------------------------

    // Reports that the |player| has been detected for abusing |type|. Administrators will receive
    // a configurable amount of warnings for the |player, type| tuple as well.
    reportAbuse(player, type, { kick = false } = {}) {
        const incidents = (this.detected_.get(type).get(player) || 0) + 1;
        if (kick || incidents <= this.getReportLimit()) {
            const incidentDescription = this.getTypeDescription(type);
            const incidentOrdinal = incidents.toOrdinalString();

            // TODO: Make sure that the reason of the player's kick is recorded in the database.

            // Process the incidents by order of severity. The reasons for kicks and bans will
            // automagically be recorded in the database, so that administrators have references.
            if (kick) {
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ANNOUNCE_KICKED, player.name, player.id, incidentDescription);

                player.kick();

            } else {
                this.announce_().announceToAdministrators(
                    Message.ABUSE_ANNOUNCE_DETECTED, player.name, player.id, incidentDescription,
                    incidentOrdinal);
            }
        }

        // Do keep track of the new number of incidents for the |player|.
        this.detected_.get(type).set(player, incidents);
    }

    // Returns the number of times the |player| has been caught for the various kinds of abuse.
    getPlayerStatistics(player) {
        // Utility function that returns the number of times |player| has been caught for |type|.
        const createEntryForType = type =>
            [ this.getTypeDescription(type), this.detected_.get(type).get(player) || 0 ];

        return new Map([
            createEntryForType(AbuseMonitor.TYPE_ILLEGAL_VEHICLE_ENTRY)
        ]);
    }

    // Gets the textual description for the abuse |type|.
    getTypeDescription(type) {
        switch (type) {
            case AbuseMonitor.TYPE_ILLEGAL_NON_PLAYER_CHARACTER:
                return 'illegal non-player character';
            case AbuseMonitor.TYPE_ILLEGAL_VEHICLE_ENTRY:
                return 'illegal vehicle entry';
            default:
                throw new Error('Unknown abuse type given: ' + type);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has connected to the server. Will verify that non-player characters
    // only connect from local addresses.
    onPlayerConnect(player) {
        if (player.isNonPlayerCharacter() && player.ip !== '127.0.0.1') {
            this.reportAbuse(player, AbuseMonitor.TYPE_ILLEGAL_NON_PLAYER_CHARACTER, {
                kick: true
            });
        }
    }

    // Called when the |player| has fired their weapon at |target|. The |targetOffset| describes the
    // offset of the shot relative to |target|. The |weaponId| describes the weapon that fired.
    onPlayerShootPlayer(player, target, targetOffset, weaponId) {
        // TODO: Disable for players with a high packet-loss percentage.
        // TODO: Disable for players with a high ping.
        // TODO: Disable for players who are in or surfing on a vehicle.
        // TODO: Disable for particular weapons (e.g. miniguns).

        // TODO: Recognize continuous shots.
        // TODO: Recognize teleportation shots.
        // TODO: Recognize out-of-range shots.
    }

    // Called when the |player| enters the |vehicle|. Will report them for abuse when the vehicle
    // was locked for them, and entry therefore shouldn't have been possible.
    onPlayerEnterVehicle(player, vehicle) {
        if (vehicle.isLockedForPlayer(player))
            this.reportAbuse(player, AbuseMonitor.TYPE_ILLEGAL_VEHICLE_ENTRY);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);
    }
}

// The different sorts of abuse that can be detected by the monitor.
AbuseMonitor.TYPE_ILLEGAL_NON_PLAYER_CHARACTER = 0;
AbuseMonitor.TYPE_ILLEGAL_VEHICLE_ENTRY = 1;

export default AbuseMonitor;
