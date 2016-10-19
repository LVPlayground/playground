// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Setting = require('features/settings/setting.js');

exports = [
    /** Abuse-related settings */
    new Setting('abuse', 'blocker_damage_issued_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after issuing damage.'),
    new Setting('abuse', 'blocker_damage_taken_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after having taken damage.'),
    new Setting('abuse', 'blocker_weapon_fire_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after firing your weapon.'),

    new Setting('abuse', 'spawn_vehicle_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override vehicle spawning restrictions?'),
    new Setting('abuse', 'spawn_vehicle_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between spawning two vehicles.'),

    new Setting('abuse', 'teleportation_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override teleportation restrictions?'),
    new Setting('abuse', 'teleportation_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between teleporting twice.'),
];
