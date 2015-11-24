// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let DriftTracker = require('features/races/drift_tracker.js');

describe('DriftTracker', it => {
  it('converts quaternions to the principal axes', assert => {
    // Converts the quaternion identified by {w, x, y, z} to the three principal axes {yaw, pitch,
    // roll}, represented as an array of degrees.
    const quaternionToTaitBryan = (w, x, y, z) =>
        DriftTracker.quaternionToTaitBryan(w, x, y, z).map(x => x * (180 / Math.PI));

    // Sample vectors of the input quaternion to the expected set axes values of {yaw, pitch, roll}.
    // These vectors are sourced from the following page:
    //
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/steps/
    //
    // Note that their terminology of {heading, attitude, bank} maps to {yaw, pitch, roll}.
    const testVectors = [
      { quaternion: [1, 0, 0, 0],            taitBryan: [0, 0, 0] },
      { quaternion: [0.7071, 0, 0.7071, 0],  taitBryan: [90, 0, 0] },
      { quaternion: [0, 0, 1, 0],            taitBryan: [180, 0, 0] },
      { quaternion: [0.7071, 0, -0.7071, 0], taitBryan: [-90, 0, 0] },

      { quaternion: [0.7071, 0, 0, 0.7071],  taitBryan: [0, 90, 0] },
      { quaternion: [0.5, 0.5, 0.5, 0.5],    taitBryan: [90, 90, 0] },
      { quaternion: [0, 0.7071, 0.7071, 0],  taitBryan: [180, 90, 0] },
      { quaternion: [0.5, -0.5, -0.5, 0.5],  taitBryan: [-90, 90, 0] },

      { quaternion: [0.7071, 0, 0, -0.7071], taitBryan: [0, -90, 0] },
      { quaternion: [0.5, -0.5, 0.5, -0.5],  taitBryan: [90, -90, 0] },
      { quaternion: [0, -0.7071, 0.7071, 0], taitBryan: [180, -90, 0] },
      { quaternion: [0.5, 0.5, -0.5, -0.5],  taitBryan: [-90, -90, 0] },

      { quaternion: [0.7071, 0.7071, 0, 0],  taitBryan: [0, 0, 90] },
      { quaternion: [0.5, 0.5, 0.5, -0.5],   taitBryan: [90, 0, 90] },
      { quaternion: [0, 0, 0.7071, -0.7071], taitBryan: [180, 0, 90] },
      { quaternion: [0.5, 0.5, -0.5, 0.5],   taitBryan: [-90, 0, 90] },

      { quaternion: [0, 1, 0, 0],            taitBryan: [0, 0, 180] },
      { quaternion: [0, 0.7071, 0, -0.7071], taitBryan: [90, 0, 180] },
      { quaternion: [0, 0, 0, 1],            taitBryan: [180, 0, 180] },
      { quaternion: [0, 0.7071, 0, 0.7071],  taitBryan: [-90, 0, 180] },

      { quaternion: [0.7071, -0.7071, 0, 0], taitBryan: [0, 0, -90] },
      { quaternion: [0.5, -0.5, 0.5, 0.5],   taitBryan: [90, 0, -90] },
      { quaternion: [0, 0, 0.7071, 0.7071],  taitBryan: [180, 0, -90] },
      { quaternion: [0.5, -0.5, -0.5, -0.5],  taitBryan: [-90, 0, -90] }
    ];

    // Run a deep comparison over the rounded actual values for each test vector.
    testVectors.forEach(vector =>
        assert.deepEqual(quaternionToTaitBryan(...vector.quaternion).map(Math.round),
                         vector.taitBryan));
  });

  it('flips angles to San Andreas coordinate system', assert => {
    // In Grand Theft Auto: San Andreas, the cardinal directions are inverted horizontally - east is
    // represented by 270 degrees, whereas west is represented by 90 degrees. Inverted angles are
    // expected to be used, but the coordinate system of quaternions doesn't match this.

    assert.equal(DriftTracker.invertGameAngle(-720), 0);

    assert.equal(DriftTracker.invertGameAngle(-360), 0);
    assert.equal(DriftTracker.invertGameAngle(-270), 270);
    assert.equal(DriftTracker.invertGameAngle(-180), 180);
    assert.equal(DriftTracker.invertGameAngle(-90), 90);

    assert.equal(DriftTracker.invertGameAngle(0), 0);

    assert.equal(DriftTracker.invertGameAngle(90), 270);
    assert.equal(DriftTracker.invertGameAngle(180), 180);
    assert.equal(DriftTracker.invertGameAngle(270), 90);
    assert.equal(DriftTracker.invertGameAngle(360), 0);

    assert.equal(DriftTracker.invertGameAngle(720), 0);
  });
});
