// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Encapsulate all the settings related to gangs in a single class to avoid bloating the larger
 * Gang class too much. All settings in here should persist for persistent gangs.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class GangSettings <gangId (MAX_GANGS)> {
    // The color (0xRRGGBBAA) which this gang will be identified with.
    new m_color;

    /**
     * Returns the color which this gang and all its members should be having. The color is an
     * actual color code in 0xRRGGBBAA format, and is compatible with the ColorManager.
     *
     * @return integer The color associated with this gang.
     */
    public inline color() {
        return (m_color);
    }

    /**
     * Allows you to update the color associated with this gang. The color should be in the general
     * 0xRRGGBBAA format, as it's stored in the database.
     *
     * @param color The color which this gang should have.
     */
    public inline setColor(color) {
        m_color = color;
    }
};
