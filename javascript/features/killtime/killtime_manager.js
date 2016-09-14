// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Managing killtime, that magic happens here. We need to keep track of who is on top, how many minutes do we still
// have and when we have to stop. At the end we of course want to give out the correct prize to the correct person.
class KilltimeManager {
    constructor(announce) {
        this.announce_ = announce;
        this.isRunning_ = false;
        this.scoreMap_ = new Map();

        // Translates OnPawnEventName to respectively `onPawnEventName` or `pawneventname`.
        const toMethodName = name => name.charAt(0).toLowerCase() + name.slice(1);
        const toEventName = name => name.slice(2).toLowerCase();

        [
            'OnPlayerDeath',  // { playerid, killerid, reason }

        ].forEach(name =>
            this.callbacks_.addEventListener(toEventName(name), this.__proto__[toMethodName(name)].bind(this)));
    }

    start(player, minutes) {
        this.isRunning_ = true;

        this.run(minutes);
    }

    async run(totalMinutes) {
        let minutesPassedBy = 0;
        while (this.isRunning_) {
            if (minutesPassedBy == totalMinutes)
                this.isRunning_ = false;

            await minutes(1);
            minutesPassedBy++;

            this.announce_.announceToPlayers(player.sendMessage(Message.KILLTIME_TOPKILLER, 137, 'Xanland', 1));
        }
    }

    stop(player) {

    }

    onPlayerDeath(event) {
        const killer = server.playerManager.getById(event.killerid);
        if (!killer)
            return;

        // Add to map and do and add other stuff
    }

    // Cleans up the state created by this class, i.e. unregisters the commands.
    dispose() {

    }
}

exports = KilltimeManager;
