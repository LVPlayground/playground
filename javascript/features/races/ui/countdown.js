// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rectangle } from 'components/text_draw/rectangle.js';
import { TextDraw } from 'components/text_draw/text_draw.js';

// Background color of the countdown. Should be semi-transparent.
const BACKGROUND_COLOR = Color.fromRGBA(0, 0, 0, 100);

// Text color of the counter that's actually counting down, and will shout "Go!"
const COUNTDOWN_COUNTER_COLOR = Color.fromRGBA(255, 255, 0, 255);

// This class implements the visual count down that will be presented to the player right before
// they can start a race. This gives each player the chance to see the environment prior to starting
// and gives San Andreas the chance to load the resources in the surrounding area.
class Countdown {
    // Displays the countdown for |players|. Returns a promise that will be resolved when the
    // countdown sequence has finished, and racing can begin.
    static displayForPlayers(players, seconds = 3) {
        const background = new Rectangle(161, 140, 317.5, 115, BACKGROUND_COLOR);
        const description = new TextDraw({
            position: [320, 150],
            alignment: TextDraw.ALIGN_CENTER,

            text: 'GET READY',
            font: TextDraw.FONT_MONOSPACE,
            letterSize: [0.4, 1.6],
            shadowSize: 0
        });

        const counter = new TextDraw({
            position: [320, 175],
            alignment: TextDraw.ALIGN_CENTER,

            text: seconds,
            font: TextDraw.FONT_MONOSPACE,
            color: COUNTDOWN_COUNTER_COLOR,
            letterSize: [0.722, 2.94],
            shadowSize: 0
        });

        // Display all countdown textdraws to all participants of the race.
        players.forEach(player => {
            background.displayForPlayer(player);
            description.displayForPlayer(player);
            counter.displayForPlayer(player);
        });

        return new Promise(resolve => {
            const display = seconds => {
                players.forEach(player =>
                    counter.updateTextForPlayer(player, !seconds ? 'GO!' : seconds));

                // If there is still time left on the counter, re-schedule an invocation of this
                // function in about a second to process the next phase of the countdown.
                if (seconds > 0) {
                    wait(1000).then(display.bind(null, seconds - 1));
                    return;
                }

                // The timer has run out. Add an artificial wait of 300 seconds so that the "GO!"
                // text is displayed on the player's screens, after which the race can begin.
                wait(300).then(() => {
                    players.forEach(player => {
                        background.hideForPlayer(player);
                        description.hideForPlayer(player);
                        counter.hideForPlayer(player);
                    });

                    resolve();
                });
            };

            // Start the counter by requesting display for |seconds| seconds.
            display(seconds);
        });
    }
}

export default Countdown;
