// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Managing cruise, that magic happens here. We need to keep in mind who is leading the cruise, how you can join
// and have fun in it and make it clear that we stop.
export class CruiseManager {
    #isRunning = false;

    // Sets up all the properties needed for the feature
    constructor() {
    }

    // Sets the cruise running and announces the cruise-start.
    start(player) {
        if (this.#isRunning) {
            player.sendMessage(Message.COMMAND_ERROR, Message.CRUISE_RUNNING);
            return;
        }

        this.#isRunning = true;

        this.announce_().announceToPlayers(Message.CRUISE_STARTED);

        await wait(5000);
        this.run();
    }

    // Keep the cruise running and stops it when it's over.
    async run() {
        while (this.#isRunning) {
            this.announceCruiseRunning_();

            await wait(60 * 1000);
        }
    }

    // Called every minute to announce that there is a cruise running
    announceCruiseRunning_() {
        this.announce_().announceToPlayers(Message.CRUISE_RUNNING);
    }

    // Ends the cruise and announces this to the player.
    stop(player) {
        if (!this.#isRunning) {
            player.sendMessage(Message.CRUISE_NOT_RUNNING);
            return;
        }

        this.#isRunning = false;
        this.announce_().announceToPlayers(Message.CRUISE_STOPPED);

    }

    // Cleans up the state created by this class
    dispose() {
        this.stop(null);
    }
}
