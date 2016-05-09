// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Vector = require('base/vector.js');

describe('Vector', it => {
    it('should reflect the values', assert => {
        let vector = new Vector(100, 200, 300);
        assert.equal(vector.x, 100);
        assert.equal(vector.y, 200);
        assert.equal(vector.z, 300);
    });

    it('should calculate the distance in a 2D space', assert => {
        const topLeft = new Vector(0, 10, 0);
        const bottomRight = new Vector(10, 0, 1000);

        assert.closeTo(topLeft.distanceTo2D(bottomRight), 14.1421, 0.01);
        assert.closeTo(bottomRight.distanceTo2D(topLeft), 14.1421, 0.01);

        assert.equal(topLeft.squaredDistanceTo2D(bottomRight), 200);
        assert.equal(bottomRight.squaredDistanceTo2D(topLeft), 200);
    });

    it('should calculate the distance in a 3D space', assert => {
        const topLeft = new Vector(0, 10, -5);
        const bottomRight = new Vector(10, 0, 15);

        assert.closeTo(topLeft.distanceTo(bottomRight), 24.4949, 0.01);
        assert.closeTo(bottomRight.distanceTo(topLeft), 24.4949, 0.01);

        assert.equal(topLeft.squaredDistanceTo(bottomRight), 600);
        assert.equal(bottomRight.squaredDistanceTo(topLeft), 600);
    });

    it('should calculate the magnitude', assert => {
        let vector = new Vector(4, 8, 12);

        // 2D magnitude: sqrt(4^2 + 8^2)
        assert.closeTo(vector.magnitude2D, 8.944, 0.001);

        // 3D magnitude: sqrt(4^2 + 8^2 + 12^2)
        assert.closeTo(vector.magnitude, 14.967, 0.001);
    });

    it('should normalize the vector', assert => {
        let vector = new Vector(4, 8, 12);

        let normalizedVector2D = vector.normalized2D;

        // 2D normalization: {x, y} / sqrt(4^2 + 8^2)
        assert.closeTo(normalizedVector2D.x, 0.447, 0.001);
        assert.closeTo(normalizedVector2D.y, 0.894, 0.001);
        assert.closeTo(normalizedVector2D.z, 0, 0.001);

        let normalizedVector = vector.normalized;

        // 3D normalization: {x, y, z} / sqrt(4^2 + 8^2 + 12^2)
        assert.closeTo(normalizedVector.x, 0.267, 0.001);
        assert.closeTo(normalizedVector.y, 0.535, 0.001);
        assert.closeTo(normalizedVector.z, 0.802, 0.001);

        let zeroVector = new Vector(0, 0, 0);

        assert.closeTo(zeroVector.normalized2D.x, 0, 0.001);
        assert.closeTo(zeroVector.normalized.x, 0, 0.001);
    });
});
