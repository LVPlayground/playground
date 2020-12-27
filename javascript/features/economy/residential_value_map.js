// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The file that acts as the data source for the residential value map.
const kDataFile = 'data/economy/residential_value.json';

// Tests the directionality between the three points. Returns >0 if the |inputPoint| is to the left
// of the line between |currentPoint| and |nextPoint|, 0 if |inputPoint| exists on that line and
// <0 if |inputPoint| is on the right-hand side of that line.
const testPointDirection = (currentPoint, nextPoint, inputPoint) => {
    return (nextPoint[0] - currentPoint[0]) * (inputPoint[1] - currentPoint[1]) -
           (inputPoint[0] - currentPoint[0]) * (nextPoint[1] - currentPoint[1]);
};

// The residential value map loads a JSON file containing several polygons, each of which has been
// assigned a value between 5 and 1. The map allows querying the value given an input position.
//
// A visualization of the residential value map can be seen on this page:
//   https://sa-mp.nl/tools/visualize-map/
//
// The page will automatically be updated when a new data file has been committed to GitHub.
export class ResidentialValueMap {
    entries_ = null;

    // Lazily initializes the residential value map. Will be done the first time a query is ran,
    // determined by the fact that |entries_| will still be set to NULL.
    lazyInitialize() {
        this.entries_ = [];

        const entries = JSON.parse(readFile(kDataFile));
        entries.forEach(entry => this.loadEntry(entry));

        // Sort the loaded areas in descending order by value.
        this.entries_.sort((lhs, rhs) => {
            if (lhs.value === rhs.value)
                return 0;

            return lhs.value > rhs.value ? -1 : 1;
        });
    }

    // Queries the loaded entries for the |position|, which must be a vector. Returns an integer
    // between 5 and 1 indicating the value of the land at that point. The search determines whether
    // the point is located within the polygon on a 2D plane, using the Winding Number algorithm.
    query(position) {
        if (!this.entries_)
            this.lazyInitialize();

        const point = [ position.x, position.y ];
        for (const entry of this.entries_) {
            if (entry.boundingBox[0] > point[0] || entry.boundingBox[2] < point[0])
                continue;  // x-coordinate is out of bounds

            if (entry.boundingBox[1] > point[1] || entry.boundingBox[3] < point[1])
                continue;  // y-coordinate is out of bounds

            let windingNumber = 0;
            for (let i = 0; i < entry.area.length - 1; ++i) {
                if (entry.area[i][1] <= point[1]) {
                    if (entry.area[i + 1][1] > point[1]) {
                        if (testPointDirection(entry.area[i], entry.area[i + 1], point) > 0)
                            ++windingNumber;
                    }
                } else {
                    if (entry.area[i + 1][1] <= point[1]) {
                        if (testPointDirection(entry.area[i], entry.area[i + 1], point) < 0)
                            --windingNumber;
                    }
                }
            }

            if (!windingNumber)
                continue;  // the point is out of bounds for the polygon

            return entry.value;
        }

        return 0;  // the |position| is not in any area
    }

    // Loads the |entry| from the data file. It must contain at least the polygon describing the
    // area and a value assigned to the area.
    loadEntry(entry) {
        if (!entry.hasOwnProperty('value') || typeof entry.value !== 'number')
            throw new Error('Each entry in ' + DataFile + ' must have a value.');

        if (!entry.hasOwnProperty('area') || !Array.isArray(entry.area) || !entry.area.length)
            throw new Error('Each entry in ' + DataFile + ' must have an area.');

        let boundingBox = [ Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER,
                            Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER ];

        entry.area.forEach(point => {
            boundingBox[0] = Math.min(boundingBox[0], point[0]);
            boundingBox[1] = Math.min(boundingBox[1], point[1]);

            boundingBox[2] = Math.max(boundingBox[2], point[0]);
            boundingBox[3] = Math.max(boundingBox[3], point[1]);
        });

        // The last entry in the area must be equal to the first one for the Winding Number
        // algorithm to work as expected.
        entry.area.push(entry.area[0]);

        this.entries_.push({
            value: entry.value,
            area: entry.area,
            boundingBox: boundingBox
        });
    }
}
