// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { TextDraw } from 'entities/text_draw.js';

import { format } from 'base/format.js';

// Value assigned to an empty text message. Underscores won't show up in text draws.
const kEmptyNewsMessage = '_';

// Keyboard mappings which are valid and can be contained in news messages.
const kKeyboardMappings = new Set([
    'CONVERSATION_NO', 'CONVERSATION_YES', 'GO_BACK', 'GO_FORWARD', 'GO_LEFT', 'GO_RIGHT',
    'GROUP_CONTROL_BWD', 'GROUP_CONTROL_FWD', 'PED_ANSWER_PHONE', 'PED_DUCK', 'PED_FIREWEAPON',
    'PED_JUMPING', 'PED_LOCK_TARGET', 'PED_LOOKBEHIND', 'PED_SPRINT', 'SNEAK_ABOUT',
    'TOGGLE_SUBMISSIONS', 'VEHICLE_ACCELERATE', 'VEHICLE_BRAKE', 'VEHICLE_ENTER_EXIT',
    'VEHICLE_FIREWEAPON', 'VEHICLE_FIREWEAPON_ALT', 'VEHICLE_HANDBRAKE', 'VEHICLE_HORN',
    'VEHICLE_LOOKBEHIND', 'VEHICLE_LOOKLEFT', 'VEHICLE_LOOKRIGHT', 'VEHICLE_STEERDOWN',
    'VEHICLE_STEERLEFT', 'VEHICLE_STEERRIGHT', 'VEHICLE_STEERUP', 'VEHICLE_TURRETDOWN',
    'VEHICLE_TURRETLEFT', 'VEHICLE_TURRETRIGHT', 'VEHICLE_TURRETUP',
]);

// Maximum number of news messages that will be displayed on player screens.
const kNewsMessageCount = 4;

// Horizontal positioning for individual news messages. Shared by all of them.
const kNewsMessageHorizontalOffsetPx = 150;

// Vertical positioning and spacing for the individual news messages.
const kNewsMessageVerticalOffsetPx = 414;
const kNewsMessageVerticalSpacingPx = 8;

// The news manager is responsible for showing individual news messages, and making sure that they
// expire in time. News messages are shown through text draws, so need a degree of sanitation before
// they're sent off to players, to ensure consistency.
export class NewsManager {
    #settings_ = null;
    #textDraws_ = null;

