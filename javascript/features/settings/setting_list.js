// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Setting = require('features/settings/setting.js');

exports = [
    /** Abuse-related settings */
    new Setting('abuse', 'tp_blocker_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override teleportation restrictions?'),
    new Setting('abuse', 'tp_blocker_damage_issued_time', Setting.TYPE_NUMBER, 10000, 'Number of milliseconds to block teleportation after issuing damage.'),
    new Setting('abuse', 'tp_blocker_damage_taken_time', Setting.TYPE_NUMBER, 10000, 'Number of milliseconds to block teleportation after having taken damage.'),
    new Setting('abuse', 'tp_blocker_weapon_fire_time', Setting.TYPE_NUMBER, 10000, 'Number of milliseconds to block teleportation after firing your weapon.'),
];
