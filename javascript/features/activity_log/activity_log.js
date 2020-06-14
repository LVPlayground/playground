// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ActivityRecorder } from 'features/activity_log/activity_recorder.js';
import Feature from 'components/feature_manager/feature.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

import { murmur3hash } from 'base/murmur3hash.js';

// The activity log feature keeps track of many in-game events and logs them to the database. This
// is part of an effort to gather more information with Las Venturas Playground, enabling analysis
// of area, vehicle and weapon usage among many other statistics.
export default class ActivityLog extends Feature {
    nuwani_ = null;

    callbacks_ = null;
    recorder_ = null;
    sessionIds_ = new WeakMap();

    constructor() {
        super();

        // To be able to show the IP and GPCI on IRC
        this.nuwani_ = this.defineDependency('nuwani');

        // Writes all the interactions to the database.
        this.recorder_ = new ActivityRecorder();

        // Listens to various callbacks that are not issued by one of the entity managers, and we
        // thus have to implement ourselves.
        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerresolveddeath', ActivityLog.prototype.onPlayerDeath.bind(this));

        // Provides the `MurmurIIIHashGenerateHash` native, which is exposed to Pawn to allow it to
        // do serial ban checks during a player's connection routine.
        provideNative('MurmurIIIHashGenerateHash', 'siS', (key, maxLength) => {
            return [ murmur3hash(key).toString() ];
        });

        // Observes the PlayerManager, to be informed of changes in player events.
        server.playerManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has connected to Las Venturas Playground.
    onPlayerConnect(player) {
        this.recorder_.createPlayerSession(player).then(sessionId => {
            if (!player.isConnected())
                return;  // the |player| has disconnected since
            
            this.sessionIds_.set(player, sessionId);
        });

        // Anounce the player's IP address and serial number to people watching Nuwani.
        this.nuwani_().echo('join-ip-gpci', player.name, player.id, player.ip, player.serial);
    }

    // Called when the |player| has logged in to their account.
    onPlayerLogin(player) {
        const sessionId = this.sessionIds_.get(player);
        if (sessionId)
            this.recorder_.updateSessionOnIdentification(sessionId, player);
    }

    // Called when the |player| has had their name changed to something else.
    onPlayerNameChange(player) {
        const sessionId = this.sessionIds_.get(player);
        if (sessionId)
            this.recorder_.updateSessionOnNameChange(sessionId, player);
    }

    // Called when a death has occurred. This is an event sourced from Pawn, and thus untrusted.
    onPlayerDeath(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // the |event| was sent for an invalid player
        
        const killer = server.playerManager.getById(event.killerid);
        const reason = event.reason;

        if (!killer)
            this.recorder_.recordPlayerDeath(player, reason);
        else
            this.recorder_.recordPlayerKill(player, killer, reason);
    }

    // Called when the |player| has disconnected from Las Venturas Playground.
    onPlayerDisconnect(player) {
        const sessionId = this.sessionIds_.get(player);
        if (!sessionId)
            return;  // no session is known for the given |player|
        
        this.recorder_.finalizePlayerSession(player, sessionId);
        this.sessionIds_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        provideNative('MurmurIIIHashGenerateHash', 'siS', () => [ '0' ]);

        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.recorder_ = null;
    }
}
