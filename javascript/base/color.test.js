// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';

describe('Color', it => {
    it('should import from [r, g, b] accordingly', assert => {
        const redish = Color.fromRGB(255, 2, 1);
        assert.equal(redish.r, 255);
        assert.equal(redish.g, 2);
        assert.equal(redish.b, 1);
        assert.equal(redish.a, 255);
    });

    it('should import from [r, g, b, a] accordingly', assert => {
        const blueish = Color.fromRGBA(2, 1, 255, 127);
        assert.equal(blueish.r, 2);
        assert.equal(blueish.g, 1);
        assert.equal(blueish.b, 255);
        assert.equal(blueish.a, 127);
    });

    it('should import from RGB numbers accordingly', assert => {
        const redish = Color.fromNumberRGB(0xFF0201);
        assert.equal(redish.r, 255);
        assert.equal(redish.g, 2);
        assert.equal(redish.b, 1);
        assert.equal(redish.a, 255);
    });

    it('should import from RGBA numbers accordingly', assert => {
        const blueish = Color.fromNumberRGBA(0x0201FF7F);
        assert.equal(blueish.r, 2);
        assert.equal(blueish.g, 1);
        assert.equal(blueish.b, 255);
        assert.equal(blueish.a, 127);
    });

    it('should import from and export to HEX accordingly', assert => {
        const redish = Color.fromHex('FF0201');
        assert.equal(redish.r, 255);
        assert.equal(redish.g, 2);
        assert.equal(redish.b, 1);
        assert.equal(redish.a, 255);

        assert.equal(redish.toHexRGB(), 'FF0201');
        assert.equal(redish.toHexRGBA(), 'FF0201FF');

        const blueish = Color.fromHex('0201FF7F');
        assert.equal(blueish.r, 2);
        assert.equal(blueish.g, 1);
        assert.equal(blueish.b, 255);
        assert.equal(blueish.a, 127);

        assert.equal(blueish.toHexRGB(), '0201FF');
        assert.equal(blueish.toHexRGBA(), '0201FF7F');
    });

    it('should convert to numbers accordingly', assert => {
        for (let i = 0; i < 1000; ++i) {
            const number = Math.floor(Math.random() * 0xFFFFFF);
            assert.equal(Color.fromNumberRGB(number).toNumberRGB(), number);
        }

        for (let i = 0; i < 1000; ++i) {
            const number = Math.floor(Math.random() * 0xFFFFFF);
            assert.equal(Color.fromNumberRGBA(number).toNumberRGBA(), number);
        }
    });

    it('supports cloning with a different alpha channel', assert => {
        const blueish = Color.fromNumberRGBA(0x0201FF7F);
        assert.equal(blueish.r, 2);
        assert.equal(blueish.g, 1);
        assert.equal(blueish.b, 255);
        assert.equal(blueish.a, 127);

        const transparentBlueish = blueish.withAlpha(250);
        assert.equal(transparentBlueish.r, 2);
        assert.equal(transparentBlueish.g, 1);
        assert.equal(transparentBlueish.b, 255);
        assert.equal(transparentBlueish.a, 250);
    });

    it('should be able to deal with HSV colours', assert => {
        const mappings = [
            {
                hex: '83FA0F',
                hsv: [ 0.25106, 0.94, 0.98039 ],
            },
            {
                hex: 'A3ACD1',
                hsv: [ 0.63405, 0.2201, 0.8196 ]
            },
            {
                hex: '7A2E1F',
                hsv: [ 0.02747, 0.7459, 0.4784 ],
            }
        ];

        for (const { hex, hsv } of mappings) {
            const colorFromHex = Color.fromHex(hex);
            const hsvFromHex = colorFromHex.toHsv();

            assert.closeTo(hsvFromHex[0], hsv[0], 0.1);
            assert.closeTo(hsvFromHex[1], hsv[1], 0.1);
            assert.closeTo(hsvFromHex[2], hsv[2], 0.1);

            const colorFromHsv = Color.fromHsv(...hsv);
            assert.equal(colorFromHsv.toHexRGB(), hex);
        }
    });
});
