// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vehicle } from 'entities/vehicle.js';

// Map of all the valid vehicle components, keyed by component Id, valued with an object that
// contains the component's name, slot and model name.
const kComponents = new Map([
    [
        1000,
        {
            name: 'Pro Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_mar_m',
        }
    ],
    [
        1001,
        {
            name: 'Win Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_bab_m',
        }
    ],
    [
        1002,
        {
            name: 'Drag Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_bar_m',
        }
    ],
    [
        1003,
        {
            name: 'Alpha Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_mab_m',
        }
    ],
    [
        1004,
        {
            name: 'Champ Scoop Hood',
            slot: Vehicle.kComponentSlotHood,
            model: 'bnt_b_sc_m',
        }
    ],
    [
        1005,
        {
            name: 'Fury Scoop Hood',
            slot: Vehicle.kComponentSlotHood,
            model: 'bnt_b_sc_l',
        }
    ],
    [
        1006,
        {
            name: 'Roof Scoop Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_b_sc_r',
        }
    ],
    [
        1007,
        {
            name: 'Right Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_b_ssk',
        }
    ],
    [
        1008,
        {
            name: '5x Nitro',
            slot: Vehicle.kComponentSlotNitro,
            model: 'nto_b_l',
        }
    ],
    [
        1009,
        {
            name: '2x Nitro',
            slot: Vehicle.kComponentSlotNitro,
            model: 'nto_b_s',
        }
    ],
    [
        1010,
        {
            name: '10x Nitro',
            slot: Vehicle.kComponentSlotNitro,
            model: 'nto_b_tw',
        }
    ],
    [
        1011,
        {
            name: 'Race Scoop Hood',
            slot: Vehicle.kComponentSlotHood,
            model: 'bnt_b_sc_p_m',
        }
    ],
    [
        1012,
        {
            name: 'Worx Scoop Hood',
            slot: Vehicle.kComponentSlotHood,
            model: 'bnt_b_sc_p_l',
        }
    ],
    [
        1013,
        {
            name: 'Round Fog Lamps',
            slot: Vehicle.kComponentSlotLights,
            model: 'lgt_b_rspt',
        }
    ],
    [
        1014,
        {
            name: 'Champ Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_bar_l',
        }
    ],
    [
        1015,
        {
            name: 'Race Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_bbr_l',
        }
    ],
    [
        1016,
        {
            name: 'Worx Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_bbr_m',
        }
    ],
    [
        1017,
        {
            name: 'Left Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_b_ssk',
        }
    ],
    [
        1018,
        {
            name: 'Upswept Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_b_ts',
        }
    ],
    [
        1019,
        {
            name: 'Twin Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_b_t',
        }
    ],
    [
        1020,
        {
            name: 'Large Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_b_l',
        }
    ],
    [
        1021,
        {
            name: 'Medium Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_b_m',
        }
    ],
    [
        1022,
        {
            name: 'Small Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_b_s',
        }
    ],
    [
        1023,
        {
            name: 'Fury Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_b_bbb_m',
        }
    ],
    [
        1024,
        {
            name: 'Square Fog Lamps',
            slot: Vehicle.kComponentSlotLights,
            model: 'lgt_b_sspt',
        }
    ],
    [
        1025,
        {
            name: 'Offroad Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_or1',
        }
    ],
    [
        1026,
        {
            name: 'Right Alien Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_a_s',
        }
    ],
    [
        1027,
        {
            name: 'Left Alien Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_a_s',
        }
    ],
    [
        1028,
        {
            name: 'Alien Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_a_s',
        }
    ],
    [
        1029,
        {
            name: 'X-Flow Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_c_s',
        }
    ],
    [
        1030,
        {
            name: 'Left X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_c_s',
        }
    ],
    [
        1031,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_c_s',
        }
    ],
    [
        1032,
        {
            name: 'Alien Vent Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_a_s',
        }
    ],
    [
        1033,
        {
            name: 'X-Flow Vent Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_c_s',
        }
    ],
    [
        1034,
        {
            name: 'Alien Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_a_l',
        }
    ],
    [
        1035,
        {
            name: 'X-Flow Vent Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_c_l',
        }
    ],
    [
        1036,
        {
            name: 'Right Alien Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_a_l',
        }
    ],
    [
        1037,
        {
            name: 'X-Flow Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_c_l',
        }
    ],
    [
        1038,
        {
            name: 'Alien Vent Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_a_l',
        }
    ],
    [
        1039,
        {
            name: 'Left X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_l_c_l',
        }
    ],
    [
        1040,
        {
            name: 'Left Alien Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_a_l',
        }
    ],
    [
        1041,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_r_c_l',
        }
    ],
    [
        1042,
        {
            name: 'Right Chrome Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_br1',
        }
    ],
    [
        1043,
        {
            name: 'Slamin Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_br2',
        }
    ],
    [
        1044,
        {
            name: 'Chrome Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_br1',
        }
    ],
    [
        1045,
        {
            name: 'X-Flow Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_c_f',
        }
    ],
    [
        1046,
        {
            name: 'Alien Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_a_f',
        }
    ],
    [
        1047,
        {
            name: 'Right Alien Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_a_f',
        }
    ],
    [
        1048,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_c_f',
        }
    ],
    [
        1049,
        {
            name: 'Alien Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_a_f_r',
        }
    ],
    [
        1050,
        {
            name: 'X-Flow Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_c_f_r',
        }
    ],
    [
        1051,
        {
            name: 'Left Alien Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_a_f',
        }
    ],
    [
        1052,
        {
            name: 'Left X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_c_f',
        }
    ],
    [
        1053,
        {
            name: 'X-Flow Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_c_f',
        }
    ],
    [
        1054,
        {
            name: 'Alien Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_a_f',
        }
    ],
    [
        1055,
        {
            name: 'Alien Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_a_st',
        }
    ],
    [
        1056,
        {
            name: 'Right Alien Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_a_st',
        }
    ],
    [
        1057,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_c_st',
        }
    ],
    [
        1058,
        {
            name: 'Alien Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_a_st_r',
        }
    ],
    [
        1059,
        {
            name: 'X-Flow Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_c_st',
        }
    ],
    [
        1060,
        {
            name: 'X-Flow Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_c_st_r',
        }
    ],
    [
        1061,
        {
            name: 'X-Flow Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_c_st',
        }
    ],
    [
        1062,
        {
            name: 'Left Alien Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_a_st',
        }
    ],
    [
        1063,
        {
            name: 'Left X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_c_st',
        }
    ],
    [
        1064,
        {
            name: 'Alien Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_a_st',
        }
    ],
    [
        1065,
        {
            name: 'Alien Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_a_j',
        }
    ],
    [
        1066,
        {
            name: 'X-Flow Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_c_j',
        }
    ],
    [
        1067,
        {
            name: 'Alien Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_a_j',
        }
    ],
    [
        1068,
        {
            name: 'X-Flow Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_c_j',
        }
    ],
    [
        1069,
        {
            name: 'Right Alien Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_a_j',
        }
    ],
    [
        1070,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_c_j',
        }
    ],
    [
        1071,
        {
            name: 'Left Alien Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_a_j',
        }
    ],
    [
        1072,
        {
            name: 'Left X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_c_j',
        }
    ],
    [
        1073,
        {
            name: 'Shadow Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_sr6',
        }
    ],
    [
        1074,
        {
            name: 'Mega Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_sr3',
        }
    ],
    [
        1075,
        {
            name: 'Rimshine Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_sr2',
        }
    ],
    [
        1076,
        {
            name: 'Wires Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_lr4',
        }
    ],
    [
        1077,
        {
            name: 'Classic Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_lr1',
        }
    ],
    [
        1078,
        {
            name: 'Twist Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_lr3',
        }
    ],
    [
        1079,
        {
            name: 'Cutter Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_sr1',
        }
    ],
    [
        1080,
        {
            name: 'Switch Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_sr5',
        }
    ],
    [
        1081,
        {
            name: 'Grove Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_sr4',
        }
    ],
    [
        1082,
        {
            name: 'Import Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_gn1',
        }
    ],
    [
        1083,
        {
            name: 'Dollar Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_lr2',
        }
    ],
    [
        1084,
        {
            name: 'Trance Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_lr5',
        }
    ],
    [
        1085,
        {
            name: 'Atomic Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_gn2',
        }
    ],
    [
        1086,
        {
            name: 'Stereo Stereo',
            slot: Vehicle.kComponentSlotStereo,
            model: 'stereo',
        }
    ],
    [
        1087,
        {
            name: 'Hydraulics Hydraulics',
            slot: Vehicle.kComponentSlotHydraulics,
            model: 'hydralics',
        }
    ],
    [
        1088,
        {
            name: 'Alien Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_a_u',
        }
    ],
    [
        1089,
        {
            name: 'X-Flow Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_c_u',
        }
    ],
    [
        1090,
        {
            name: 'Right Alien Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_a_u',
        }
    ],
    [
        1091,
        {
            name: 'X-Flow Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_c_u',
        }
    ],
    [
        1092,
        {
            name: 'Alien Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_a_u',
        }
    ],
    [
        1093,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_c_u',
        }
    ],
    [
        1094,
        {
            name: 'Left Alien Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_a_u',
        }
    ],
    [
        1095,
        {
            name: 'Right X-Flow Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_r_c_u',
        }
    ],
    [
        1096,
        {
            name: 'Ahab Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_gn3',
        }
    ],
    [
        1097,
        {
            name: 'Virtual Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_gn4',
        }
    ],
    [
        1098,
        {
            name: 'Access Wheels',
            slot: Vehicle.kComponentSlotWheels,
            model: 'wheel_gn5',
        }
    ],
    [
        1099,
        {
            name: 'Left Chrome Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_br1',
        }
    ],
    [
        1100,
        {
            name: 'Chrome Grill Bullbar',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'misc_c_lr_rem1',
        }
    ],
    [
        1101,
        {
            name: 'Left "Chrome Flames" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_rem1',
        }
    ],
    [
        1102,
        {
            name: 'Left "Chrome Strip" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_sv',
        }
    ],
    [
        1103,
        {
            name: 'Covertible Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_lr_bl2',
        }
    ],
    [
        1104,
        {
            name: 'Chrome Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_bl1',
        }
    ],
    [
        1105,
        {
            name: 'Slamin Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_bl2',
        }
    ],
    [
        1106,
        {
            name: 'Right "Chrome Arches" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_rem2',
        }
    ],
    [
        1107,
        {
            name: 'Left "Chrome Strip" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_bl1',
        }
    ],
    [
        1108,
        {
            name: 'Right "Chrome Strip" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_bl1',
        }
    ],
    [
        1109,
        {
            name: 'Chrome Rear Bullbars',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'bbb_lr_slv1',
        }
    ],
    [
        1110,
        {
            name: 'Slamin Rear Bullbars',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'bbb_lr_slv2',
        }
    ],
    [
        1111,
        {
            name: 'Front Sign',
            slot: Vehicle.kComponentSlotHood,
            model: 'bnt_lr_slv1',
        }
    ],
    [
        1112,
        {
            name: 'Little Sign',
            slot: Vehicle.kComponentSlotHood,
            model: 'bnt_lr_slv2',
        }
    ],
    [
        1113,
        {
            name: 'Chrome Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_slv1',
        }
    ],
    [
        1114,
        {
            name: 'Slamin Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_slv2',
        }
    ],
    [
        1115,
        {
            name: 'Chrome Front Bullbars',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbb_lr_slv1',
        }
    ],
    [
        1116,
        {
            name: 'Slamin Front Bullbars',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbb_lr_slv2',
        }
    ],
    [
        1117,
        {
            name: 'Chrome Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_slv1',
        }
    ],
    [
        1118,
        {
            name: 'Right "Chrome Trim" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_slv1',
        }
    ],
    [
        1119,
        {
            name: 'Right "Wheelcovers" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_slv2',
        }
    ],
    [
        1120,
        {
            name: 'Left "Chrome Trim" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_slv1',
        }
    ],
    [
        1121,
        {
            name: 'Left "Wheelcovers" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_slv2',
        }
    ],
    [
        1122,
        {
            name: 'Right "Chrome Flames" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_rem1',
        }
    ],
    [
        1123,
        {
            name: 'Bullbar Chrome Bars',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'misc_c_lr_rem2',
        }
    ],
    [
        1124,
        {
            name: 'Left "Chrome Arches" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_rem2',
        }
    ],
    [
        1125,
        {
            name: 'Bullbar Chrome Lights',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'misc_c_lr_rem3',
        }
    ],
    [
        1126,
        {
            name: 'Chrome Exhaust Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_rem1',
        }
    ],
    [
        1127,
        {
            name: 'Slamin Exhaust Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_rem2',
        }
    ],
    [
        1128,
        {
            name: 'Vinyl Hardtop Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_lr_bl1',
        }
    ],
    [
        1129,
        {
            name: 'Chrome Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_sv1',
        }
    ],
    [
        1130,
        {
            name: 'Hardtop Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_lr_sv1',
        }
    ],
    [
        1131,
        {
            name: 'Softtop Roof',
            slot: Vehicle.kComponentSlotRoof,
            model: 'rf_lr_sv2',
        }
    ],
    [
        1132,
        {
            name: 'Slamin Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_sv2',
        }
    ],
    [
        1133,
        {
            name: 'Right "Chrome Strip" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_sv',
        }
    ],
    [
        1134,
        {
            name: 'Right "Chrome Strip" Sideskirt',
            slot: Vehicle.kComponentSlotRightSideskirt,
            model: 'wg_l_lr_t1',
        }
    ],
    [
        1135,
        {
            name: 'Slamin Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_t2',
        }
    ],
    [
        1136,
        {
            name: 'Chrome Exhaust',
            slot: Vehicle.kComponentSlotExhaust,
            model: 'exh_lr_t1',
        }
    ],
    [
        1137,
        {
            name: 'Left "Chrome Strip" Sideskirt',
            slot: Vehicle.kComponentSlotLeftSideskirt,
            model: 'wg_r_lr_t1',
        }
    ],
    [
        1138,
        {
            name: 'Alien Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_a_s_b',
        }
    ],
    [
        1139,
        {
            name: 'X-Flow Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_c_s_b',
        }
    ],
    [
        1140,
        {
            name: 'X-Flow Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_c_s',
        }
    ],
    [
        1141,
        {
            name: 'Alien Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_a_s',
        }
    ],
    [
        1142,
        {
            name: 'Left Oval Vents',
            slot: Vehicle.kComponentSlotRightVent,
            model: 'bntr_b_ov',
        }
    ],
    [
        1143,
        {
            name: 'Right Oval Vents',
            slot: Vehicle.kComponentSlotLeftVent,
            model: 'bntl_b_ov',
        }
    ],
    [
        1144,
        {
            name: 'Left Square Vents',
            slot: Vehicle.kComponentSlotRightVent,
            model: 'bntr_b_sq',
        }
    ],
    [
        1145,
        {
            name: 'Right Square Vents',
            slot: Vehicle.kComponentSlotLeftVent,
            model: 'bntl_b_sq',
        }
    ],
    [
        1146,
        {
            name: 'X-Flow Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_c_l_b',
        }
    ],
    [
        1147,
        {
            name: 'Alien Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_a_l_b',
        }
    ],
    [
        1148,
        {
            name: 'X-Flow Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_c_l',
        }
    ],
    [
        1149,
        {
            name: 'Alien Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_a_l',
        }
    ],
    [
        1150,
        {
            name: 'Alien Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_a_f',
        }
    ],
    [
        1151,
        {
            name: 'X-Flow Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_c_f',
        }
    ],
    [
        1152,
        {
            name: 'X-Flow Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_c_f',
        }
    ],
    [
        1153,
        {
            name: 'Alien Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_a_f',
        }
    ],
    [
        1154,
        {
            name: 'Alien Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_a_st',
        }
    ],
    [
        1155,
        {
            name: 'Alien Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_a_st',
        }
    ],
    [
        1156,
        {
            name: 'X-Flow Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_c_st',
        }
    ],
    [
        1157,
        {
            name: 'X-Flow Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_c_st',
        }
    ],
    [
        1158,
        {
            name: 'X-Flow Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_c_j_b',
        }
    ],
    [
        1159,
        {
            name: 'Alien Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_a_j',
        }
    ],
    [
        1160,
        {
            name: 'Alien Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_a_j',
        }
    ],
    [
        1161,
        {
            name: 'X-Flow Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_c_j',
        }
    ],
    [
        1162,
        {
            name: 'Alien Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_a_j_b',
        }
    ],
    [
        1163,
        {
            name: 'X-Flow Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_c_u_b',
        }
    ],
    [
        1164,
        {
            name: 'Alien Spoiler',
            slot: Vehicle.kComponentSlotSpoiler,
            model: 'spl_a_u_b',
        }
    ],
    [
        1165,
        {
            name: 'X-Flow Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_c_u',
        }
    ],
    [
        1166,
        {
            name: 'Alien Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_a_u',
        }
    ],
    [
        1167,
        {
            name: 'X-Flow Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_c_u',
        }
    ],
    [
        1168,
        {
            name: 'Alien Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_a_u',
        }
    ],
    [
        1169,
        {
            name: 'Alien Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_a_s',
        }
    ],
    [
        1170,
        {
            name: 'X-Flow Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_c_s',
        }
    ],
    [
        1171,
        {
            name: 'Alien Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_a_l',
        }
    ],
    [
        1172,
        {
            name: 'X-Flow Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_c_l',
        }
    ],
    [
        1173,
        {
            name: 'X-Flow Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_c_j',
        }
    ],
    [
        1174,
        {
            name: 'Chrome Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_br1',
        }
    ],
    [
        1175,
        {
            name: 'Slamin Front Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'fbmp_lr_br2',
        }
    ],
    [
        1176,
        {
            name: 'Chrome Rear Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'rbmp_lr_br1',
        }
    ],
    [
        1177,
        {
            name: 'Slamin Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_br2',
        }
    ],
    [
        1178,
        {
            name: 'Slamin Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_rem2',
        }
    ],
    [
        1179,
        {
            name: 'Chrome Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_rem1',
        }
    ],
    [
        1180,
        {
            name: 'Chrome Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_rem1',
        }
    ],
    [
        1181,
        {
            name: 'Slamin Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_bl2',
        }
    ],
    [
        1182,
        {
            name: 'Chrome Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_bl1',
        }
    ],
    [
        1183,
        {
            name: 'Slamin Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_bl2',
        }
    ],
    [
        1184,
        {
            name: 'Chrome Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_bl1',
        }
    ],
    [
        1185,
        {
            name: 'Slamin Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_rem2',
        }
    ],
    [
        1186,
        {
            name: 'Slamin Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_sv2',
        }
    ],
    [
        1187,
        {
            name: 'Chrome Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_sv1',
        }
    ],
    [
        1188,
        {
            name: 'Slamin Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_sv2',
        }
    ],
    [
        1189,
        {
            name: 'Chrome Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_sv1',
        }
    ],
    [
        1190,
        {
            name: 'Slamin Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_t2',
        }
    ],
    [
        1191,
        {
            name: 'Chrome Front Bumper',
            slot: Vehicle.kComponentSlotFrontBumper,
            model: 'fbmp_lr_t1',
        }
    ],
    [
        1192,
        {
            name: 'Chrome Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_t1',
        }
    ],
    [
        1193,
        {
            name: 'Slamin Rear Bumper',
            slot: Vehicle.kComponentSlotRearBumper,
            model: 'rbmp_lr_t2',
        }
    ],
]);

