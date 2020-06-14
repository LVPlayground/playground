// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TextDraw } from 'components/text_draw/text_draw.js';

// The NavigationButton class represents a navigation button that points in a certain direction. The
// directions are defined as statics on this class.
export class NavigationButton extends TextDraw {
    constructor(x, y, direction, callback) {
        super({
            position: [ x, y ],

            textSize: [ 17.006999, 17.007396 ],
            letterSize: [ 0.002000, 0.037333 ],
            selectable: true,

            font: TextDraw.FONT_TEXTURE,
            text: direction
        });

        this.callback_ = callback;
    }

    onClick(player) {
        this.callback_(player);
    }
}

// The following directions are available for these buttons.
NavigationButton.DIRECTION_UP_LEFT = 'LD_BEAT:upl';
NavigationButton.DIRECTION_UP = 'LD_BEAT:up';
NavigationButton.DIRECTION_UP_RIGHT = 'LD_BEAT:upr';
NavigationButton.DIRECTION_RIGHT = 'LD_BEAT:right';
NavigationButton.DIRECTION_BOTTOM_RIGHT = 'LD_BEAT:downr';
NavigationButton.DIRECTION_BOTTOM = 'LD_BEAT:down';
NavigationButton.DIRECTION_BOTTOM_LEFT = 'LD_BEAT:downl';
NavigationButton.DIRECTION_LEFT = 'LD_BEAT:left';

NavigationButton.ACTION_OK = 'LD_CHAT:thumbup';
NavigationButton.ACTION_CANCEL = 'LD_CHAT:thumbdn';
