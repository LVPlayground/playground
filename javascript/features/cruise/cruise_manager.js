// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Managing cruise, that magic happens here. We need to keep in mind who is leading the cruise, how you can join
// and have fun in it and make it clear that we stop.
class CruiseManager {
    // Sets up all the properties needed for the feature
    constructor() {
        this.isRunning_ = false;
    }

    // Sets the cruise running and announces the cruise-start.
    start() {
        this.isRunning_ = true;

        this.announce_().announceToPlayers(Message.CRUISE_STARTED);
        this.run();
    }

    // Keep the cruise running and stops it when it's over.
    async run() {
        while (this.isRunning_) {
            await minutes(1);
            this.announceCruiseRunning_();
        }
    }

    // Called every minute to announce that there is a cruise running
    announceCruiseRunning_() {
        this.announce_().announceToPlayers(Message.CRUISE_RUNNING);
    }

    // Ends the cruise and announces this to the player.
    stop() {
        if (!this.isRunning_)
            return;

        this.isRunning_ = false;
        this.announce_().announceToPlayers(Message.CRUISE_STOPPED);

    }

    // Cleans up the state created by this class
    dispose() {
        this.stop(null);
    }
}

export default CruiseManager;
