// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define MAX_SPAWN_POSITIONS 250

enum SpawnPositionData {
    Float: positionX,
    Float: positionY,
    Float: positionZ,
    Float: angle,
    interiorId
}

new g_spawnPositions[MAX_SPAWN_POSITIONS][SpawnPositionData];
new spawnPositionCount = 0;

stock AddSpawnPos(Float: spawnPosX, Float: spawnPosY, Float: spawnPosZ, Float: spawnAngle, spawnInteriorId = 0) {
    if (spawnPositionCount >= MAX_SPAWN_POSITIONS) {
        printf("[SpawnPos] WARNING: Cannot add spawn at: %f, %f, %f. Max. spawn positions limit exceeded.",
            spawnPosX, spawnPosY, spawnPosZ);
        return 0;
    }

    g_spawnPositions[spawnPositionCount][positionX] = spawnPosX;
    g_spawnPositions[spawnPositionCount][positionY] = spawnPosY;
    g_spawnPositions[spawnPositionCount][positionZ] = spawnPosZ;
    g_spawnPositions[spawnPositionCount][angle] = spawnAngle;
    g_spawnPositions[spawnPositionCount][interiorId] = spawnInteriorId;
    spawnPositionCount++;

#if BETA_TEST == 1 && Debug::EnableVisualVerbosity == 1
    CreateDynamicMapIcon(spawnPosX, spawnPosY, spawnPosZ, 35, -1, 0, -1, -1, 200);
#endif

    return 1;
}

stock SetPlayerRandomSpawnPos(playerId) {
    new randomSpawnPosition = random(spawnPositionCount);

    SetPlayerPos(playerId, g_spawnPositions[randomSpawnPosition][positionX],
        g_spawnPositions[randomSpawnPosition][positionY], g_spawnPositions[randomSpawnPosition][positionZ]);
    SetPlayerFacingAngle(playerId, g_spawnPositions[randomSpawnPosition][angle]);
    SetPlayerInterior(playerId, g_spawnPositions[randomSpawnPosition][interiorId]);
    SetPlayerVirtualWorld(playerId, World::MainWorld);

    return 1;
}

stock SavePlayerSpawnData(playerId) {
    new Float: spawnPosX, Float: spawnPosY, Float: spawnPosZ, Float: spawnAngle, spawnInteriorId;

    GetPlayerPos(playerId, spawnPosX, spawnPosY, spawnPosZ);
    GetPlayerFacingAngle(playerId, spawnAngle);
    spawnInteriorId = GetPlayerInterior(playerId);

    AddSpawnPos(spawnPosX, spawnPosY, spawnPosZ, spawnAngle, spawnInteriorId);

    new File: spawnFile, fileName[13] = "SpawnPos.txr", notice[128];
    if ((spawnFile = fopen(fileName, io_append))) {
        format(notice, sizeof(notice), "AddSpawnPos(%f, %f, %f, %f, %d);\r\n", spawnPosX, spawnPosY,
            spawnPosZ, spawnAngle, spawnInteriorId);

        fwrite(spawnFile, notice);
        fclose(spawnFile);
    }

    return 1;
}

