// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Managing killtime, that magic happens here. We need to keep track of who is on top, how many minutes do we still
// have and when we have to stop. At the end we of course want to give out the correct prize to the correct person.
class KilltimeManager {
    constructor(announce) {
        this.announce_ = announce;
        this.isRunning_ = false;
        this.scoreMap_ = new Map();
        this.callbacks_ = new ScopedCallbacks();

        // Translates OnPawnEventName to respectively `onPawnEventName` or `pawneventname`.
        const toMethodName = name => name.charAt(0).toLowerCase() + name.slice(1);
        const toEventName = name => name.slice(2).toLowerCase();

        [
            'OnPlayerDeath',  // { playerid, killerid, reason }
        ].forEach(name =>
            this.callbacks_.addEventListener(toEventName(name), this.__proto__[toMethodName(name)].bind(this)));
    }

    start(minutes) {
        this.isRunning_ = true;
        this.scoreMap_ = new Map();

        this.announce_().announceToPlayers(Message.KILLTIME_STARTED, minutes);
        this.run(minutes);
    }

    async run(totalMinutes) {
        let minutesPassedBy = 0;
        while (this.isRunning_) {
            await minutes(1);
            minutesPassedBy++;

            if (minutesPassedBy == totalMinutes) {
                this.stop(null);
            }

            const playerName = this.getPlayerWithHighestKillsAmount();
            const mostKillsAmount = this.scoreMap_.get(playerName);
            this.announce_().announceToPlayers(Message.KILLTIME_TOPKILLER, mostKillsAmount, playerName, 1);
        }
    }

    stop(player) {
        this.isRunning_ = false;

        if (player == null)
            this.announce_().announceToPlayers(Message.KILLTIME_AUTO_STOPPED);
        else
            this.announce_().announceToPlayers(Message.KILLTIME_ADMIN_STOPPED);

        const playerName = this.getPlayerWithHighestKillsAmount();
        const mostKillsAmount = this.scoreMap_.get(playerName);
        this.announce_().announceToPlayers(Message.KILLTIME_WINNER, playerName, mostKillsAmount, 1);
    }

    onPlayerDeath(event) {
        if (!this.isRunning_)
            return;

        const killer = server.playerManager.getById(event.killerid);
        if (!killer || killer.virtualWorld != 0)
            return;

        let previousKillsAmount = 0;
        if (this.scoreMap_.has(killer.name))
            previousKillsAmount = this.scoreMap_.get(killer.name);

        this.scoreMap_.set(killer.name, previousKillsAmount + 1);
    }

    getPlayerWithHighestKillsAmount() {
        let playerName = null;
        let highestKillsAmount = 0;

        this.scoreMap_.forEach(function (name, kills) {
            if (kills > highestKillsAmount) {
                highestKillsAmount = kills;
                playerName = name;
            }
        });

        return playerName;
    }

    // Cleans up the state created by this class
    dispose() {

    }
}

exports = KilltimeManager;
