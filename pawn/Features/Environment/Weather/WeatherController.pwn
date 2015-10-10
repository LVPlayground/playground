// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Weather Controller controls the actual weather. It uses the algorithms to advance to the
 * next iteration, calculating the new state for each of the tiles based on the surrounding tiles,
 * temperature, humidity and the wind direction.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class WeatherController {
    /**
     * Advance to the next iteration in the weather algorithm. All tiles will be updated and a new
     * wind direction will be calculated. The current time for a given tile will also be considered,
     * as it obviously can be colder at night than during daytime.
     */
    public update() {
        /// @todo(Russell) Implement this.
    }
};
