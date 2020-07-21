// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

import { displayColorPicker } from 'features/player_colors/color_picker_ui.js';
import { range } from 'base/range.js';

// Titles that will be shown on the color picker, to tell the player which phase they're in.
const kSelectBaseTitle = '(1/2) Select base color...';
const kSelectShadeTitle = '(2/2) Select the color shade...';

// This class represents the two-step colour picker supported by Las Venturas Playground. The first
// step asks the player for the hue of the color, where the second step asks them for the saturation
// and value of the color, in six different variants.
export class ColorPicker {
    // Displays the color picker for the given |player|. This will start the two-phase flow, and
    // return either a Color instance when selected, or null when aborted.
    static async displayForPlayer(player) {
        // (1) Have the |player| select the base color from which they will pick a shade.
        const baseColor =
            await displayColorPicker(player, kSelectBaseTitle, ColorPicker.getColorFamilies());

        // Bail out if the |player| did not select a base color.
        if (!baseColor)
            return null;

        // (2) Have the |player| pick a shade within the |baseColor|.
        return await displayColorPicker(
            player, kSelectShadeTitle, ColorPicker.getColorFamilyValues(baseColor));
    }

    // Returns the 36 color families that are to be displayed as the first step of the picker. They
    // evenly represent the hue part of the HSV color spectrum.
    static getColorFamilies() {
        return range(36).map(index => Color.fromHsv((3 + index * 10) / 360, 1, 1));
    }

    // Returns the 32 color values that are to be displayed as the second step in the picker, based
    // on the |baseColor| that has been chosen by the player so far.
    static getColorFamilyValues(baseColor) {
        const [ hue ] = baseColor.toHsv();

        const saturationSteps = [ 1.0, 0.85, 0.7, 0.5, 0.3, 0.1 ];
        const valueSteps = [ 1.0, 0.9, 0.8, 0.65, 0.5, 0.35 ];

        const colors = [];

        for (const value of valueSteps) {
            for (const saturation of saturationSteps)
                colors.push(Color.fromHsv(hue, saturation, value));
        }

        return colors;
    }
}