    constructor(settings) {
        this.#settings_ = settings;
        this.#textDraws_ = [];

        // Build the text draw entities that will be used by the news manager. They are ordered
        // bottom-up, so index 0 is the lowest, where index |kNewsMessageCount - 1| is the highest.
        for (let index = 0; index < kNewsMessageCount; ++index) {
            this.#textDraws_.push(server.textDrawManager.createTextDraw({
                position: [
                    kNewsMessageHorizontalOffsetPx,
                    kNewsMessageVerticalOffsetPx - index * kNewsMessageVerticalSpacingPx,
                ],

                text: kEmptyNewsMessage,

                backgroundColor: Color.fromRGBA(0x00, 0x00, 0x00, 0xFF),
                color: Color.fromRGBA(0xFF, 0xFF, 0xFF, 0xFF),
                font: TextDraw.kFontSansSerif,
                letterSize: [ 0.17, 0.79 ],
                outline: 1,
            }));
        }

        // Observe the player manager to be told when someone has joined the server.
        server.playerManager.addObserver(this, /* replayHistory= */ true);
    }

    // Provides access to the local text draw array. Must only be used for testing purposes.
    get textDrawsForTesting() { return this.#textDraws_; }

    // ---------------------------------------------------------------------------------------------
    // Displaying and sanitizing messages
    // ---------------------------------------------------------------------------------------------

    // Announces the given |message| to all players who see news messages. The |message| will be
    // formatted according to the |params| when given. https://wiki.sa-mp.com/wiki/GameTextStyle
    broadcastNews(message, ...params) {
        const formattedMessage = format(message, ...params);
        const sanitizedMessage = this.sanitizeMessage(formattedMessage);

        let broadcasted = false;

        // First attempt to find an available text draw for the news message. If one is found, set
        // the message's text and it'll be shown to all players.
        for (const textDraw of this.#textDraws_) {
            if (textDraw.text !== kEmptyNewsMessage)
                continue;  // this |textDraw| is already in use

            // Set a flag to mark that the message has been broadcasted.
            broadcasted = true;

            textDraw.text = sanitizedMessage;
            break;
        }

        // If the message could not be broadcasted, we replace the first text draw which is known
        // to be the oldest one. All other text draws have to move one along.
        //
        // |--------------------|        |--------------------|
        // | MESSAGE_3          |        | sanitizedMessage   |
        // | MESSAGE_2          |  --->  | MESSAGE_3          |
        // | MESSAGE_1          |        | MESSAGE_2          |
        // | MESSAGE_0          |        | MESSAGE_1          |
        // |--------------------|        |--------------------|
        if (!broadcasted) {
            for (let index = 0; index < kNewsMessageCount - 1; ++index)
                this.#textDraws_[index].text = this.#textDraws_[index + 1].text;

            this.#textDraws_[kNewsMessageCount - 1].text = sanitizedMessage;
        }

        // The message now has certainly been broadcasted. Start a timer for the intended display
        // duration after which the message will be removed again.
        wait(this.#settings_().getValue('playground/news_message_onscreen_sec') * 1000).then(() => {
            this.removeNewsMessage(sanitizedMessage);
        });
    }

    // Removes the news message with the given |message|. All other messages that are still shown
    // will be moved down a row, to keep all news messages at the bottom of the screen.
    removeNewsMessage(message) {
        if (!this.#textDraws_)
            return;  // |this| instance got disposed of since

        for (let index = 0; index < kNewsMessageCount; ++index) {
            if (this.#textDraws_[index].text !== message)
                continue;  // this text draw describes another message

            for (let moveIndex = index; moveIndex < kNewsMessageCount - 1; ++moveIndex)
                this.#textDraws_[moveIndex].text = this.#textDraws_[moveIndex + 1].text;

            this.#textDraws_[kNewsMessageCount - 1].text = kEmptyNewsMessage;
            break;
        }
    }

    // Sanitizes the given |message|. Ensures that the following conditions hold true:
    //   * The |message| will not end in a space, as this makes the message disappear.
    //   * All used styling and colour codes (~r~ etc.) are balanced and valid.
    //   * Keyboard mapping codes beyond the 255th character are removed.
    //   * The length of the resulting message will not be longer than 800 characters.
    sanitizeMessage(message) {
        let sanitizedMessage = '';

        for (let index = 0; index < message.length; ++index) {
            const character = message.charAt(index);

            // If the |character| isn't a tilde, pass it through without modification.
            if (character !== '~') {
                sanitizedMessage += character;
                continue;
            }

            const remaining = message.length - index - 1;
            if (remaining < 2)
                continue;  // this can't possibly be a valid colour code. drop it

            let invalid = false;
            let keyboardMapping = false;

            // Identify whether the colour code is valid, to filter out things that might crash
            // players. We list all possible valid values: https://wiki.sa-mp.com/wiki/GameTextStyle
            switch (message.charAt(index + 1)) {
                case 'n':  // new line

                case 'b':  // blue
                case 'g':  // green
                case 'l':  // black
                case 'p':  // purple
                case 'r':  // red
                case 'w':  // white
                case 'y':  // yellow

                case 's':  // (de)saturate
                case 'h':  // lighten

                case 'u':  // up arrow
                case 'd':  // down arrow
                case '<':  // left arrow
                case '>':  // right arrow
                    break;

                case 'k':  // keyboard mapping
                    keyboardMapping = true;
                    break;

                default:
                    invalid = true;
                    break;
            }

            // (a) If he |invalid| flag has been set, bail out as the used colour code does not
            // exist, and would thus cause an invalid message.
            if (invalid)
                continue;

            // (b) If the colour code isn't terminated with a tilde, bail out and drop this one too,
            // as that also means that we're delaing with a misformatted message.
            if (message.charAt(index + 2) !== '~')
                continue;

            // (c) If |keyboardMapping| is not set, we have a valid colour code so can append that
            // to the |sanitizedMessage| as we please. It went well :>
            if (!keyboardMapping) {
                sanitizedMessage += `~${message.charAt(index + 1)}~`;
                index += 2;
                continue;
            }

            // The keyboard mapping is expected to followed by an indicator like ~PED_DUCK~, which
            // identifies the particular key to embed. The longest is 22 characters in length, the
            // shortest 7, so we expect [9, 24] additional characters in the message.
            if (remaining < 2 /* k~ */ + 9 || message.charAt(index + 3) !== '~')
                continue;

            const indicatorOffset = message.indexOf('~', index + 4);
            if (indicatorOffset === -1)
                continue;  // the ending tilde was not found

            const indicatorLength = indicatorOffset - (index + 4);
            if (indicatorLength < 7 || indicatorLength > 22)
                continue;  // the length of the indicator is out of bounds

            const indicator = message.substring(index + 4, indicatorOffset);
            if (!kKeyboardMappings.has(indicator))
                continue;  // the |indicator| does not exist on our allow list

            index += 2 /* k~ */ + 2 /* ~s */ + indicator.length;

            if (sanitizedMessage.length >= 255)
                continue;  // keyboard mappings above the 255th character won't show up

            sanitizedMessage += `~k~~${indicator}~`;
        }

        if (sanitizedMessage.length > 800)
            return sanitizedMessage.substring(0, 800);

        return sanitizedMessage.trimEnd();
    }

    // ---------------------------------------------------------------------------------------------
    // Visibility controls
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has connected to the server. Enables the news message text draws for
    // them, so that they'll be receiving the messages.
    onPlayerConnect(player) {
        for (const textDraw of this.#textDraws_)
            textDraw.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.playerManager.removeObserver(this);

        for (const textDraw of this.#textDraws_)
            textDraw.dispose();

        this.#settings_ = null;
        this.#textDraws_ = null;
    }
}