// Map of all the valid vehicle components, keyed by vehicle model Id, valued with a set that
// contains the individual vehicle IDs. This allows for quick O(1) lookup of validity.
//
// Note that the listed modifications are known to not cause crashes or weird behaviour, not that
// they make sense. For instance, replacing the wheels on a tank probably is not very useful.
const kValidComponentsForVehicleModel = new Map([
    [
        400 /* Landstalker */,
        new Set([ 1008, 1009, 1010, 1013, 1018, 1019, 1020, 1021, 1024, 1025, 1073, 1074, 1075,
                  1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096,
                  1097, 1098 ]),
    ],
    [
        401 /* Bravura */,
        new Set([ 1001, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1013, 1017, 1019, 1020,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        402 /* Buffalo */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        403 /* Linerunner */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        404 /* Perrenial */,
        new Set([ 1000, 1002, 1007, 1008, 1009, 1010, 1013, 1016, 1017, 1019, 1020, 1021, 1025,
                  1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085,
                  1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        405 /* Sentinel */,
        new Set([ 1000, 1001, 1008, 1009, 1010, 1014, 1018, 1019, 1020, 1021, 1023, 1025, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098 ]),
    ],
    [
        406 /* Dumper */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        407 /* Firetruck */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        408 /* Trashmaster */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        409 /* Stretch */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        410 /* Manana */,
        new Set([ 1001, 1003, 1007, 1008, 1009, 1010, 1013, 1017, 1019, 1020, 1021, 1023, 1024,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        411 /* Infernus */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        412 /* Voodoo */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        413 /* Pony */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        414 /* Mule */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        415 /* Cheetah */,
        new Set([ 1001, 1003, 1007, 1008, 1009, 1010, 1017, 1018, 1019, 1023, 1025, 1073, 1074,
                  1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087,
                  1096, 1097, 1098 ]),
    ],
    [
        416 /* Ambulance */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        417 /* Leviathan */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        418 /* Moonbeam */,
        new Set([ 1002, 1006, 1008, 1009, 1010, 1016, 1020, 1021, 1025, 1073, 1074, 1075, 1076,
                  1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097,
                  1098 ]),
    ],
    [
        419 /* Esperanto */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        420 /* Taxi */,
        new Set([ 1001, 1003, 1004, 1005, 1008, 1009, 1010, 1019, 1021, 1025, 1073, 1074, 1075,
                  1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096,
                  1097, 1098 ]),
    ],
    [
        421 /* Washington */,
        new Set([ 1000, 1008, 1009, 1010, 1014, 1016, 1018, 1019, 1020, 1021, 1023, 1025, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098 ]),
    ],
    [
        422 /* Bobcat */,
        new Set([ 1007, 1008, 1009, 1010, 1013, 1017, 1019, 1020, 1021, 1025, 1073, 1074, 1075,
                  1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096,
                  1097, 1098 ]),
    ],
    [
        423 /* Mr Whoopee */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        424 /* BF Injection */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        425 /* Hunter */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        426 /* Premier */,
        new Set([ 1001, 1003, 1004, 1005, 1006, 1008, 1009, 1010, 1019, 1021, 1025, 1073, 1074,
                  1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087,
                  1096, 1097, 1098 ]),
    ],
    [
        427 /* Enforcer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        428 /* Securicar */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        429 /* Banshee */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 430 (Predator): None

    [
        431 /* Bus */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        432 /* Rhino */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        433 /* Barracks */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        434 /* Hotknife */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        435 /* Trailer 1 */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        436 /* Previon */,
        new Set([ 1001, 1003, 1006, 1007, 1008, 1009, 1010, 1013, 1017, 1019, 1020, 1021, 1022,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        437 /* Coach */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        438 /* Cabbie */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        439 /* Stallion */,
        new Set([ 1001, 1003, 1007, 1008, 1009, 1010, 1013, 1017, 1023, 1025, 1073, 1074, 1075,
                  1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096,
                  1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        440 /* Rumpo */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        441 /* RC Bandit */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        442 /* Romero */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        443 /* Packer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        444 /* Monster */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        445 /* Admiral */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 446 (Squalo): None

    [
        447 /* Seasparrow */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 448 (Pizzaboy): None
    // 449 (Tram): None

    [
        450 /* Trailer 2 */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        451 /* Turismo */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 452 (Speeder): None
    // 453 (Reefer): None
    // 454 (Tropic): None

    [
        455 /* Flatbed */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        456 /* Yankee */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        457 /* Caddy */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        458 /* Solair */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        459 /* Berkley's RC Van */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        460 /* Skimmer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 461 (PCJ-600): None
    // 462 (Faggio): None
    // 463 (Freeway): None

    [
        464 /* RC Baron */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        465 /* RC Raider */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        466 /* Glendale */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        467 /* Oceanic */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 468 (Sanchez): None

    [
        469 /* Sparrow */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        470 /* Patriot */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        471 /* Quad */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 472 (Coastguard): None
    // 473 (Dinghy): None

    [
        474 /* Hermes */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        475 /* Sabre */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        476 /* Rustler */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        477 /* ZR-350 */,
        new Set([ 1006, 1007, 1008, 1009, 1010, 1017, 1018, 1019, 1020, 1021, 1025, 1073, 1074,
                  1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087,
                  1096, 1097, 1098 ]),
    ],
    [
        478 /* Walton */,
        new Set([ 1004, 1005, 1008, 1009, 1010, 1012, 1013, 1020, 1021, 1022, 1024, 1025, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098 ]),
    ],
    [
        479 /* Regina */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        480 /* Comet */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 481 (BMX): None

    [
        482 /* Burrito */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        483 /* Camper */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 484 (Marquis): None

    [
        485 /* Baggage */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        486 /* Dozer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        487 /* Maverick */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        488 /* News Chopper */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        489 /* Rancher */,
        new Set([ 1000, 1002, 1004, 1005, 1006, 1008, 1009, 1010, 1013, 1016, 1018, 1019, 1020,
                  1024, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083,
                  1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        490 /* FBI Rancher */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        491 /* Virgo */,
        new Set([ 1003, 1007, 1008, 1009, 1010, 1014, 1017, 1018, 1019, 1020, 1021, 1023, 1025,
                  1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085,
                  1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        492 /* Greenwood */,
        new Set([ 1000, 1004, 1005, 1006, 1008, 1009, 1010, 1016, 1025, 1073, 1074, 1075, 1076,
                  1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097,
                  1098 ]),
    ],

    // 493 (Jetmax): None

    [
        494 /* Hotring */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        495 /* Sandking */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        496 /* Blista Compact */,
        new Set([ 1001, 1002, 1003, 1006, 1007, 1008, 1009, 1010, 1011, 1017, 1019, 1020, 1023,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1142, 1143 ]),
    ],
    [
        497 /* Police Maverick */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        498 /* Boxville */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        499 /* Benson */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        500 /* Mesa */,
        new Set([ 1008, 1009, 1010, 1013, 1019, 1020, 1021, 1024, 1025, 1073, 1074, 1075, 1076,
                  1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097,
                  1098 ]),
    ],
    [
        501 /* RC Goblin */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        502 /* Hotring Racer A */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        503 /* Hotring Racer B */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        504 /* Bloodring Banger */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        505 /* Rancher */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        506 /* Super GT */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        507 /* Elegant */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        508 /* Journey */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 509 (Bike): None
    // 510 (Mountain Bike): None

    [
        511 /* Beagle */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        512 /* Cropdust */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        513 /* Stunt */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        514 /* Tanker */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        515 /* Roadtrain */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        516 /* Nebula */,
        new Set([ 1000, 1002, 1004, 1007, 1008, 1009, 1010, 1015, 1016, 1017, 1018, 1019, 1020,
                  1021, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083,
                  1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        517 /* Majestic */,
        new Set([ 1002, 1003, 1007, 1008, 1009, 1010, 1016, 1017, 1018, 1019, 1020, 1023, 1025,
                  1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085,
                  1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        518 /* Buccaneer */,
        new Set([ 1001, 1003, 1005, 1006, 1007, 1008, 1009, 1010, 1013, 1017, 1018, 1020, 1023,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        519 /* Shamal */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        520 /* Hydra */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 521 (FCR-900): None
    // 522 (NRG-500): None
    // 523 (HPV1000): None

    [
        524 /* Cement Truck */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        525 /* Tow Truck */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        526 /* Fortune */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        527 /* Cadrona */,
        new Set([ 1001, 1007, 1008, 1009, 1010, 1014, 1015, 1017, 1018, 1020, 1021, 1025, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098 ]),
    ],
    [
        528 /* FBI Truck */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        529 /* Willard */,
        new Set([ 1001, 1003, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1017, 1018, 1019, 1020,
                  1023, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083,
                  1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        530 /* Forklift */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
            1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        531 /* Tractor */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
            1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        532 /* Combine */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
            1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        533 /* Feltzer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
            1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        534 /* Remington */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1100, 1101, 1106, 1122,
                  1123, 1124, 1125, 1126, 1127, 1178, 1179, 1180, 1185 ]),
    ],
    [
        535 /* Slamvan */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1109, 1110, 1113, 1114,
                  1115, 1116, 1117, 1118, 1119, 1120, 1121 ]),
    ],
    [
        536 /* Blade */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1103, 1104, 1105, 1107,
                  1108, 1128, 1181, 1182, 1183, 1184 ]),
    ],

    // 537 (Freight): None
    // 538 (Streak): None

    [
        539 /* Vortex */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        540 /* Vincent */,
        new Set([ 1001, 1004, 1006, 1007, 1008, 1009, 1010, 1017, 1018, 1019, 1020, 1023, 1024,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        541 /* Bullet */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        542 /* Clover */,
        new Set([ 1008, 1009, 1010, 1014, 1015, 1018, 1019, 1020, 1021, 1025, 1073, 1074, 1075,
                  1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096,
                  1097, 1098, 1144, 1145 ]),
    ],
    [
        543 /* Sadler */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        544 /* Firetruck LA */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        545 /* Hustler */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        546 /* Intruder */,
        new Set([ 1001, 1002, 1004, 1006, 1007, 1008, 1009, 1010, 1017, 1018, 1019, 1023, 1024,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        547 /* Primo */,
        new Set([ 1000, 1003, 1008, 1009, 1010, 1016, 1018, 1019, 1020, 1021, 1025, 1073, 1074,
                  1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087,
                  1096, 1097, 1098, 1142, 1143 ]),
    ],
    [
        548 /* Cargobob */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        549 /* Tampa */,
        new Set([ 1001, 1003, 1007, 1008, 1009, 1010, 1011, 1012, 1017, 1018, 1019, 1020, 1023,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        550 /* Sunrise */,
        new Set([ 1001, 1003, 1004, 1005, 1006, 1008, 1009, 1010, 1018, 1019, 1020, 1023, 1025,
                  1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085,
                  1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        551 /* Merit */,
        new Set([ 1002, 1003, 1005, 1006, 1008, 1009, 1010, 1016, 1018, 1019, 1020, 1021, 1023,
                  1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        552 /* Utility */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        553 /* Nevada */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        554 /* Yosemite */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        555 /* Windsor */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        556 /* Monster A */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        557 /* Monster B */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        558 /* Uranus */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1088, 1089, 1090, 1091, 1092, 1093, 1094,
                  1095, 1096, 1097, 1098, 1163, 1164, 1165, 1166, 1167, 1168 ]),
    ],
    [
        559 /* Jester */,
        new Set([ 1008, 1009, 1010, 1025, 1065, 1066, 1067, 1068, 1069, 1070, 1071, 1072, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098, 1158, 1159, 1160, 1161, 1162, 1173 ]),
    ],
    [
        560 /* Sultan */,
        new Set([ 1008, 1009, 1010, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1033, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098, 1138, 1139, 1140, 1141, 1169, 1170 ]),
    ],
    [
        561 /* Stratum */,
        new Set([ 1008, 1009, 1010, 1025, 1026, 1027, 1030, 1031, 1055, 1056, 1057, 1058, 1059,
                  1060, 1061, 1062, 1063, 1064, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080,
                  1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1154, 1155, 1156,
                  1157 ]),
    ],
    [
        562 /* Elegy */,
        new Set([ 1008, 1009, 1010, 1025, 1034, 1035, 1036, 1037, 1038, 1039, 1040, 1041, 1073,
                  1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086,
                  1087, 1096, 1097, 1098, 1146, 1147, 1148, 1149, 1171, 1172 ]),
    ],
    [
        563 /* Raindance */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        564 /* RC Tiger */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
            1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        565 /* Flash */,
        new Set([ 1008, 1009, 1010, 1025, 1045, 1046, 1047, 1048, 1049, 1050, 1051, 1052, 1053,
                  1054, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084,
                  1085, 1086, 1087, 1096, 1097, 1098, 1150, 1151, 1152, 1153 ]),
    ],
    [
        566 /* Tahoma */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        567 /* Savanna */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1102, 1129, 1130, 1131,
                  1132, 1133, 1186, 1187, 1188, 1189 ]),
    ],
    [
        568 /* Bandito */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 569 (Freight flat): None
    // 570 (Streak carriage): None

    [
        571 /* Kart */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        572 /* Mower */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        573 /* Duneride */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        574 /* Sweeper */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        575 /* Broadway */,
        new Set([ 1008, 1009, 1010, 1025, 1042, 1043, 1044, 1073, 1074, 1075, 1076, 1077, 1078,
                  1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1099,
                  1174, 1175, 1176, 1177 ]),
    ],
    [
        576 /* Tornado */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098, 1134, 1135, 1136, 1137,
                  1190, 1191, 1192, 1193 ]),
    ],
    [
        577 /* AT-400 */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        578 /* DFT-30 */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        579 /* Huntley */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        580 /* Stafford */,
        new Set([ 1001, 1006, 1007, 1008, 1009, 1010, 1017, 1018, 1020, 1023, 1025, 1073, 1074,
                  1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087,
                  1096, 1097, 1098 ]),
    ],

    // 581 (BF-400): None

    [
        582 /* Newsvan */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        583 /* Tug */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        584 /* Trailer 3 */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        585 /* Emperor */,
        new Set([ 1000, 1001, 1002, 1003, 1006, 1007, 1008, 1009, 1010, 1013, 1014, 1015, 1016,
                  1017, 1018, 1019, 1020, 1021, 1022, 1023, 1024, 1025, 1073, 1074, 1075, 1076,
                  1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097,
                  1098, 1142, 1143, 1144, 1145 ]),
    ],

    // 586 (Wayfarer): None

    [
        587 /* Euros */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        588 /* Hotdog */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        589 /* Club */,
        new Set([ 1000, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1013, 1016, 1017, 1018, 1020,
                  1024, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083,
                  1084, 1085, 1086, 1087, 1096, 1097, 1098, 1144, 1145 ]),
    ],

    // 590 (Freight carriage): None

    [
        591 /* Trailer 3 */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        592 /* Andromada */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        593 /* Dodo */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        594 /* RC Cam */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],

    // 595 (Launch): None

    [
        596 /* Police Car (LSPD) */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        597 /* Police Car (SFPD) */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        598 /* Police Car (LVPD) */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        599 /* Police Ranger */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        600 /* Picador */,
        new Set([ 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1013, 1017, 1018, 1020, 1022, 1025,
                  1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085,
                  1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        601 /* S.W.A.T. Van */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        602 /* Alpha */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        603 /* Phoenix */,
        new Set([ 1001, 1006, 1007, 1008, 1009, 1010, 1017, 1018, 1019, 1020, 1023, 1024, 1025,
                  1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081, 1082, 1083, 1084, 1085,
                  1086, 1087, 1096, 1097, 1098, 1142, 1143, 1144, 1145 ]),
    ],
    [
        604 /* Glendale */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        605 /* Sadler */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        606 /* Luggage Trailer A */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        607 /* Luggage Trailer B */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        608 /* Stair Trailer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        609 /* Boxville */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        610 /* Farm Plow */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ],
    [
        611 /* Utility Trailer */,
        new Set([ 1008, 1009, 1010, 1025, 1073, 1074, 1075, 1076, 1077, 1078, 1079, 1080, 1081,
                  1082, 1083, 1084, 1085, 1086, 1087, 1096, 1097, 1098 ]),
    ]
]);

// Returns whether the given |vehicleModel| can be customized with the given |componentId|.
export function canVehicleModelHaveComponent(vehicleModel, componentId) {
    const validComponents = kValidComponentsForVehicleModel.get(vehicleModel);
    if (!validComponents)
        return false;  // the |vehicleModel| cannot have any modifications
    
    return validComponents.has(componentId);
}

// Returns the name of a particular component, or NULL when it's invalid.
export function getComponentName(componentId) {
    const information = kComponents.get(componentId);
    if (!information)
        return null;  // the |componentId| is not valid
    
    return information.name;
}

// Returns the slot in which a particular component is located, or NULL when it's invalid.
export function getComponentSlot(componentId) {
    const information = kComponents.get(componentId);
    if (!information)
        return null;  // the |componentId| is not valid
    
    return information.slot;
}
