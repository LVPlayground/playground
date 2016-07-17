// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The list of interiors in which players are allowed to settle. Do not remove interiors from this
// list, rather, mark them as unselectable. New entries should always be added at the end.
const INTERIOR_LIST = [
    {
        name: 'Hashbury House',
        selectable: true,
        value: 1,

        interior: 10,
        positions: {
            entrance: [0, 0, 0],
            exit: [0, 0, 0]
        },

        preview: {
            position: [ [ 2270.5349, -1210.3503, 1048.2172 ], [ 2247.8110, -1207.0803, 1049.6375 ] ],
            target: [ [ 2265.5671, -1210.4570, 1048.7735 ], [ 2251.8227, -1210.0505, 1049.3474 ] ],
            duration: 2500
        }
    },
    {
        name: 'Johnson House',
        selectable: true,
        value: 8,

        interior: 3,
        positions: {
            entrance: [0, 0, 0],
            exit: [0, 0, 0]
        },

        preview: {
            position: [ [ 2492.1933, -1711.1480, 1015.5310 ], [ 2496.1657, -1705.1280, 1015.6870 ] ],
            target: [ [ 2496.9011, -1709.4993, 1015.1863 ], [ 2494.6542, -1700.3811, 1015.2606 ] ],
            duration: 2500
        }
    }
];

// Compiles the interior list for a given economy, to make sure accurate prices can be shared.
class InteriorList {
    static forEconomy(economy, position) {
        const interiors = INTERIOR_LIST.filter(interior => interior.selectable);

        // Sort the |interiors| in ascending order by their price, then name.
        interiors.sort((lhs, rhs) => {
            if (lhs.value === rhs.value)
                return lhs.name.localeCompare(rhs.name);

            return lhs.value > rhs.value ? 1 : -1;
        });

        // Assign prices to each of the entries in the interior list based on |economy|.
        interiors.forEach(interior =>
            interior.price = economy.calculateHousePrice(position, interior.value));

        return interiors;
    }
}

exports = InteriorList;
