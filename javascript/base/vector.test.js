// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Vector', it => {
    // Asserts that all values of the vector |actual| are within |error| of vector |expected|.
    function assertVectorCloseTo(assert, actual, expected, error = 0.01) {
        assert.closeTo(actual.x, expected.x, error);
        assert.closeTo(actual.y, expected.y, error);
        assert.closeTo(actual.z, expected.z, error);
    }

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

    it('should calculate the translation of a vector by distance and angle', assert => {
        const vector = new Vector(0, 0, 0);

        assertVectorCloseTo(assert, vector.translateTo2D(10, 0), new Vector(0, 10, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 45), new Vector(7.07, 7.07, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 90), new Vector(10, 0, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 135), new Vector(7.07, -7.07, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 180), new Vector(0, -10, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 225), new Vector(-7.07, -7.07, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 270), new Vector(-10, 0, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 315), new Vector(-7.07, 7.07, 0));
        assertVectorCloseTo(assert, vector.translateTo2D(10, 360), new Vector(0, 10, 0));
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

    it('should translate the vector in a 3D space', assert => {
        const vector = new Vector(4, 8, 12);

        assertVectorCloseTo(assert, vector.translate(), new Vector(4, 8, 12));

        assertVectorCloseTo(assert, vector.translate({ x: -4 }), new Vector(0, 8, 12));
        assertVectorCloseTo(assert, vector.translate({ x:  4 }), new Vector(8, 8, 12));
        assertVectorCloseTo(assert, vector.translate({ y: -4 }), new Vector(4, 4, 12));
        assertVectorCloseTo(assert, vector.translate({ y:  4 }), new Vector(4, 12, 12));
        assertVectorCloseTo(assert, vector.translate({ z: -4 }), new Vector(4, 8, 8));
        assertVectorCloseTo(assert, vector.translate({ z:  4 }), new Vector(4, 8, 16));

        assertVectorCloseTo(assert, vector.translate({ x: 4, y: 4, z: 4 }), new Vector(8, 12, 16));
        assertVectorCloseTo(assert, vector.translate({ x: -4, y: -4, z: -4 }), new Vector(0, 4, 8));
    });

    it('should be able to tell whether vectors are close to each other', assert => {
        const vector = new Vector(4, 8, 12);

        assert.isTrue(vector.closeTo(new Vector(5, 9, 13), 5));
        assert.isFalse(vector.closeTo(new Vector(5, 9, 13), 1));
    });
});
