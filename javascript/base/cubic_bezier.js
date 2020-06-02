// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Number of samples to take when constructing the curve. We want to have samples for [t=0] until
// [t=1], in equally sized increments.
const kSampleCount = 11;
const kSampleStepSize = 0.1;

// Validates the given |point|, which must be part of the curve.
function validatePoint(point) {
    if (typeof point !== 'number' || point < -1 || point > 2)
        throw new Error(`Each point on the Bézier curve must be in range of [-1, 2].`);
}

// Represents a cubic Bézier curve, with the ability to calculate the value for a given progression
// among the curve. See https://cubic-bezier.com/ for a tool to generate cubic bezier values.
export class CubicBezier {
    points_ = null;
    samples_ = null;

    constructor(x1, y1, x2, y2) {
        this.points_ = [ x1, y1, x2, y2 ];
        this.points_.forEach(validatePoint);

        this.samples_ = new Float32Array(kSampleCount);
        for (let sample = 0; sample < kSampleCount; ++sample)
            this.samples_[sample] = this.calculateBezier(sample * kSampleStepSize, x1, x2);
    }

    // Calculates the |position| on the curve, which must be in range of [0, 1]. Has a fast path for
    // curves with two linear points, will otherwise calculate the appropriate position.
    calculate(position) {
        if (typeof position !== 'number' || position < 0 || position > 1)
            throw new Error(`The position on a Bézier curve must be in range of [0, 1].`);

        if (this.points_[0] === this.points_[1] && this.points_[2] === this.points_[3])
            return position;  // linear progression
        
        if (position === 0 || position === 1)
            return position;  // boundaries
        
        const time = this.calculateTimeForPosition(position);
        return this.calculateBezier(time, this.points_[1], this.points_[3]);
    }

    // Calculates the Bézier on either axis given |t|, |p0| and |p1|.
    calculateBezier(t, p0, p1) {
        return (((1.0 - 3.0 * p1 + 3.0 * p0) * t + (3.0 * p1 - 6.0 * p0)) * t + 3.0 * p0) * t;
    }

    // Calculates d[xy]/dt on either axis given |t|, |p0| and |p1|.
    calculateSlope(t, p0, p1) {
        return 3.0 * (1.0 - 3.0 * p1 + 3.0 * p0) * t * t + 2.0 * (3.0 * p1 - 6 * p0) * t + 3.0 * p0;
    }

    // Calculates the |t| based on the given |position| ([0, 1]).
    calculateTimeForPosition(position) {
        let sampleEnd = 1;
        let time = 0;

        // (1) Calculate the |sampleStart| value based on the x-progression on the Bézier curve.
        for (; sampleEnd < kSampleCount && this.samples_[sampleEnd] <= position; ++sampleEnd)
            time += kSampleStepSize;

        let sampleStart = sampleEnd - 1;

        // (2) Amend the calculated |time| with an interpolation between the two samples. This would
        // be accurate given linear progression, but is unlikely to be accurate on other curves.
        const distribution =
            (position - time) / (this.samples_[sampleEnd] - this.samples_[sampleStart]);
        
        time = time + distribution * kSampleStepSize;

        // (3) Calculate the slope on the X-axis at the given |time|. If there is no |slope|, simply
        // return the calculated |time|, otherwise either apply a Newton-Raphson iteration or do
        // a binary subdivision to find the right |time| value.
        const slope = this.calculateSlope(time, this.points_[0], this.points_[2]);
        if (!slope)
            return time;
        
        if (slope >= 0.001) {
            for (let iteration = 0; iteration < 4; ++iteration) {
                const iterationSlope = this.calculateSlope(time, this.points_[0], this.points_[2]);
                if (!iterationSlope)
                    return time;
                
                const x = this.calculateBezier(time, this.points_[0], this.points_[2]) - position;
                time -= x / iterationSlope;
            }
        } else {
            let timeLowerBoundary = time;
            let timeUpperBoundary = time + kSampleStepSize;

            for (let iteration = 0; iteration < 10; ++iteration) {
                time = timeLowerBoundary + (timeUpperBoundary - timeLowerBoundary) / 2;
                
                const difference =
                    this.calculateBezier(time, this.points_[0], this.points_[2]) - position;
                
                difference > 0 ? timeUpperBoundary = time
                               : timeLowerBoundary = time;
                
                if (Math.abs(difference) < 0.0000001)
                    break;
            }
        }

        return time;
    }
}
