// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The list of interiors in which players are allowed to settle. DO NOT REMOVE INTERIORS FROM THIS
// LIST. Instead, mark them as unselectable. New entries should always be added at the end.
const INTERIOR_LIST = [
    {
        // House Id: 0
        name: 'Tiny Apartment',
        selectable: true,
        value: 1,

        interior: 5,
        exits: [ { position: [ 2233.52, -1115.01, 1050.88 ], rotation: 0 } ],

        preview: {
            position: [ [ 2235.0402, -1115.2492, 1052.2860 ], [ 2229.1101, -1103.9874, 1052.3890 ] ],
            target: [ [ 2232.8891, -1110.8858, 1051.1312 ], [ 2233.2690, -1106.4864, 1051.1811 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 1
        name: 'Small Apartment',
        selectable: true,
        value: 2,

        interior: 11,
        exits: [ { position: [ 2282.77, -1139.98, 1050.90 ], rotation: 0 } ],

        preview: {
            position: [ [ 2280.8515, -1133.2037, 1051.7117 ], [ 2285.8142, -1139.5847, 1052.1025 ] ],
            target: [ [ 2284.5991, -1136.4450, 1051.0407 ], [ 2281.3518, -1137.4995, 1051.2423 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 2
        name: 'Normal House (1)',
        selectable: true,
        value: 3,

        interior: 10,
        exits: [ { position: [ 2269.85, -1210.62, 1047.56 ], rotation: 0 } ],

        preview: {
            position: [ [ 2270.5349, -1210.3503, 1048.2172 ], [ 2247.8110, -1207.0803, 1049.6375 ] ],
            target: [ [ 2265.5671, -1210.4570, 1048.7735 ], [ 2251.8227, -1210.0505, 1049.3474 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 3
        name: 'Normal House (2)',
        selectable: true,
        value: 4,

        interior: 8,
        exits: [ { position: [ 2365.43, -1135.30, 1050.88 ], rotation: 180 } ],

        preview: {
            position: [ [ 2364.0825, -1135.7069, 1053.1591 ], [ 2368.4516, -1125.2832, 1052.1199 ] ],
            target: [ [ 2365.7307, -1131.1728, 1051.8454 ], [ 2365.0922, -1121.6014, 1051.7208 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 4
        name: 'Large House',
        selectable: true,
        value: 5,

        interior: 3,
        exits: [ { position: [ 2495.96, -1692.80, 1014.74 ], rotation: 90 } ],

        preview: {
            position: [ [ 2492.1933, -1711.1480, 1015.5310 ], [ 2496.1657, -1705.1280, 1015.6870 ] ],
            target: [ [ 2496.9011, -1709.4993, 1015.1863 ], [ 2494.6542, -1700.3811, 1015.2606 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 5
        name: 'Mansion',
        selectable: true,
        value: 7,

        interior: 7,
        exits: [ { position: [ 225.77, 1022.14, 1084.02 ], rotation: 0 } ],

        preview: {
            position: [ [ 223.7313, 1039.7102, 1085.4797 ], [ 236.5699, 1023.7124, 1085.0833 ] ],
            target: [ [ 227.8049, 1036.8125, 1085.3808 ], [ 235.9511, 1028.6695, 1084.8752 ] ],
            duration: 2500
        }
    }
];

// Compiles the interior list for a given economy and location, to make sure accurate prices can be
// shared. Various factors influence the price of a property, for instance the location of the
// house and the number of parking lots available.
class InteriorList {
    static forEconomy(economy, location) {
        const interiors = INTERIOR_LIST.filter(interior => interior.selectable);

        // Sort the |interiors| in ascending order by their price, then name.
        interiors.sort((lhs, rhs) => {
            if (lhs.value === rhs.value)
                return lhs.name.localeCompare(rhs.name);

            return lhs.value > rhs.value ? 1 : -1;
        });

        // Assign prices to each of the entries in the interior list based on |economy|.
        interiors.forEach(interior => {
            interior.price =
                economy.calculateHousePrice(location.position, location.parkingLotCount,
                                            interior.value);
        });

        return interiors;
    }
}

exports = InteriorList;
