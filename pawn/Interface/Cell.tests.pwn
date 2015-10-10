// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

#pragma testcase CellTestSuite

stock CellTestSuite() {
    new cell; // The cell used for storage.

    // Test two-value cells, each being two bytes, sixteen bits. The range should be [0, 65535].
    cell = 0;

    Cell->setShortValue(cell, 0, 1337);
    Cell->setShortValue(cell, 0, 62314);
    Cell->setShortValue(cell, 0, 65);
    Cell->setShortValue(cell, 1, 15);
    Cell->setShortValue(cell, 1, 52319);
    Cell->setShortValue(cell, 1, 16584);

    assert_equals(Cell->getShortValue(cell, 0), 65, "Two-value cell, get in-range first member.");
    assert_equals(Cell->getShortValue(cell, 1), 16584, "Two-value cell, get in-range second member.");

    Cell->setShortValue(cell, 0, 232265);

    assert_different(Cell->getShortValue(cell, 0), 232265, "Two-value cell, get in-range first member.");
    assert_equals(Cell->getShortValue(cell, 1), 16584, "Two-value cell, get overflow member.");

    Cell->setShortValue(cell, 0, 62314);
    Cell->setShortValue(cell, 1, -1337731);

    assert_equals(Cell->getShortValue(cell, 0), 62314, "Two-value cell, get underflow member.");
    assert_different(Cell->getShortValue(cell, 1), -1337731, "Two-value cell, get overflow member.");


    // Test four-value cells, each being 1 byte, eight bits. The range should be [0, 255].
    cell = 0;

    Cell->setByteValue(cell, 0, 230);
    Cell->setByteValue(cell, 0, 123);
    Cell->setByteValue(cell, 1, 210);
    Cell->setByteValue(cell, 1, 23);
    Cell->setByteValue(cell, 2, 15);
    Cell->setByteValue(cell, 3, 76);

    assert_equals(Cell->getByteValue(cell, 0), 123, "Four-value cell, get in-range first member.");
    assert_equals(Cell->getByteValue(cell, 1),  23, "Four-value cell, get in-range second member.");
    assert_equals(Cell->getByteValue(cell, 2),  15, "Four-value cell, get in-range third member.");
    assert_equals(Cell->getByteValue(cell, 3),  76, "Four-value cell, get in-range fourth member.");

    Cell->setByteValue(cell, 0, -15);
    Cell->setByteValue(cell, 2, 300);

    assert_different(Cell->getByteValue(cell, 0), -15, "Four-value cell, get underflow member.");
    assert_equals(Cell->getByteValue(cell, 1), 23, "Four-value cell, post underflow member.");
    assert_different(Cell->getByteValue(cell, 2), 300, "Four-value cell, get overflow member.");
    assert_equals(Cell->getByteValue(cell, 3), 76, "Four-value cell, post overflow member.");

    // Test eight-value cells, each being four bits. The range should be [0, 15].
    /// @todo Implement this.

    // Test sixteen-value cells, each being two bits. The range should be [0, 3].
    /// @todo Implement this.

    // Test thirty two-value (bit) cells, each being one bit. The range should be [0, 1].
    cell = 0;

    Cell->setBitValue(cell, 0, 0);
    Cell->setBitValue(cell, 0, 1);
    Cell->setBitValue(cell, 25, 1);
    Cell->setBitValue(cell, 25, 0);
    Cell->setBitValue(cell, 16, 1);
    Cell->setBitValue(cell, 31, 0);
    Cell->setBitValue(cell, 31, 1);

    assert_equals(Cell->getBitValue(cell, 0),  1, "Bit-value cell, get in-range first member.");
    assert_equals(Cell->getBitValue(cell, 1),  0, "Bit-value cell, get uninitialized in-range second member.");
    assert_equals(Cell->getBitValue(cell, 16), 1, "Bit-value cell, get in-range seventeenth member.");
    assert_equals(Cell->getBitValue(cell, 25), 0, "Bit-value cell, get in-range twenty-sixth member.");
    assert_equals(Cell->getBitValue(cell, 31), 1, "Bit-value cell, get in-range thirty-second member.");

    Cell->setBitValue(cell, 0, 25);
    Cell->setBitValue(cell, 30, -15);

    assert_different(Cell->getBitValue(cell, 0), 25, "Bit-value cell, get overflow member.");
    assert_equals(Cell->getBitValue(cell, 1), 0, "Bit-value cell, get post-overflow member.");
    assert_different(Cell->getBitValue(cell, 30), -15, "Bit-value cell, get underflow member.");
    assert_equals(Cell->getBitValue(cell, 31), 1, "Bit-value cell, get post-underflow member.");
}
