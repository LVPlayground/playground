// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Each cell in Pawn is four bytes, which means that a lot of space is being wasted for no real
 * purpose. As the limits of various systems in Las Venturas Playground are increasing, the Cell
 * class may be used to split any cell in two, four, eight, sixteen or thirty-two member values.
 *
 * The limits for each kind of "separation" are set by the amount of bits left to store each value.
 * While integers are signed in Pawn, we'll treat them as unsigned in these calculations. The
 * limits are as follows:
 *
 * Separation         | Bits per value  | Range per value  |
 * -------------------|-----------------|------------------|
 * Short values       | 16              | [0, 65535]       |
 * Byte values        | 8               | [0, 255]         |
 * Eight values       | 4               | [0, 15]          |
 * Sixteen values     | 2               | [0, 3]           |
 * Bit values         | 1               | [0, 1]           |
 *
 * All methods in this class are declared as inline, so there is no performance cost for using them.
 * However, as calculations need to be done on the cells themselves, be wary with using them in
 * performance critical code. In many cases, memory is cheaper than performance.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Cell {
    /**
     * Get a value from a two-member value cell.
     *
     * @param cell The cell to get a member value from.
     * @param index Index of the member value to retrieve.
     * @return integer Value of the member value.
     */
    public inline getShortValue(cell, index) {
        return ((cell >> (_: (index) << 4)) & 0xFFFF);
    }

    /**
     * Set a value in a two-member value cell.
     *
     * @param cell The cell to get to set a value in.
     * @param index Index of the member value to update.
     * @param value Value to set in that part of the cell.
     */
    public inline setShortValue(&cell, index, value) {
        cell ^= cell & (0xFFFF << (_: (index) << 4)) ^ ((_: (value) & 0xFFFF) << (_: (index) << 4));
    }

    /**
     * Get a value from a four-member value cell.
     *
     * @param cell The cell to get a member value from.
     * @param index Index of the member value to retrieve.
     * @return integer Value of the member value.
     */
    public inline getByteValue(cell, index) {
        return ((cell >> (index << 3)) & 0xFF);
    }

    /**
     * Set a value in a four-member value cell.
     *
     * @param cell The cell to get to set a value in.
     * @param index Index of the member value to update.
     * @param value Value to set in that part of the cell.
     */
    public inline setByteValue(&cell, index, value) {
        cell ^= cell & (0xFF << (_: (index) << 3)) ^ ((_: (value) & 0xFF) << (_: (index) << 3));
    }

    /**
     * Get a value from a eight-member value cell.
     *
     * @param cell The cell to get a member value from.
     * @param index Index of the member value to retrieve.
     * @return integer Value of the member value.
     */
    public inline getEightMemberCellValue(cell, index) {
        return (0);
    }

    /**
     * Set a value in a eight-member value cell.
     *
     * @param cell The cell to get to set a value in.
     * @param index Index of the member value to update.
     * @param value Value to set in that part of the cell.
     */
    public inline setEightMemberCellValue(&cell, index, value) {
        return (0);
    }

    /**
     * Get a value from a sixteen-member value cell.
     *
     * @param cell The cell to get a member value from.
     * @param index Index of the member value to retrieve.
     * @return integer Value of the member value.
     */
    public inline getSixteenMemberCellValue(cell, index) {
        return (0);
    }

    /**
     * Set a value in a sixteen-member value cell.
     *
     * @param cell The cell to get to set a value in.
     * @param index Index of the member value to update.
     * @param value Value to set in that part of the cell.
     */
    public inline setSixteenMemberCellValue(&cell, index, value) {
        return (0);
    }

    /**
     * Get a value from a thirty two-member (bit) value cell.
     *
     * @param cell The cell to get a member value from.
     * @param index Index of the member value to retrieve.
     * @return integer Value of the member value.
     */
    public inline getBitValue(cell, index) {
        return ((cell >> _: (index)) & 1);
    }

    /**
     * Set a value in a thirty two-member (bit) value cell.
     *
     * @param cell The cell to get to set a value in.
     * @param index Index of the member value to update.
     * @param value Value to set in that part of the cell.
     */
    public inline setBitValue(&cell, index, value) {
        cell ^= cell & (1 << (_: (index))) ^ ((_: (value) & 1) << _: (index));
    }
};

// Include a test-suite created for the Cell operations.
#include "Interface/Cell.tests.pwn"