// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Setting = require('features/settings/setting.js');

// Boolean indicating whether we're currently in the month December. Months are
// zero-based in JavaScript for some reason.
const isDecember = (new Date()).getMonth() == 11;

exports = [
    /** Abuse related settings */
    new Setting('abuse', 'blocker_damage_issued_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after issuing damage.'),
    new Setting('abuse', 'blocker_damage_taken_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after having taken damage.'),
    new Setting('abuse', 'blocker_weapon_fire_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after firing your weapon.'),

    new Setting('abuse', 'spawn_vehicle_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override vehicle spawning restrictions?'),
    new Setting('abuse', 'spawn_vehicle_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between spawning two vehicles.'),

    new Setting('abuse', 'teleportation_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override teleportation restrictions?'),
    new Setting('abuse', 'teleportation_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between teleporting twice.'),

    new Setting('abuse', 'warning_report_limit', Setting.TYPE_NUMBER, 3, 'Number of types to report a specific abuse type for a player.'),

    /** Decoration related settings */
    new Setting('decorations', 'objects_christmas', Setting.TYPE_BOOLEAN, isDecember, 'Should the Christmas decorations be enabled?'),
    new Setting('decorations', 'objects_pirate_party', Setting.TYPE_BOOLEAN, false, 'Should the Pirate Ship Party decorations be enabled?'),
    new Setting('decorations', 'objects_vip_room', Setting.TYPE_BOOLEAN, true, 'Should the VIP room be stocked with objects?'),

    /** Radio related settings */
    new Setting('radio', 'default_channel', Setting.TYPE_STRING, 'LVP Radio', 'Name of the default radio channel.'),
    new Setting('radio', 'enabled', Setting.TYPE_BOOLEAN, true, 'Should the radio feature be enabled?'),
    new Setting('radio', 'restricted_to_vehicles', Setting.TYPE_BOOLEAN, true, 'Should the radio feature be restricted to players in vehicles?'),
];
