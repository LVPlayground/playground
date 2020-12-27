// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RaceProgressionTracker } from 'features/races/race_progression_tracker.js';
import { Vector } from 'base/vector.js';

describe('RaceProgressionTracker', it => {
    it('should be able to keep track of race progression', assert => {
        const tracker = new RaceProgressionTracker([
            { position: new Vector( 0,  0,  0), size: 10 },
            { position: new Vector(10, 10, 10), size: 11 },
            { position: new Vector(20, 20, 20), size: 12 },
            { position: new Vector(30, 30, 30), size: 13 },
            { position: new Vector(40, 40, 40), size: 14 },
        ], /* laps= */ 2);

        // Boundary checks.
        assert.isNull(tracker.getCheckpoint(-1));
        assert.isNull(tracker.getCheckpoint(Number.MAX_SAFE_INTEGER));

        // Initial state.
        assert.equal(tracker.progress, 0);
        assert.deepEqual(tracker.getCurrentCheckpoint(), {
            final: false,
            position: new Vector(0, 0, 0),
            target: new Vector(10, 10, 10),
            size: 10,
        });

        // Split the tracker, it should advance to the second checkpoint.
        tracker.split();

        assert.equal(tracker.progress, 0.1);
        assert.deepEqual(tracker.getCurrentCheckpoint(), {
            final: false,
            position: new Vector(10, 10, 10),
            target: new Vector(20, 20, 20),
            size: 11,
        });

        // Proceed through the rest of the tracker. We hardcode the expected values in the following
        // array, then compare each split against it.
        const expected = [
            { progress: 0.2, position: 20, target: 30, size: 12 },
            { progress: 0.3, position: 30, target: 40, size: 13 },
            { progress: 0.4, position: 40, target:  0, size: 14 },
            { progress: 0.5, position:  0, target: 10, size: 10 },
            { progress: 0.6, position: 10, target: 20, size: 11 },
            { progress: 0.7, position: 20, target: 30, size: 12 },
            { progress: 0.8, position: 30, target: 40, size: 13 },
        ];

        for (const { progress, position, target, size } of expected) {
            assert.setContext(`pos=${position} / target=${target}`);

            tracker.split();

            assert.equal(tracker.progress, progress);
            assert.deepEqual(tracker.getCurrentCheckpoint(), {
                final: false,
                position: new Vector(position, position, position),
                target: new Vector(target, target, target),
                size: size,
            });
        }

        assert.setContext(null);

        // Split once more. We should now get the final checkpoint in the race.
        tracker.split();

        assert.equal(tracker.progress, 0.9);
        assert.deepEqual(tracker.getCurrentCheckpoint(), {
            final: true,
            position: new Vector(40, 40, 40),
            target: null,
            size: 14,
        });

        // Final split, after which the race will have ended as far as the tracker cares.
        tracker.split();

        assert.equal(tracker.progress, 1);
        assert.isNull(tracker.getCurrentCheckpoint());

        assert.throws(() => tracker.split());
    });
});
