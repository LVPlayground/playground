// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { TextDraw } from 'entities/text_draw.js';
import { Vector } from 'base/vector.js';

describe('TextDrawManager', it => {
    it('is able to create text draws, and reflects default values properly', assert => {
        const textDraw = server.textDrawManager.createTextDraw({
            position: [ 320, 240 ],
            text: 'Hello, world!',
        });

        assert.notEqual(textDraw.id, TextDraw.kInvalidId);
        assert.isTrue(textDraw.isConnected());
        assert.deepEqual(textDraw.position, [ 320, 240 ]);
        assert.isFalse(textDraw.selectable);
        assert.equal(textDraw.text, 'Hello, world!');

        assert.equal(textDraw.alignment, TextDraw.kAlignLeft);
        assert.equal(textDraw.font, TextDraw.kFontSansSerif);
        assert.isNull(textDraw.letterSize);
        assert.isTrue(textDraw.proportional);
        assert.isNull(textDraw.textSize);

        assert.isNull(textDraw.backgroundColor);
        assert.isNull(textDraw.boxColor);
        assert.isNull(textDraw.color);

        assert.isFalse(textDraw.box);
        assert.equal(textDraw.outline, 0);
        assert.equal(textDraw.shadow, 2);

        assert.isNull(textDraw.previewModel);
        assert.isNull(textDraw.previewRotation);
        assert.isNull(textDraw.previewScale);
        assert.isNull(textDraw.previewVehicleColor);
    });

    it('is able to create text draws, with all possible customizations', assert => {
        const textDraw = server.textDrawManager.createTextDraw({
            position: [ 320, 240 ],
            text: 'Hello, world!',
            selectable: true,

            alignment: TextDraw.kAlignCenter,
            font: TextDraw.kFontMonospace,
            letterSize: [ 1, 1 ],
            proportional: false,
            textSize: [ 2, 2 ],

            backgroundColor: Color.fromRGB(255, 0, 0),
            boxColor: Color.fromRGB(0, 255, 0),
            color: Color.fromRGB(0, 0, 255),

            box: true,
            outline: 2,
            shadow: 0,

            previewModel: 1225,  // Red Barrel
            previewRotation: new Vector(1, 2, 3),
            previewScale: 15,
            previewVehicleColor: 120,
        });

        assert.notEqual(textDraw.id, TextDraw.kInvalidId);
        assert.isTrue(textDraw.isConnected());
        assert.deepEqual(textDraw.position, [ 320, 240 ]);
        assert.isTrue(textDraw.selectable);
        assert.equal(textDraw.text, 'Hello, world!');

        assert.equal(textDraw.alignment, TextDraw.kAlignCenter);
        assert.equal(textDraw.font, TextDraw.kFontMonospace);
        assert.deepEqual(textDraw.letterSize, [ 1, 1 ]);
        assert.isFalse(textDraw.proportional);
        assert.deepEqual(textDraw.textSize, [ 2, 2 ]);

        assert.isNotNull(textDraw.backgroundColor);
        assert.equal(textDraw.backgroundColor.toHexRGB(), 'FF0000');
        assert.isNotNull(textDraw.boxColor);
        assert.equal(textDraw.boxColor.toHexRGB(), '00FF00');
        assert.isNotNull(textDraw.color);
        assert.equal(textDraw.color.toHexRGB(), '0000FF');

        assert.isTrue(textDraw.box);
        assert.equal(textDraw.outline, 2);
        assert.equal(textDraw.shadow, 0);

        assert.equal(textDraw.previewModel, 1225);
        assert.deepEqual(textDraw.previewRotation, new Vector(1, 2, 3));
        assert.equal(textDraw.previewScale, 15);
        assert.equal(textDraw.previewVehicleColor, 120);
    });
});
