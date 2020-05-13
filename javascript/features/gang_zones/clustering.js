// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This is a basic implementation of a k-means clustering algorithm, optimized for 2D points in the
// world of San Andreas to remove the need for random seeding of initial means.
//
// https://en.wikipedia.org/wiki/K-means_clustering
//
// We use this function to identify clusters of houses owned by a particular gang, which is a signal
// that they have built a base there. The data identified by this algorithm should be further
// processed based on maximum distance.

// Number of iterations that the algorithm will do.
const kIterations = 250;

// Predefined clusters in the world of San Andreas. We have defined up 12 clusters here, which is
// enough to decently serve 12*12*2= 288 |points| with ideal distribution.
const kClusters = [
    [  1700,  2100 ],  // Las Venturas
    [   600, -2200 ],  // San Fierro
    [  1900,   100 ],  // Bone County
    [ -1650, -2350 ],  // Mount Chiliad
    [   200,  1400 ],  // Red County
    [  2100, -1350 ],  // Tierra Robada
    [ -1350,  -750 ],  // Flint County
    [ -1600,  2100 ],  // Los Santos
    [ -2550, -1850 ],  // Whetstone
    [ -1024,  2200 ],  // Las Colinas
    [  2350, -2450 ],  // Bayside Marina
    [  1500,  1450 ],  // Las Venturas Airport
];

// Specialization that calls `getClusters` with initial means based on likely locations in the San
// Andreas world, to avoid having to rely on randomness in the algorithms. 
export function getClustersForSanAndreas(points, { maximumClusters = null } = {}) {
    if (!maximumClusters)
        maximumClusters = Math.ceil(Math.sqrt(points.length / 2));
    
    maximumClusters = Math.min(maximumClusters, kClusters.length);

    const clusters = getClustersWithMeans(points, kClusters.slice(0, maximumClusters));
    return clusters.filter(cluster => !!cluster.points.length);
}

function getClustersWithMeans(points, means) {
    let clusters = createInitialClusters(means);

    for (let iteration = 0; iteration < kIterations; ++iteration) {
        clusters.forEach(cluster => cluster.points = []);

        populateClusters(points, clusters);
        adjustMeans(clusters);
    }

    return clusters;
}

function createInitialClusters(means) {
    const clusters = [];

    for (const mean of means)
        clusters.push({ mean, points: [] });

    return clusters;
}

function populateClusters(points, clusters) {
    for (const point of points) {
        var cluster = findClosestCluster(point, clusters);
        cluster.points.push(point);
    }
}

function findClosestCluster(point, clusters) {
    let minimumDistance = Number.MAX_SAFE_INTEGER;
    let closest = { points: [] };

    for (const cluster of clusters) {
        const distance = calculateDistance(cluster.mean, point);
        if (distance >= minimumDistance)
            continue;
        
        minimumDistance = distance;
        closest = cluster;
    }

    return closest;
}

function calculateDistance(point1, point2) {
    const sum = Math.pow(point1[0] - point2[0], 2) +
                Math.pow(point1[1] - point2[1], 2);

    return Math.sqrt(sum);
}

function adjustMeans(clusters) {
    for (const cluster of clusters) {
        cluster.mean = [
            calculateMean(cluster.points, 0),
            calculateMean(cluster.points, 1),
        ];
    }
}

function calculateMean(points, index) {
    if (!points.length)
        return 0;
    
    let sum = 0;
    for (const point of points)
        sum += point[index];

    return sum / points.length;
}
