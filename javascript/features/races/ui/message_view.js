// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Rectangle = require('components/text_draw/rectangle.js');
const TextDraw = require('components/text_draw/text_draw.js');

// Background color of the message. Should be semi-transparent.
const BACKGROUND_COLOR = Color.fromRGBA(0, 0, 0, 100);

// Displays a message to all remaining participants. The participant will be frozen while the
// message is being displayed on their screen.
class MessageView {
    // Displays the |message| for |milliseconds| to |players|. The user interface follows the other
    // messages that will be used for information about races.
    static displayForPlayers(players, message, milliseconds) {
        const background = new Rectangle(161, 140, 317.5, 36.8, BACKGROUND_COLOR);
        const description = new TextDraw({
            position: [320, 146.5],
            alignment: TextDraw.ALIGN_CENTER,

            text: message,
            font: TextDraw.FONT_MONOSPACE,
            letterSize: [0.4, 1.6],
            shadowSize: 0
        });

        // Display all textdraws to all participants of the race.
        players.forEach(player => {
            player.controllable = false;

            background.displayForPlayer(player);
            description.displayForPlayer(player);
        });

        return wait(milliseconds).then(() => {
            players.forEach(player => {
                background.hideForPlayer(player);
                description.hideForPlayer(player);
            });
        });
    }
}

exports = MessageView;
