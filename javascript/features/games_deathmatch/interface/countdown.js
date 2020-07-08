// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { TextDraw } from 'components/text_draw/text_draw.js';

import { format } from 'base/format.js';

// The regular background color that the countdown should be displayed in.
const kRegularBackgroundColor = Color.fromRGBA(0, 0, 0, 0xBB);

// Background colour the countdown should have when time's coming closer to the end.
const kHighlightedBackgroundColor = Color.fromRGBA(0x30, 0, 0, 0xBB);

// Background colour the countdown should have when time's almost up.
const kStressedBackgroundColor = Color.fromRGBA(0x80, 0, 0, 0xBB);

// Time limited games will display a countdown under the player's money indicator to let all the
// participants know how much time is left. This countdown is implemented using a text draw, which
// has been abstracted away under this interface.
export class Countdown {
    #element_ = null;
    #players_ = new Set();

    constructor() {
        this.#element_ = new TextDraw({
            position: [ 552.5, 104 ],

            alignment: TextDraw.ALIGN_CENTER,
            text: 'WAITING',
            textSize: [ 0, 108 ],
            letterSize: [ 0.38, 1.5 ],

            boxColor: kRegularBackgroundColor,
            color: Color.fromNumberRGBA(-1),
            shadowColor: Color.fromNumberRGBA(255),
            shadowSize: 0,

            useBox: true,
        });
    }

    // Creates a countdown for the given |player|. Until it's destroyed, it will continue the be
    // updated whenever a change is pushed.
    createForPlayer(player) {
        if (this.#players_.has(player))
            return;

        this.#element_.displayForPlayer(player);
        this.#players_.add(player);
    }

    // Updates all shown countdown to display the |remainingSeconds|. The text will be formatted
    // accordingly. Slight customisations and colour changes may take place too.
    update(remainingSeconds) {
        let formatted = null;

        if (remainingSeconds >= 60)
            formatted = format('%d:%02d', Math.floor(remainingSeconds / 60), remainingSeconds % 60);
        else if (remainingSeconds > 0)
            formatted = format('%d', remainingSeconds);
        else
            formatted = 'FINISHED';

        // (1) Update the text of the text draw for future players.
        this.#element_.text = formatted;

        // (2) Determine if the background colour of the text draw has to change.
        let colourUpdate = null;

        if (remainingSeconds <= 10 && this.#element_.boxColor !== kStressedBackgroundColor)
            colourUpdate = kStressedBackgroundColor;
        else if (remainingSeconds > 10 && remainingSeconds <= 30) {
            if (this.#element_.boxColor !== kHighlightedBackgroundColor)
                colourUpdate = kHighlightedBackgroundColor;
        }

        if (colourUpdate)
            this.#element_.boxColor = colourUpdate;

        // If a colour change happened, we have to completely re-show the text draw for all the
        // participants. Otherwise we just update the text to its new value.
        for (const player of this.#players_) {
            if (colourUpdate) {
                this.#element_.hideForPlayer(player);
                this.#element_.displayForPlayer(player);
            } else {
                this.#element_.updateTextForPlayer(player, formatted);
            }
        }
    }

    // Destroys the countdown for the given |player|. It will immediately disappear from their
    // screen, and they will no longer receive updates.
    destroyForPlayer(player) {
        if (!this.#players_.has(player))
            return;
        
        this.#element_.hideForPlayer(player);
        this.#players_.delete(player);
    }

    dispose() {
        for (const player of this.#players_)
            this.#element_.hideForPlayer(player);

        this.#element_ = null;

        this.#players_.clear();
        this.#players_ = null;
    }
}
