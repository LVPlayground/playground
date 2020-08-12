// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rectangle } from 'components/text_draw/rectangle.js';
import { TextDraw } from 'entities/text_draw.js';

// Background color of the countdown. Should be semi-transparent.
const kBackgroundColor = Color.fromRGBA(0, 0, 0, 100);

// Text color of the counter that's actually counting down, and will shout "Go!"
const kForegroundColor = Color.fromRGBA(255, 255, 0, 255);

// This class implements the visual count down that will be presented to the player right before
// they can start a race. This gives each player the chance to see the environment prior to starting
// and gives San Andreas the chance to load the resources in the surrounding area.
export class StartCountdown {
    // Advances past the countdown for testing purposes.
    static async advanceCountdownForTesting(seconds) {
        while (seconds--)
            await server.clock.advance(1000);

        // Wait for the final delay during which "Go!" is displayed on player's screens.
        await server.clock.advance(300);
    }

    // Displays the countdown for the |player|. Returns a promise that will be resolved when the
    // countdown sequence has finished, and racing can begin.
    static async displayForPlayer(player, seconds = 3, validFn = null) {
        const elements = {
            background: createBackgroundElement(),
            description: createDescriptionElement(player),
            foreground: createForegroundElement(player, seconds.toString()),
        };

        // (1) Display all the |elements| to the |player|.
        for (const element of Object.values(elements))
            element.displayForPlayer(player);

        // (2) While there's time remaining, update the foreground text each second.
        while (seconds > 0) {
            await wait(1000);

            // Bail out of the countdown for the |player| no longer is relevant.
            if (validFn && !validFn(player))
                break;

            if (--seconds > 0) {
                elements.foreground.text = seconds.toString();
            } else {
                elements.foreground.text = 'GO!';
                break;
            }
        }

        // (3) Wait for an additional 300ms for the timer to be spent, then remove the elements if
        // the |player| is still connected to the server.
        if (!validFn || validFn(player))
            await wait(300);

        if (player.isConnected()) {
            for (const element of Object.values(elements))
                element.hideForPlayer(player);
        }

        // TODO: When Rectangle has switched over to the new TextDraw system, wholesale dispose it.
        elements.description.dispose();
        elements.foreground.dispose();
    }
}

// Creates the background on which both the description and the countdown's text will be drawn.
function createBackgroundElement() {
    return new Rectangle(161, 140, 317.5, 115, kBackgroundColor);
}

// Creates the description, clarifying to the player what's intended to happen.
function createDescriptionElement(player) {
    return server.textDrawManager.createTextDraw({
        player,
        position: [ 320, 150 ],
        text: 'GET READY',

        alignment: TextDraw.kAlignCenter,
        font: TextDraw.kFontMonospace,
        letterSize: [ 0.4, 1.6 ],
        shadow: 0,
    });
}

// Creates the foreground element, the text that will actually be counting down and eventually
// transition to the "Go!" text, informing them that they're off.
function createForegroundElement(player, initialText) {
    return server.textDrawManager.createTextDraw({
        player,
        position: [ 320, 175 ],
        text: initialText,

        alignment: TextDraw.kAlignCenter,
        color: kForegroundColor,
        font: TextDraw.kFontMonospace,
        letterSize: [ 0.722, 2.94 ],
        shadow: 0,
    });
}
