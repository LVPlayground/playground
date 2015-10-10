// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The weather printer outputs the current weather to the console. This is useful in case you want
 * to visualize how the algorithm behaves on a sped-up scale, which significantly helps during
 * debugging. It should only be used in debug builds.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class WeatherPrinter {
    /**
     * Output the weather to the console. Two grids will be printed. The left grid will represent
     * the current temperatures in the game, while the right grid will represent the humidity.
     */
    public print() {
        new rowBuffer[WeatherConfiguration::EdgeTileCount * 2 + 6];
        for (new tileY = 0; tileY < WeatherConfiguration::EdgeTileCount; ++tileY) {
            new tileRowOffset = tileY * WeatherConfiguration::EdgeTileCount;

            // First print the temperatures of the current row.
            for (new tileX = 0; tileX < WeatherConfiguration::EdgeTileCount; ++tileX)
                rowBuffer[tileX] = '0' + Math->floor(Environment(tileRowOffset + tileX)->temperature());

            // Add five spaces between the two overviews.
            for (new spacingIndex = 0; spacingIndex < 5; ++spacingIndex)
                rowBuffer[WeatherConfiguration::EdgeTileCount + spacingIndex] = ' ';

            // Now print the humidity values of this area.
            for (new tileX = 0; tileX < WeatherConfiguration::EdgeTileCount; ++tileX)
                rowBuffer[WeatherConfiguration::EdgeTileCount + 5 + tileX] = '0' + Math->floor(Environment(tileRowOffset + tileX)->humidity());

            // Output the entire row at once.
            printf(rowBuffer);
        }

        // Add a blank line so we have a minimal separator between states.
        printf("");
    }

    /**
     * The process control method will trigger updates of the weather every second. This is a lot
     * faster than what usually would happen, but gives us the ability to debug the algorithm.
     */
    @list(SecondTimer)
    public processControl() {
        WeatherController->update();
        this->print();
    }
};
