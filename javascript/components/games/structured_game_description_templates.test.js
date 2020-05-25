// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { StructuredGameDescription } from 'components/games/structured_game_description.js';
import { Vector } from 'base/vector.js';

import { kPositionProperty, kRotationVectorProperty } from 'components/games/structured_game_description_templates.js';

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
});