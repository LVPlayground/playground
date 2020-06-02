// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Rectangle from 'components/text_draw/rectangle.js';
import TextDraw from 'components/text_draw/text_draw.js';

// Each game is able to (and probably should) have a callback before players will actually start to
// participate in the game. This happens before they spawn for the first time, and is the best
// place to show the name of the game, a description of the goal, and of course the remaining time.
export async function showCountdownForPlayer(player, description) {
    const messageElement = createMessageElement(description.goal);

    const counterBackground = createCounterBackground();
    const counterTitleElement = createCounterTitleElement();
    const counterElement = createCounterElement();

    // The composition contains all the elements that are part of the countdown view.
    const composition = [ messageElement, counterBackground, counterTitleElement, counterElement ];

    // Freeze the player, so that they're not able to move just yet.
    player.controllable = false;

    // Move the camera to the initial frame of the interpolation, then wait for 500ms for the scene
    // to load. This will take longer on slower computers, much less on faster ones.
    player.setCamera(description.countdownCamera[0], description.countdownView[0]);

    await wait(500);

    for (const element of composition)
        element.displayForPlayer(player);

    await wait(500);

    // Interpolate the |player|'s camera through the scene as configured, for the exact duration of
    // the countdown. Secretly we'll add another 500ms at the end.
    player.interpolateCamera(
        description.countdownCamera[0], description.countdownCamera[1],
        description.countdownView[0], description.countdownView[1], description.countdown * 1000);

    // For each passing second, update the counter with the new remaining time.
    for (let second = description.countdown; second >= 0; --second) {
        counterElement.updateTextForPlayer(player, second || 'GO');
        await wait(1000);
    }

    // Wait another 500ms to give them the ability to parse "GO", then remove the composition.
    await wait(500);

    for (const element of composition)
        element.hideForPlayer(player);

    // Mark the player as controllable again, and reset their camera. They're off.
    player.controllable = true;
    player.resetCamera();
}

// Creates the text draw that will be used to display the game's goal.
function createMessageElement(message) {
    return new TextDraw({
        position: [320, 265],
        alignment: TextDraw.ALIGN_CENTER,

        text: `~n~${message}~n~_`,
        font: TextDraw.FONT_SANS_SERIF,
        textSize: [110, 320],
        shadowSize: 1,

        useBox: true,
        boxColor: Color.fromRGBA(0, 0, 0, 40),
    });
}

// Creates the background for the actual countdown counter.
function createCounterBackground() {
    return new Rectangle(161, 140, 317.5, 115, Color.fromRGBA(0, 0, 0, 100));
}

// Creates the element that will display the call-to-action to the player.
function createCounterTitleElement() {
    return new TextDraw({
        position: [320, 150],
        alignment: TextDraw.ALIGN_CENTER,

        text: 'GET READY',
        font: TextDraw.FONT_MONOSPACE,
        letterSize: [0.4, 1.6],
        shadowSize: 0
    });
}

// Creates the text draw that will display the actual count down.
function createCounterElement(seconds) {
    return new TextDraw({
        position: [320, 175],
        alignment: TextDraw.ALIGN_CENTER,

        text: '_',
        font: TextDraw.FONT_MONOSPACE,
        color: Color.fromRGBA(255, 255, 0, 255),
        letterSize: [0.722, 2.94],
        shadowSize: 0
    });
}
