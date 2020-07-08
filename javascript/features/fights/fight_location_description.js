// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StructuredGameDescription } from 'components/games/structured_game_description.js';

import { kGameEnvironment,
         kGameObjects,
         kGamePickups,
         kPositionProperty,
         kRotationAngleProperty } from 'components/games/structured_game_description_templates.js';

// Describes a location in which fights can take place, as imported from the JSON data file. All
// imported data will be thoroughly validated. Does not contain any logic, as that's handled by
// the FightLocation class instead.
export class FightLocationDescription extends StructuredGameDescription {
    constructor(filename) {
        super('Fight', filename, [
            {
                name: 'name',
                type: StructuredGameDescription.kTypeString,
            },
            {
                name: 'spawnPositions',
                type: StructuredGameDescription.kTypeObject,
                structure: [
                    {
                        name: 'individual',
                        type: StructuredGameDescription.kTypeArray,
                        elementType: {
                            type: StructuredGameDescription.kTypeObject,
                            structure: [
                                {
                                    name: 'position',
                                    ...kPositionProperty,
                                },
                                {
                                    name: 'facingAngle',
                                    ...kRotationAngleProperty,
                                },
                            ],
                        },
                    },
                    {
                        name: 'teams',
                        type: StructuredGameDescription.kTypeArray,
                        elementType: {
                            type: StructuredGameDescription.kTypeArray,
                            elementType: {
                                type: StructuredGameDescription.kTypeObject,
                                structure: [
                                    {
                                        name: 'position',
                                        ...kPositionProperty,
                                    },
                                    {
                                        name: 'facingAngle',
                                        ...kRotationAngleProperty,
                                    },
                                ],
                            }
                        },
                    },
                ],
            },

            kGameEnvironment,
            kGameObjects,
            kGamePickups,
        ]);
    }
}
