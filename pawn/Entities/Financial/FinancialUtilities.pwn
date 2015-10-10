// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * This class contains several methods which can help in doing tasks related to finance, such as
 * formatting prices.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class FinancialUtilities {
    /**
     * Format an integer which represents an amount of money as a more readable string, and add a
     * dollar symbol as well.
     *
     * @param price The amount of money to be formatted.
     * @param buffer The string in which the formatted price is stored.
     * @param bufferSize The lenght of the string in which the formatted price is stored.
     * @return integer The lenght of the buffer.
     */
    public formatPrice(price, buffer[], bufferSize) {
        new offset;
        format(buffer, bufferSize, "$%d", price);
        offset = strlen(buffer);

        if (offset <= 3)
            return strlen(buffer);

        while (offset > 4) {
            offset -= 3;
            strins(buffer, ",", offset, bufferSize);
        }

        return strlen(buffer);
    }
};