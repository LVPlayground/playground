// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Rect } from 'base/rect.js';
import { StructuredGameDescription } from 'components/games/structured_game_description.js';
import { Vector } from 'base/vector.js';

import { kGameEnvironment,
         kGameObjects,
         kGamePickups,
         kGameSpawnPositions,
         kPositionProperty,
         kRotationVectorProperty } from 'components/games/structured_game_description_templates.js';

describe('StructuredGameDescriptionTemplates', it => {
    it('can validate 3D positions in the world', assert => {
        assert.throws(() => {
            new StructuredGameDescription('Game', {
                position: 'string',  // invalid type
            }, [ { name: 'position', ...kPositionProperty } ]);
        });

        assert.throws(() => {
            new StructuredGameDescription('Game', {
                position: [ 10, 20 ],  // missing z-coordinate
            }, [ { name: 'position', ...kPositionProperty } ]);
        });

        assert.throws(() => {
            new StructuredGameDescription('Game', {
                position: [ 10000, 1000, 1000 ],  // out-of-bounds coordinate
            }, [ { name: 'position', ...kPositionProperty } ]);
        });

        const description = new StructuredGameDescription('Game', {
            position: [ 1000, 1200, 1300 ],
        }, [ { name: 'position', ...kPositionProperty } ]);
        
        assert.isTrue(description.hasOwnProperty('position'));
        assert.instanceOf(description.position, Vector);
        assert.equal(description.position.x, 1000);
        assert.equal(description.position.y, 1200);
        assert.equal(description.position.z, 1300);
    });

    it('can validate 3D rotations in the world', assert => {
        assert.throws(() => {
            new StructuredGameDescription('Game', {
                rotation: 'string',  // invalid type
            }, [ { name: 'rotation', ...kRotationVectorProperty } ]);
        });

        assert.throws(() => {
            new StructuredGameDescription('Game', {
                rotation: [ 10, 20 ],  // missing z-rotation
            }, [ { name: 'rotation', ...kRotationVectorProperty } ]);
        });

        assert.throws(() => {
            new StructuredGameDescription('Game', {
                rotation: [ 0, 0, 1000 ],  // out-of-bounds rotation
            }, [ { name: 'rotation', ...kRotationVectorProperty } ]);
        });

        const description = new StructuredGameDescription('Game', {
            rotation: [ 80, 160, 240 ],
        }, [ { name: 'rotation', ...kRotationVectorProperty } ]);
        
        assert.isTrue(description.hasOwnProperty('rotation'));
        assert.instanceOf(description.rotation, Vector);
        assert.equal(description.rotation.x, 80);
        assert.equal(description.rotation.y, 160);
        assert.equal(description.rotation.z, 240);
    });

    it('is able to deal with game environment settings', assert => {
        const defaultDescription = new StructuredGameDescription('Game', {}, [ kGameEnvironment ]);

        assert.strictEqual(defaultDescription.environment.boundaries, null);
        assert.strictEqual(defaultDescription.environment.gravity, 'Normal');
        assert.strictEqual(defaultDescription.environment.interiorId, 0);
        assert.strictEqual(defaultDescription.environment.time, 'Afternoon');
        assert.strictEqual(defaultDescription.environment.weather, 'Sunny');

        const valuedDescription = new StructuredGameDescription('Game', {
            environment: {
                boundaries: {
                    minimumX: 0,
                    maximumX: 50,
                    minimumY: 100,
                    maximumY: 150,
                },
                gravity: 'High',
                interiorId: 7,
                time: 'Night',
                weather: 'Sandstorm',
            }
        }, [ kGameEnvironment ]);

        assert.instanceOf(valuedDescription.environment.boundaries, Rect);
        assert.deepEqual(valuedDescription.environment.boundaries, new Rect(0, 100, 50, 150));
        assert.strictEqual(valuedDescription.environment.gravity, 'High');
        assert.strictEqual(valuedDescription.environment.interiorId, 7);
        assert.strictEqual(valuedDescription.environment.time, 'Night');
        assert.strictEqual(valuedDescription.environment.weather, 'Sandstorm');
    });

    it('is able to deal with object definitions for a game', assert => {
        const defaultDescription = new StructuredGameDescription('Game', {}, [ kGameObjects ]);
        assert.strictEqual(defaultDescription.objects.length, 0);

        const valuedDescription = new StructuredGameDescription('Game', {
            objects: [
                { modelId: 1225, position: [  0, 10, 20 ], rotation: [  5, 15, 25 ] },
                { modelId: 1225, position: [ 30, 40, 50 ], rotation: [ 35, 45, 55 ] },
            ]
        }, [ kGameObjects ]);

        assert.strictEqual(valuedDescription.objects.length, 2);

        assert.equal(valuedDescription.objects[0].modelId, 1225);
        assert.instanceOf(valuedDescription.objects[0].position, Vector);
        assert.deepEqual(valuedDescription.objects[0].position, new Vector(0, 10, 20));
        assert.instanceOf(valuedDescription.objects[0].rotation, Vector);
        assert.deepEqual(valuedDescription.objects[0].rotation, new Vector(5, 15, 25));
    });

    it('is able to deal with pickup definitions for a game', assert => {
        const defaultDescription = new StructuredGameDescription('Game', {}, [ kGamePickups ]);
        assert.strictEqual(defaultDescription.pickups.length, 0);

        const valuedDescription = new StructuredGameDescription('Game', {
            pickups: [
                { modelId: 1225, type: 14, position: [  0, 10, 20 ] },
                { modelId: 1225, type: 14, respawnTime: 30, position: [ 30, 40, 50 ] },
            ]
        }, [ kGamePickups ]);

        assert.strictEqual(valuedDescription.pickups.length, 2);

        assert.equal(valuedDescription.pickups[0].modelId, 1225);
        assert.equal(valuedDescription.pickups[0].type, 14);
        assert.equal(valuedDescription.pickups[0].respawnTime, -1);
        assert.instanceOf(valuedDescription.pickups[0].position, Vector);
        assert.deepEqual(valuedDescription.pickups[0].position, new Vector(0, 10, 20));

        assert.equal(valuedDescription.pickups[1].respawnTime, 30);
    });

    it('is able to deal with spawn positions for a game', assert => {
        assert.throws(() => {
            new StructuredGameDescription('Game', {}, [ kGameSpawnPositions ]);
        });

        const valuedDescription = new StructuredGameDescription('Game', {
            spawnPositions: [
                { position: [  0, 10, 20 ], facingAngle: 180 },
                { position: [ 30, 40, 50 ], facingAngle: 270, vehicleModelId: 410 },
            ]
        }, [ kGameSpawnPositions ]);

        assert.strictEqual(valuedDescription.spawnPositions.length, 2);

        assert.instanceOf(valuedDescription.spawnPositions[0].position, Vector);
        assert.deepEqual(valuedDescription.spawnPositions[0].position, new Vector(0, 10, 20));
        assert.equal(valuedDescription.spawnPositions[0].facingAngle, 180);
        assert.isNull(valuedDescription.spawnPositions[0].vehicleModelId);

        assert.equal(valuedDescription.spawnPositions[1].vehicleModelId, 410);
    });
});
