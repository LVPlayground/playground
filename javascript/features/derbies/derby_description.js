// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StructuredGameDescription } from 'components/games/structured_game_description.js';

import { kGameEnvironment,
         kGameObjects,
         kGamePickups,
         kGameSpawnPositions } from 'components/games/structured_game_description_templates.js';

// The default time limit that will apply to derbies.
export const kDefaultLimitSec = 600;

// Describes the settings of an individual derby game, as loaded from its JSON configuration file.
// Validation of data is strict, to make sure problems are discovered at launch time, not run time.
export class DerbyDescription extends StructuredGameDescription {
    constructor(filename) {
        super('Derby', filename, [
            {
                name: 'name',
                type: StructuredGameDescription.kTypeString,
            },
            {
                name: 'id',
                type: StructuredGameDescription.kTypeNumber,
            },

            kGameEnvironment,
            kGameObjects,
            kGamePickups,
            kGameSpawnPositions,

            {
                name: 'settings',
                type: StructuredGameDescription.kTypeObject,
                structure: [
                    {
                        name: 'invisible',
                        type: StructuredGameDescription.kTypeBoolean,
                        defaultValue: false,
                    },
                    {
                        name: 'lowerAltitudeLimit',
                        type: StructuredGameDescription.kTypeNumber,
                        defaultValue: -100,  // no limit
                    },
                    {
                        name: 'timeLimit',
                        type: StructuredGameDescription.kTypeNumber,
                        defaultValue: kDefaultLimitSec,
                    }
                ],
            },
        ]);
    }
}
