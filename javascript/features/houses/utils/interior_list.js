// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The list of interiors in which players are allowed to settle. DO NOT REMOVE INTERIORS FROM THIS
// LIST. Instead, mark them as unselectable. New entries should always be added at the end.
const INTERIOR_LIST = [
    {
        // House Id: 0
        name: 'Hotel Room (1)',
        selectable: true,
        value: 1,

        interior: 5,
        exits: [ { position: [ 2233.52, -1115.01, 1050.88 ], rotation: 0 } ],

        features: {
            health: [ 2233.94, -1106.03, 1050.88 ],
            armour: [ 2232.94, -1106.03, 1050.88 ],
            safe: [ 2230.75, -1108.41, 1050.88 ]
        },

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

        features: {
            health: [ 2281.87, -1133.98, 1050.90 ],
            armour: [ 2282.87, -1133.98, 1050.90 ],
            safe: [ 2285.77, -1137.62, 1050.90 ]
        },

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
        exits: [ { position: [ 2269.85, -1210.62, 1047.56 ], rotation: 90 } ],

        features: {
            health: [ 2257.32, -1213.54, 1049.02 ],
            armour: [ 2256.32, -1213.54, 1049.02 ],
            safe: [ 2256.41, -1207.54, 1049.02 ]
        },

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
        exits: [ { position: [ 2365.43, -1135.30, 1050.88 ], rotation: 0 } ],

        features: {
            health: [ 2369.05, -1135.29, 1050.88 ],
            armour: [ 2370.05, -1135.29, 1050.88 ],
            safe: [ 2373.35, -1130.89, 1050.88 ]
        },

        preview: {
            position: [ [ 2364.0825, -1135.7069, 1053.1591 ], [ 2368.4516, -1125.2832, 1052.1199 ] ],
            target: [ [ 2365.7307, -1131.1728, 1051.8454 ], [ 2365.0922, -1121.6014, 1051.7208 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 4
        name: 'Large House (1)',
        selectable: true,
        value: 5,

        interior: 3,
        exits: [ { position: [ 2495.96, -1692.80, 1014.74 ], rotation: 90 } ],

        features: {
            health: [ 2493.79, -1694.42, 1014.74 ],
            armour: [ 2492.79, -1694.42, 1014.74 ],
            safe: [ 2497.94, -1698.74, 1014.74 ]
        },

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

        features: {
            health: [ 229.57, 1024.41, 1084.01 ],
            armour: [ 230.57, 1024.41, 1084.01 ],
            safe: [ 224.48, 1028.82, 1084.01 ]
        },

        preview: {
            position: [ [ 223.7313, 1039.7102, 1085.4797 ], [ 236.5699, 1023.7124, 1085.0833 ] ],
            target: [ [ 227.8049, 1036.8125, 1085.3808 ], [ 235.9511, 1028.6695, 1084.8752 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 6
        name: 'Love Nest',
        selectable: true,
        vip: true,
        value: 7,

        interior: 3,
        exits: [ { position: [ 965.42, -53.14, 1001.12 ], rotation: 90 } ],

        features: {
            health: [ 964.06, -43.48, 1001.12 ],
            armour: [ 965.56, -43.48, 1001.12 ],
            safe: [ 964.06, -55.46, 1001.12 ]
        },

        preview: {
            position: [ [ 970.0973, -44.0323, 1002.1073 ], [ 956.8461, -49.9488, 1002.5203 ] ],
            target: [ [ 965.2565, -45.2136, 1001.6937 ], [ 959.1083, -54.3666, 1001.9163 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 7
        name: 'Hotel Room (2)',
        selectable: true,
        value: 1,

        interior: 2,
        exits: [ { position: [ 266.83, 305.09, 999.15 ], rotation: 270 } ],

        features: {
            health: [ 272.24, 307.95, 999.15 ],
            armour: [ 273.11, 307.34, 999.15 ],
            safe: [ 268.59, 308.39, 999.15 ]
        },

        preview: {
            position: [ [ 266.1524, 303.5067, 999.1154 ], [ 274.0281, 307.4882, 1000.5545 ] ],
            target: [ [ 270.6696, 305.5942, 999.6029 ], [ 269.3267, 306.1802, 999.4656 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 8
        name: 'Large House (2)',
        selectable: true,
        value: 5,

        interior: 9,
        exits: [ { position: [ 2317.87, -1026.48, 1050.22 ], rotation: 0 } ],

        features: {
            health: [ 2324.84, -1018.80, 1050.22 ],
            armour: [ 2026.34, -1018.80, 1050.22 ],
            safe: [ 2322.73, -1024.89, 1050.21 ]
        },

        preview: {
            position: [ [ 2321.0895, -1023.6378, 1051.2923 ], [ 2320.9318, -1009.3960, 1052.1678 ] ],
            target: [ [ 2325.7675, -1021.8966, 1051.0021 ], [ 2319.8088, -1014.0153, 1050.6184 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 9
        name: 'Large House (3)',
        selectable: true,
        value: 5,

        interior: 12,
        exits: [ { position: [ 2324.40, -1148.88, 1050.71 ], rotation: 0 } ],

        features: {
            health: [ 2329.96, -1143.43, 1050.49 ],
            armour: [ 2329.96, -1141.93, 1050.49 ],
            safe: [ 2329.96, -1139.28, 1050.49 ]
        },

        preview: {
            position: [ [ 2331.4084, -1147.4014, 1050.4755 ], [ 2328.6647, -1135.6943, 1054.4753 ] ],
            target: [ [ 2327.8935, -1143.8627, 1050.8269 ], [ 2325.4677, -1139.3072, 1053.1616 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 10
        name: 'Normal House (3)',
        selectable: true,
        value: 4,

        interior: 5,
        exits: [ { position: [ 226.75, 1114.29, 1081.00 ], rotation: 270 } ],

        features: {
            health: [ 238.10, 1110.36, 1081.00 ],
            armour: [ 239.60, 1110.36, 1081.00 ],
            safe: [ 247.74, 1113.61, 1080.99 ]
        },

        preview: {
            position: [ [ 226.7456, 1115.1162, 1080.9959 ], [ 247.6953, 1112.6324, 1081.7178 ] ],
            target: [ [ 231.6206, 1114.0130, 1081.1287 ], [ 243.8945, 1115.8752, 1081.5225 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 11
        name: 'Pleasure Dome',
        selectable: true,
        vip: true,
        value: 9,

        interior: 3,
        exits: [ { position: [ -2636.79, 1402.81, 906.46 ], rotation: 30 } ],

        features: {
            health: [ -2666.14, 1428.85, 906.46 ],
            armour: [ -2667.64, 1428.85, 906.46 ],
            safe: [ -2654.42, 1424.56, 906.46 ]
        },

        preview: {
            position: [ [ -2677.8393, 1420.6900, 919.7935 ], [ -2641.6391, 1405.5695, 908.1486 ] ],
            target: [ [ -2673.7119, 1418.9016, 917.6106 ], [ -2646.4299, 1406.6981, 909.0295 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 12
        name: 'Hotel Reception',
        selectable: true,
        value: 7,

        interior: 18,
        exits: [ { position: [ 1726.83, -1638.65, 20.22 ], rotation: 180 } ],

        features: {
            health: [ 1721.17, -1643.88, 20.23 ],
            armour: [ 1719.67, -1643.88, 20.23 ],
            safe: [ 1731.59, -1653.76, 20.23 ]
        },

        preview: {
            position: [ [ 1724.5875, -1654.5982, 21.0136 ], [ 1713.5572, -1671.6555, 37.3206 ] ],
            target: [ [ 1720.0672, -1656.1031, 22.5311 ], [ 1715.3537, -1667.9216, 34.5223 ] ],
            duration: 2500
        }
    },
    {
        // House Id: 13 - PRIVATE INTERIOR
        name: 'RC Playground',
        selectable: false,
        value: 1,

        interior: 10,
        exits: [ { position: [ -1131.76, 1057.83, 1346.41 ], rotation: 270 } ],

        features: {
            health: [ -1126.49, 1051.77, 1345.71 ],
            armour: [ -1126.49, 1050.27, 1345.71 ],
            safe: [ -1132.80, 1051.77, 1345.71 ]
        },

        preview: {
            position: [ [ -1135.7145, 1057.5029, 1347.5469 ], [ -981.0269, 1032.7276, 1364.8944 ] ],
            target: [ [ -1130.7149, 1057.5639, 1347.5430 ], [ -985.3702, 1034.7103, 1363.4093 ] ],
            duration: 2500
        }
    },
    {   
        // House Id: 14 - PRIVATE INTERIOR
        name: 'Mad Doggs Mansion',
        selectable: false,
        value: 1,

        interior: 5,
        exits: [ { position: [ 1260.6453, -785.2949, 1091.9063 ], rotation: 266.5846 } ],

        features: {
            health: [ 1279.7493, -810.5056, 1085.6328 ],
            armour: [ 1279.9301, -813.2347, 1085.6328 ],
            safe: [ 1263.9841, -787.3984, 1091.9063 ]
        },

        preview: {
            position: [ [ 1264.8002, -787.5640, 1091.9063 ], [ 1274.2072, -771.9368, 1091.9063 ] ],
            target: [ [ 1265.9929, -793.1546, 1084.0078 ], [ 1250.0294, -780.8049, 1084.1321 ] ],
            duration: 2500
        }
    }
];

// Compiles the interior list for a given economy and location, to make sure accurate prices can be
// shared. Various factors influence the price of a property, for instance the location of the
// house and the number of parking lots available.
class InteriorList {
    static forEconomy(player, economy, location) {
        const interiors = INTERIOR_LIST.filter((interior, index) => {
            if (!interior.selectable)
                return false;  // the |interior| is not publicly selectable

            if (interior.vip && !player.isVip())
                return false;  // the |interior| is restricted to VIPs

            interior.id = index;
            return true;
        });

        // Sort the |interiors| in ascending order by their price, then name.
        interiors.sort((lhs, rhs) => {
            if (lhs.value === rhs.value)
                return lhs.name.localeCompare(rhs.name);

            return lhs.value > rhs.value ? 1 : -1;
        });

        // Assign prices to each of the entries in the interior list based on |economy|.
        interiors.forEach((interior, interiorId) => {
            interior.price =
                economy.calculateHousePrice(location.position, location.parkingLotCount,
                                            interior.value);
        });

        return interiors;
    }

    // Returns whether the interior referred to by |interiorId| is valid.
    static isValid(interiorId) {
        return interiorId >= 0 && interiorId < INTERIOR_LIST.length;
    }

    // Returns the interior that's identified by |id|, even if it's not selectable anymore.
    static getById(interiorId) {
        if (interiorId < 0 || interiorId >= INTERIOR_LIST.length)
            throw new Error('The given Id (' + interiorId + ') does not map to a valid interior.');

        return INTERIOR_LIST[interiorId];
    }
}

export default InteriorList;
