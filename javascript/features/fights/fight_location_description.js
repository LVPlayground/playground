// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rect } from 'base/rect.js';
import { StructuredGameDescription } from 'components/games/structured_game_description.js';
import { Vector } from 'base/vector.js';

import { random } from 'base/random.js';

import { kGameEnvironment,
         kGameObjects,
         kGamePickups,
         kPositionProperty,
         kPositionRectangleProperty,
         kRotationAngleProperty } from 'components/games/structured_game_description_templates.js';

// Describes a location in which fights can take place, as imported from the JSON data file. All
// imported data will be thoroughly validated. Does not contain any logic, as that's handled by
// the FightLocation class instead.
export class FightLocationDescription extends StructuredGameDescription {
    // Expected number of spawn positions for individual and for team-based games.
    static kIndividualSpawnPositionCount = 16;
    static kTeamSpawnPositionCount = 8;

    constructor(filename) {
        super('Fight', filename, [
            {
                name: 'name',
                type: StructuredGameDescription.kTypeString,
            },
            {
                name: 'shortName',
                type: StructuredGameDescription.kTypeString,
            },
            {
                name: 'spawnPositions',
                type: StructuredGameDescription.kTypeObject,
                structure: [
                    {
                        name: 'area',
                        ...kPositionRectangleProperty,
                    },
                    {
                        name: 'areaZ',
                        type: StructuredGameDescription.kTypeNumber,
                        defaultValue: 0,
                    },
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

        this.buildSpawnPositions();
        this.verifySpawnPositions();
    }

    // Builds the spawn positions when they've been defined as an area rather than based on
    // individual positions. Teams will be grouped together in a corner when there's space.
    buildSpawnPositions() {
        if (!(this.spawnPositions.area instanceof Rect))
            return;  // fixed spawn positions have been given

        if (typeof this.spawnPositions.areaZ !== 'number')
            throw new Error(`${this}: spawnPositions.areaZ must be given for area-based locations`);

        const area = this.spawnPositions.area;
        const z = this.spawnPositions.areaZ;

        // The center position of the battle field. Player facing angles will be looking here.
        const center = new Vector(...area.center, z);

        // Utility function to generate a random spawn position in the |area|. The player will be
        // facing towards the |center| of the map, to give them the maximum view of the battle.
        function generateRandomSpawnPosition(area) {
            const position = new Vector(
                /* x= */ random(area.minX, area.maxX),
                /* y= */ random(area.minY, area.maxY),
                /* z= */ z,
            );

            return {
                position,
                facingAngle: 0,
            }
        }

        // (1) Generate the individual spawn positions. These will be randomly generated across the
        // entire area, where everyone will be facing towards the center.
        if (!this.spawnPositions.individual.length) {
            for (let i = 0; i < FightLocationDescription.kIndividualSpawnPositionCount; ++i)
                this.spawnPositions.individual.push(generateRandomSpawnPosition(area));
        }

        // (2) Generate spawn positions for the teams. If the area is sufficiently large, we create
        // two opposing corners that are facing each other.
        if (!this.spawnPositions.teams.length) {
            let alphaArea = area;
            let bravoArea = area;

            // Require the area to be >= 50 units in width/height to create areas for the team.
            if (area.width >= 50 && area.height >= 50) {
                const sectionWidth = area.width / 3.5;
                const sectionHeight = area.height / 3.5;

                alphaArea = new Rect(area.minX, area.minY, area.minX + sectionWidth,
                                     area.minY + sectionHeight);
                bravoArea = new Rect(area.maxX, area.maxY, area.maxX - sectionWidth,
                                     area.maxY - sectionHeight);
            }

            this.spawnPositions.teams = [ /* alpha= */ [], /* bravo= */ [] ];

            // Generate positions for Team Alpha, then for Team Bravo.
            for (let i = 0; i < FightLocationDescription.kTeamSpawnPositionCount; ++i)
                this.spawnPositions.teams[0].push(generateRandomSpawnPosition(alphaArea));

            for (let i = 0; i < FightLocationDescription.kTeamSpawnPositionCount; ++i)
                this.spawnPositions.teams[1].push(generateRandomSpawnPosition(bravoArea));
        }
    }

    // Verifies that the spawn positions available for this game match the requirements set in this
    // class, as we want to draw the same line across all our games.
    verifySpawnPositions() {
        const spawnPositionExpectations = [
            [
                this.spawnPositions.individual.length,
                FightLocationDescription.kIndividualSpawnPositionCount,
                'individual spawn positions',
            ],
            [
                this.spawnPositions.teams[0].length,
                FightLocationDescription.kTeamSpawnPositionCount,
                'alpha team spawn positions',
            ],
            [
                this.spawnPositions.teams[1].length,
                FightLocationDescription.kTeamSpawnPositionCount,
                'bravo team spawn positions',
            ],
        ];

        for (const [ actual, expected, message ] of spawnPositionExpectations) {
            if (actual === expected)
                continue;

            throw new Error(`Expected ${expected} ${message}, got ${actual}.`);
        }
    }
}
