// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ObjectRemover from 'features/player_favours/object_remover.js';

describe('ObjectRemover', (it, beforeEach, afterEach) => {
    let gunther = null;

    // The ObjectRemover instance to use for the tests. Will be reset after each test.
    let objectRemover = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        objectRemover = new ObjectRemover();
    });

    afterEach(() => objectRemover.dispose());

    it('can optimize a list of objects by using the radius cleverly', assert => {
        objectRemover.removedObjects_ = [
            { modelId: 1000, position: new Vector(1, 0, 0), radius: 0.25 },
            { modelId: 1500, position: new Vector(0, 0, 10), radius: 0.25 },
            { modelId: 1500, position: new Vector(5, 10, 5), radius: 0.25 },
            { modelId: 1500, position: new Vector(10, 0, 5), radius: 0.25 }
        ];

        const optimizedObject = objectRemover.optimize(1500);

        assert.equal(optimizedObject.modelId, 1500);
        assert.closeTo(optimizedObject.position.x, 5, 0.1);
        assert.closeTo(optimizedObject.position.y, 3.333, 0.1);
        assert.closeTo(optimizedObject.position.z, 6.667, 0.1);
        assert.closeTo(optimizedObject.radius, 6.8718, 0.1);
    });
});