stock InitSpawnPos() {
    AddSpawnPos(1675.272705, 1447.991333, 10.787893, 269.266143, 0);
    AddSpawnPos(1319.331298, 1252.010498, 10.820312, 355.673431, 0);
    AddSpawnPos(1679.644287, 1761.207397, 10.828730, 173.409606, 0);
    AddSpawnPos(1608.072509, 1818.844970, 10.820312, 357.025268, 0);
    AddSpawnPos(1582.040893, 1768.947753, 10.820312, 80.059234, 0);
    AddSpawnPos(1465.603515, 1895.265747, 11.460937, 270.219512, 0);
    AddSpawnPos(2031.781494, 2160.468994, 10.820312, 179.300857, 0);
    AddSpawnPos(2063.606201, 2209.664306, 10.820312, 15.903598, 0);
    AddSpawnPos(1910.226318, 2350.844726, 10.979915, 191.105514, 0);
    AddSpawnPos(2295.663574, 2468.275146, 10.820312, 93.344581, 0);
    AddSpawnPos(1663.515136, 2750.059814, 10.820312, 179.228729, 0);
    AddSpawnPos(1644.108886, 2749.604248, 10.820312, 180.795013, 0);
    AddSpawnPos(1600.998291, 2712.172119, 10.820312, 1.903411, 0);
    AddSpawnPos(1029.821166, 1848.373901, 11.468292, 83.660774, 0);
    AddSpawnPos(2556.753906, 2023.815063, 10.825762, 9.086769, 0);
    AddSpawnPos(2478.968261, 1927.325683, 10.522821, 5.013446, 0);
    AddSpawnPos(2620.452880, 1903.202880, 11.023437, 178.915191, 0);
    AddSpawnPos(2557.232421, 1869.211303, 11.023437, 272.892639, 0);
    AddSpawnPos(1958.378295, 1343.157226, 15.374607, 269.142486, 0);
    AddSpawnPos(2023.895141, 1918.461547, 12.339057, 260.689514, 0);
    AddSpawnPos(2449.092041, 1282.140747, 10.828012, 174.340469, 0);
    AddSpawnPos(1639.812133, 2724.698974, 10.820312, 0.198810, 0);
    AddSpawnPos(1719.928100, 2704.602539, 10.820312, 348.355224, 0);
    AddSpawnPos(1914.670654, 2765.742431, 10.812517, 89.832992, 0);
    AddSpawnPos(2020.691772, 2734.256103, 10.820312, 2.564298, 0);
    AddSpawnPos(2157.271728, 2797.019287, 10.820312, 168.337753, 0);
    AddSpawnPos(2387.108642, 2754.420898, 10.820312, 175.211563, 0);
    AddSpawnPos(2511.301757, 2522.634033, 10.820312, 91.624038, 0);
    AddSpawnPos(2212.352783, 2524.958496, 10.820312, 175.014999, 0);
    AddSpawnPos(2285.133300, 2452.154541, 10.820312, 88.229957, 0);
    AddSpawnPos(2316.892089, 2367.656250, 10.820312, 359.274505, 0);
    AddSpawnPos(2636.319335, 2333.397949, 10.921875, 177.972991, 0);
    AddSpawnPos(2816.735107, 2203.515625, 11.023437, 89.368957, 0);
    AddSpawnPos(2832.446044, 2399.576171, 11.062500, 162.807937, 0);
    AddSpawnPos(2846.666992, 1290.704711, 11.390625, 87.375198, 0);
    AddSpawnPos(2550.034912, 1045.755615, 13.931572, 235.299743, 0);
    AddSpawnPos(2490.522460, 928.148559, 10.827999, 55.735519, 0);
    AddSpawnPos(2029.884521, 999.349792, 10.813100, 269.467590, 0);
    AddSpawnPos(2180.507080, 1116.628540, 12.648437, 62.588356, 0);
    AddSpawnPos(2220.301025, 1286.439331, 10.820312, 89.892646, 0);
    AddSpawnPos(2313.768066, 1385.303955, 10.987514, 119.364303, 0);
    AddSpawnPos(2181.640869, 1682.999145, 11.065552, 89.700912, 0);
    AddSpawnPos(2022.200683, 1915.542968, 12.327183, 272.256256, 0);
    AddSpawnPos(2089.902343, 2062.444580, 10.820312, 269.732788, 0);
    AddSpawnPos(2570.483398, 2035.885986, 10.820312, 136.070892, 0);
    AddSpawnPos(2127.587158, 2364.285888, 10.820312, 179.460403, 0);
    AddSpawnPos(1886.602172, 2339.798095, 10.820312, 269.885833, 0);
    AddSpawnPos(1636.620483, 2252.149902, 11.062500, 27.358898, 0);
    AddSpawnPos(1466.589843, 2260.648437, 11.023437, 274.521057, 0);
    AddSpawnPos(1570.164550, 2055.814453, 10.820312, 131.846511, 0);
    AddSpawnPos(1477.166503, 2003.983764, 11.023437, 357.562805, 0);
    AddSpawnPos(1584.635620, 1800.229492, 10.828001, 0.120331, 0);
    AddSpawnPos(1701.743408, 1723.828979, 10.825574, 182.847167, 0);
    AddSpawnPos(1675.771484, 1448.843139, 10.786431, 267.721649, 0);
    AddSpawnPos(1319.229736, 1253.695678, 10.820312, 357.126007, 0);
    AddSpawnPos(1716.398437, 1307.252807, 10.827939, 263.411895, 0);
    AddSpawnPos(1653.468261, 1071.760986, 10.820312, 179.214157, 0);
    AddSpawnPos(1713.591430, 914.049072, 10.820312, 354.610626, 0);
    AddSpawnPos(1406.559326, 1077.218750, 10.929687, 181.239700, 0);
    AddSpawnPos(1490.943603, 700.243652, 10.820312, 355.475311, 0);
    AddSpawnPos(1705.102905, 746.693237, 10.820312, 91.594612, 0);
    AddSpawnPos(1902.332153, 703.285644, 10.820312, 89.471618, 0);
    AddSpawnPos(2054.463623, 665.470581, 10.820312, 359.466979, 0);
    AddSpawnPos(2220.987548, 685.294006, 11.460479, 0.382572, 0);
    AddSpawnPos(2453.983886, 706.540893, 11.468292, 89.439926, 0);
    AddSpawnPos(2663.129638, 746.349609, 14.739588, 90.116600, 0);
    AddSpawnPos(2814.524902, 971.769958, 10.750000, 174.470214, 0);
    AddSpawnPos(2637.249755, 1128.209960, 11.179687, 173.317504, 0);
    AddSpawnPos(2020.063232, 1343.167236, 10.812978, 267.228393, 0);
    AddSpawnPos(1419.398193, 1948.158325, 11.453125, 359.781494, 0);
    AddSpawnPos(1136.138916, 2072.431396, 11.062500, 141.639144, 0);
    AddSpawnPos(983.649475, 1986.294677, 11.468292, 267.929046, 0);
    AddSpawnPos(1098.312500, 2300.467285, 10.820312, 86.879104, 0);
    AddSpawnPos(1349.838378, 2575.064208, 10.820312, 0.942323, 0);
    AddSpawnPos(1433.120117, 2619.763183, 11.392614, 180.000000, 0);
    AddSpawnPos(1830.752441, 2616.000000, 10.820312, 94.727127, 0);
    AddSpawnPos(2604.138916, 2194.136230, 10.812986, 179.535629, 0);
    AddSpawnPos(2334.500976, 2190.509033, 10.818303, 267.891448, 0);
    AddSpawnPos(2506.731689, 2130.954345, 10.820312, 1.462194, 0);
    AddSpawnPos(2322.011230, 2116.649414, 10.828125, 310.355072, 0);
    AddSpawnPos(1889.005737, 2072.461669, 11.062500, 221.849990, 0);
    AddSpawnPos(1886.530273, 947.461181, 10.820312, 339.230590, 0);
    AddSpawnPos(2107.478759, 1001.560058, 11.034668, 359.739044, 0);
    AddSpawnPos(2172.555908, 1408.814697, 11.062500, 91.920883, 0);
    AddSpawnPos(2495.903076, 1405.570434, 11.132812, 175.614608, 0);
    AddSpawnPos(2481.976318, 1525.890136, 11.626489, 321.839263, 0);
    AddSpawnPos(2622.802978, 1716.891723, 11.023437, 89.948135, 0);
    AddSpawnPos(2441.149902, 2059.714111, 10.820312, 180.000000, 0);
    AddSpawnPos(2063.154785, 2471.962402, 10.820312, 175.019119, 0);
    AddSpawnPos(2445.729492, 2376.328369, 12.163512, 88.564323, 0);
    AddSpawnPos(2219.647949, 1838.794921, 10.820312, 87.327117, 0);
    AddSpawnPos(693.479675, 1953.186401, 5.539062, 180.767715, 0);
    AddSpawnPos(1171.563720, 1352.462158, 10.921875, 19.191267, 0);
    AddSpawnPos(1098.600219, 1386.900878, 10.820312, 0.945639, 0);
    AddSpawnPos(1097.698974, 1705.114135, 10.820312, 182.616897, 0);
    AddSpawnPos(1031.635742, 1025.352661, 11.000000, 309.254577, 0);
    AddSpawnPos(1527.187622, 1043.612304, 10.820312, 185.256668, 0);
    AddSpawnPos(2497.326904, 1285.076782, 10.812500, 359.805175, 0);
    AddSpawnPos(2480.153320, 1662.935546, 10.976562, 185.389953, 0);
    AddSpawnPos(1698.768310, 2082.504882, 10.820312, 271.557220, 0);
    AddSpawnPos(965.152709, 1684.009887, 8.851562, 266.984375, 0);
    AddSpawnPos(2291.005126, 2044.278442, 11.062500, 90.522262, 0);
    AddSpawnPos(2270.561279, 1518.114624, 17.223411, 193.475967, 0);
    AddSpawnPos(2441.339843, 1124.069580, 10.820312, 91.881225, 0);
    AddSpawnPos(2839.378906, 1379.909423, 10.895205, 157.849105, 0);
    AddSpawnPos(2914.924316, 2481.234130, 11.068956, 163.778793, 0);
    AddSpawnPos(2459.717041, 2547.373535, 22.078125, 90.702987, 0);
    AddSpawnPos(1960.114990, 1770.363769, 18.933877, 199.168289, 0);
    AddSpawnPos(2263.696044, 2776.988525, 10.820312, 90.181236, 0);
    AddSpawnPos(1487.720825, 2808.067138, 10.832091, 179.367874, 0);
    AddSpawnPos(1504.215209, 2365.565673, 10.820312, 358.128204, 0);
    AddSpawnPos(1307.713623, 2064.305664, 10.820312, 175.690109, 0);
}