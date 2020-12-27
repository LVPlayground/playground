// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StructuredGameDescription } from 'components/games/structured_game_description.js';

import { kGameCheckpoints,
         kGameEnvironment,
         kGameObjects,
         kGamePickups,
         kGameSpawnPositions } from 'components/games/structured_game_description_templates.js';

// Describes the settings of an individual race, as loaded from its JSON configuration file.
// Validation of data is strict, to make sure problems are discovered at launch time, not run time.
export class RaceDescription extends StructuredGameDescription {
    constructor(filename) {
        super('Race', filename, [
            {
                name: 'name',
                type: StructuredGameDescription.kTypeString,
            },
            {
                name: 'id',
                type: StructuredGameDescription.kTypeNumber,
            },

            kGameEnvironment,
            kGameSpawnPositions,
            kGameCheckpoints,
            kGameObjects,
            kGamePickups,

            {
                name: 'settings',
                type: StructuredGameDescription.kTypeObject,
                structure: [
                    {
                        name: 'allowLeaveVehicle',
                        type: StructuredGameDescription.kTypeBoolean,
                        defaultValue: false,
                    },
                    {
                        name: 'disableVehicleDamage',
                        type: StructuredGameDescription.kTypeBoolean,
                        defaultValue: false,
                    },
                    {
                        name: 'laps',
                        type: StructuredGameDescription.kTypeNumber,
                        defaultValue: 1,
                    },
                    {
                        name: 'nos',
                        type: StructuredGameDescription.kTypeNumber,
                        defaultValue: 0,
                    },
                    {
                        name: 'timeLimit',
                        type: StructuredGameDescription.kTypeNumber,
                        defaultValue: 600,
                    },
                    {
                        name: 'unlimitedNos',
                        type: StructuredGameDescription.kTypeBoolean,
                        defaultValue: false,
                    }
                ],
            },
        ]);
    }
}
