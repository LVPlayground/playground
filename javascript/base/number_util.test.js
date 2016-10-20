// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('NumberUtil', it => {
    it('should be able to convert a number to an ordinal string', assert => {
        assert.equal((1).toOrdinalString(), '1st');
        assert.equal((11).toOrdinalString(), '11th');
        assert.equal((101).toOrdinalString(), '101st');
        assert.equal((111).toOrdinalString(), '111th');
        assert.equal((1001).toOrdinalString(), '1001st');
        assert.equal((1011).toOrdinalString(), '1011th');

        assert.equal((2).toOrdinalString(), '2nd');
        assert.equal((12).toOrdinalString(), '12th');
        assert.equal((102).toOrdinalString(), '102nd');
        assert.equal((112).toOrdinalString(), '112th');
        assert.equal((1002).toOrdinalString(), '1002nd');
        assert.equal((1012).toOrdinalString(), '1012th');

        assert.equal((3).toOrdinalString(), '3rd');
        assert.equal((13).toOrdinalString(), '13th');
        assert.equal((103).toOrdinalString(), '103rd');
        assert.equal((113).toOrdinalString(), '113th');
        assert.equal((1003).toOrdinalString(), '1003rd');
        assert.equal((1013).toOrdinalString(), '1013th');

        assert.equal((0).toOrdinalString(), '0th');
        assert.equal((4).toOrdinalString(), '4th');
        assert.equal((5).toOrdinalString(), '5th');
        assert.equal((16).toOrdinalString(), '16th');
        assert.equal((17).toOrdinalString(), '17th');
        assert.equal((118).toOrdinalString(), '118th');
        assert.equal((119).toOrdinalString(), '119th');
        assert.equal((240).toOrdinalString(), '240th');

        assert.equal((10.25).toOrdinalString(), '10th');
        assert.equal((11.99).toOrdinalString(), '11th');
    });
});
