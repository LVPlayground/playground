// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { getClustersForSanAndreas } from 'features/gang_zones/clustering.js';

describe('k-means clustering', it => {
    it('should be able to identify obvious clusters', assert => {
        const points = [
            [ 1500, 1500 ],
            [ 1600, 100 ],
            [ 1520, 1490 ],
            [ 100, 210 ],
            [ 110, 200 ],
            [ 1620, 1500 ],
            [ 800, 300 ],
            [ 1900, 1810 ],
            [ 600, 510 ],
        ];

        const clusters = getClustersForSanAndreas(points);
        assert.equal(clusters.length, 3);
    });
});
