// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Default kernel bandwidth that points will be shifted by.
const kDefaultBandwidth = 1;

// Minimum euclidean distance between the shifted points, and points within a cluster.
const kMinimumDistance = 0.000001;
const kMinimumClusterDistance = 0.1;

// This file contains an implementation of the mean-shift clustering algorithm:
// https://en.wikipedia.org/wiki/Mean_shift
// http://courses.csail.mit.edu/6.869/handouts/PAMIMeanshift.pdf
//
// Input is an array of points, each represented as another [x, y] array. Optionally, |bandwidth|
// may be provided as well, but for most uses the default bandwidth should be sufficient. Returns
// an array with the calculated clusters based on the given |points|.
export function meanShift(points, { bandwidth = kDefaultBandwidth } = {}) {
    const shiftedPoints = points.slice();  // make a copy
    const completedPoints = new Set();  // keyed by index

    let furthestShiftDistance = 0;

    do {
        furthestShiftDistance = 0;

        for (let index = 0; index < shiftedPoints.length; ++index) {
            if (completedPoints.has(index))
                continue;  // bail out, as an optimisation
            
            const originalPoint = shiftedPoints[index];
            const shiftedPoint = shiftPoint(originalPoint, points, bandwidth);
            const shiftDistance = euclideanDistance(originalPoint, shiftedPoint);

            // Update the |furthestShiftDistance| if the |shiftDistance| is shorter.
            if (shiftDistance > furthestShiftDistance)
                furthestShiftDistance = shiftDistance;
            
            // If the |point| hasn't shifted more than |kMinimumDistance|, consider it complete.
            if (shiftDistance < kMinimumDistance)
                completedPoints.add(index);
            
            shiftedPoints[index] = shiftedPoint;
        }
    } while (furthestShiftDistance > kMinimumDistance);

    const clusters = [];

    // Now identify the clusters within the |shiftedPoints|. Do this by iterating over all the
    // points once more, then finding a reasonably nearby cluster, or create a new one.
    for (const point of shiftedPoints) {
        let closestClusterDistance = Number.MAX_VALUE;
        let closestClusterIndex = null;

        for (let index = 0; index < clusters.length; ++index) {
            const distance = minimumDistanceToCluster(point, clusters[index]);
            if (distance > kMinimumClusterDistance || distance > closestClusterDistance)
                continue;
            
            closestClusterDistance = distance;
            closestClusterIndex = index;
        }

        // If no reasonably close cluster could be found, a new one has to be created. Otherwise we
        // add the |point| to the cluster that has been identified.
        if (closestClusterIndex === null)
            clusters.push([ point ]);
        else
            clusters[closestClusterIndex].push(point);
    }

    return clusters;
}

// Implements the shift algorithm as described on Wikipedia:
// https://en.wikipedia.org/wiki/Mean_shift
//
// Will return a new point ([x, y]) based on the weighted shifts calculated by the kernel, with
// the defined bandwidth. Visits each of the given |points|.
function shiftPoint(point, points, bandwidth) {
    let shiftedX = 0;
    let shiftedY = 0;
    let scale = 0;

    for (const otherPoint of points) {
        const distance = euclideanDistance(point, otherPoint);
        const weight = gaussianKernel(distance, bandwidth);

        shiftedX += otherPoint[0] * weight;
        shiftedY += otherPoint[1] * weight;
        scale += weight;
    }

    return [ shiftedX / scale, shiftedY / scale ];
}

// Implements the gaussian kernel as described on Wikipedia:
// https://en.wikipedia.org/wiki/Mean_shift#Types_of_kernels
// https://en.wikipedia.org/wiki/Kernel_(statistics)
function gaussianKernel(distance, bandwidth) {
    return Math.exp(-(Math.pow(distance, 2) / (2 * Math.pow(bandwidth, 2))));
}

// Calculates the euclidean distance between |left| and |right|.
function euclideanDistance(left, right) {
    return Math.sqrt(Math.pow(left[0] - right[0], 2) + Math.pow(left[1] - right[1], 2));
}

// Calculates the minimum distance between the |point| and any of the members in the |cluster|.
function minimumDistanceToCluster(point, cluster) {
    let minimumDistance = Number.MAX_SAFE_INTEGER;
    for (const otherPoint of cluster) {
        const distance = euclideanDistance(point, otherPoint);
        if (distance < minimumDistance)
            minimumDistance = distance;
    }

    return minimumDistance;
}
