// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { TextDraw } from 'entities/text_draw.js';

import { format } from 'base/format.js';

// The regular background color that the countdown should be displayed in.
const kRegularBackgroundColor = Color.fromRGBA(0, 0, 0, 0xAA);

// Background colour the countdown should have when time's coming closer to the end.
const kHighlightedBackgroundColor = Color.fromRGBA(0x30, 0, 0, 0xAA);

// Background colour the countdown should have when time's almost up.
const kStressedBackgroundColor = Color.fromRGBA(0x80, 0, 0, 0xAA);

// Time limited games will display a countdown under the player's money indicator to let all the
// participants know how much time is left. This countdown is implemented using a text draw, which
// has been abstracted away under this interface.
export class Countdown {
    // Advances past the countdown for testing purposes.
    static async advanceCountdownForTesting(seconds) {
        while (seconds--)
            await server.clock.advance(1000);
    }

    #disposed_ = false;
    #element_ = null;

    #finishedPromise_ = null;
    #finishedResolver_ = null;
    #players_ = null;
    #seconds_ = null;
    #sounds_ = null;

    constructor({ seconds, sounds = true } = {}) {
        this.#element_ = createCountdownElement();

        this.#players_ = new Set();
        this.#seconds_ = seconds;
        this.#sounds_ = sounds;

        // Create the `finished` promise, so that uses can know when the countdown has finished.
        this.#finishedPromise_ = new Promise(resolve =>
            this.#finishedResolver_ = resolve);

        // Spin internally until the countdown has fully completed.
        this.countdownSpinner();
    }

    // Gets the promise that can be used to listen to the countdown having finished.
    get finished() { return this.#finishedPromise_; }

    // ---------------------------------------------------------------------------------------------

    // Displays the countdown for the given |player|. They will receive all updates as well.
    displayForPlayer(player) {
        this.#element_.displayForPlayer(player);
        this.#players_.add(player);
    }

    // Hides the countdown from the given |player|. They will stop receiving updates.
    hideForPlayer(player) {
        if (this.#disposed_)
            return;

        this.#element_.hideForPlayer(player);
        this.#players_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Spins until the countdown has either completed, and then self-destructs, or until the element
    // has been disposed of manually by its owner, and there's nothing to update anymore.
    async countdownSpinner() {
        while (!this.#disposed_) {
            if (this.#seconds_ < 0) {
                this.#finishedResolver_();
                this.#finishedResolver_ = null;

                this.dispose();
                return;
            }

            this.#element_.text = formatRemainingTime(this.#seconds_);

            // Update the background colour of the element if necessary. Changes mean that we have
            // to re-show the element to all players in order to update it on their screen.
            const backgroundColor = determineBackgroundColor(this.#seconds_);
            if (backgroundColor !== this.#element_.backgroundColor) {
                this.#element_.backgroundColor = backgroundColor;

                for (const player of this.#players_) {
                    this.#element_.hideForPlayer(player);
                    this.#element_.displayForPlayer(player);
                }
            }

            // If a sound should be played for the remaining number of seconds, do this for all the
            // players to whom the countdown is visible as well.
            if (this.#sounds_ && shouldTick(this.#seconds_)) {
                const soundId = this.#seconds_ > 0 ? 1056 /* SOUND_RACE_321 */
                                                   : 1057 /* SOUND_RACE_GO */;

                for (const player of this.#players_)
                    player.playSound(soundId);
            }

            // Decrease the number of remaining seconds, wait for a second, then spin again.
            this.#seconds_--;

            await wait(1000);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (this.#disposed_)
            return;  // we self-destruct, so protect against double-free

        this.#disposed_ = true;

        this.#element_.dispose();
        this.#element_ = null;

        this.#players_.clear();
        this.#players_ = null;
    }
}

// Creates the actual text draw that will be used for displaying the countdown. It's a semi-
// transparent box displayed under the player's money indicator, but above their death feed.
function createCountdownElement() {
    return server.textDrawManager.createTextDraw({
        position: [ 552.5, 104 ],
        text: '_',

        alignment: TextDraw.kAlignCenter,
        backgroundColor: Color.fromNumberRGBA(255),
        boxColor: kRegularBackgroundColor,
        box: true,
        color: Color.fromNumberRGBA(-1),
        shadow: 0,

        letterSize: [ 0.38, 1.5 ],
        textSize: [ 0, 108 ],
    });
}

// Determines the background color to use for a countdown that has |seconds| left. This will be used
// to convey additional urgency to the players, as less time means they have to hurry.
function determineBackgroundColor(seconds) {
    if (seconds <= 10)
        return kStressedBackgroundColor;
    else if (seconds <= 30)
        return kHighlightedBackgroundColor;
    else
        return kRegularBackgroundColor;
}

// Formats the number of |seconds| as the time remaining for the countdown. Can distinguish between
// minutes, seconds and finished displays.
function formatRemainingTime(seconds) {
    if (seconds >= 60)
        return format('%d:%02d', Math.floor(seconds / 60), seconds % 60);
    else if (seconds > 0)
        return format('%d', seconds);
    else
        return 'FINISHED';
}

// Returns whether an audible tick should be heard for the given number of remaining |seconds|. This
// is the case for each full minute, 30 & 10 seconds, and then every second down from five.
function shouldTick(seconds) {
    if (seconds >= 60 && !(seconds % 60))
        return true;  // minute ticks
    else if (seconds === 30 || seconds === 10)
        return true;  // 30 second tick
    else if (seconds <= 5)
        return true;  // urgency ticks
    else
        return false;
}
