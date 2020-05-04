// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Setting from 'features/settings/setting.js';

// Boolean indicating whether we're currently in the month December. Months are
// zero-based in JavaScript for some reason.
const isDecember = (new Date()).getMonth() == 11;

export default [
    /** Abuse related settings */
    new Setting('abuse', 'blocker_damage_issued_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after issuing damage.'),
    new Setting('abuse', 'blocker_damage_taken_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after having taken damage.'),
    new Setting('abuse', 'blocker_weapon_fire_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after firing your weapon.'),
    
    new Setting('abuse', 'detector_cleo_dmage', Setting.TYPE_BOOLEAN, false, 'Should the CLEO Dmage detector be enabled?'),
    new Setting('abuse', 'detector_cleo_dmage_leniency', Setting.TYPE_BOOLEAN, true, 'Should the first CLEO Dmage detection be ignored?'),
    new Setting('abuse', 'detector_cleo_proaim', Setting.TYPE_BOOLEAN, false, 'Should the CLEO Pro-Aim detector be enabled?'),
    new Setting('abuse', 'detector_illegal_vehicle_entry', Setting.TYPE_BOOLEAN, true, 'Should the illegal vehicle entry detector be enabled?'),

    new Setting('abuse', 'spawn_vehicle_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override vehicle spawning restrictions?'),
    new Setting('abuse', 'spawn_vehicle_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between spawning two vehicles.'),

    new Setting('abuse', 'teleportation_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override teleportation restrictions?'),
    new Setting('abuse', 'teleportation_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between teleporting twice.'),

    new Setting('abuse', 'warning_report_limit', Setting.TYPE_NUMBER, 3, 'Number of types to report a specific abuse type for a player.'),

    /** Account related settings */
    new Setting('account', 'nickname_control', Setting.TYPE_BOOLEAN, true, 'Should players be able to change their nickname?'),
    new Setting('account', 'nickname_limit_days', Setting.TYPE_NUMBER, 30, 'Minimum number of days between nickname changes.'),
    new Setting('account', 'password_control', Setting.TYPE_BOOLEAN, true, 'Should players be able to change their password?'),
    new Setting('account', 'record_visibility', Setting.TYPE_BOOLEAN, true, 'Should players be able to access their record?'),
    new Setting('account', 'record_page_count', Setting.TYPE_NUMBER, 30, 'Maximum number of record entries to display per page.'),
    new Setting('account', 'session_count', Setting.TYPE_NUMBER, 30, 'Maximum number of recent sessions to display.'),
    new Setting('account', 'session_page_count', Setting.TYPE_NUMBER, 50, 'Maximum number of sessions to display per page.'),
    new Setting('account', 'session_visibility', Setting.TYPE_BOOLEAN, true, 'Should players be able to see their recent sessions?'),
    new Setting('account', 'vip_alias_control', Setting.TYPE_BOOLEAN, true, 'Should VIPs be able to manage their aliases?'),
    new Setting('account', 'vip_alias_limit_admin', Setting.TYPE_NUMBER, 5, 'Maximum number of aliases admins are able to create.'),
    new Setting('account', 'vip_alias_limit_player', Setting.TYPE_NUMBER, 2, 'Maximum number of aliases VIPs are able to create.'),
    new Setting('account', 'vip_alias_limit_days', Setting.TYPE_NUMBER, 7, 'Minimum number of days between alias additions.'),

    /** Decoration related settings */
    new Setting('decorations', 'holidays_free_vip', Setting.TYPE_BOOLEAN, false, 'Should players receive VIP rights upon logging in?'),
    new Setting('decorations', 'objects_christmas', Setting.TYPE_BOOLEAN, isDecember, 'Should the Christmas decorations be enabled?'),
    new Setting('decorations', 'objects_pirate_party', Setting.TYPE_BOOLEAN, false, 'Should the Pirate Ship Party decorations be enabled?'),
    new Setting('decorations', 'objects_vip_room', Setting.TYPE_BOOLEAN, true, 'Should the VIP room be stocked with objects?'),

    /** Radio related settings */
    new Setting('radio', 'default_channel', Setting.TYPE_STRING, 'LVP Radio', 'Name of the default radio channel.'),
    new Setting('radio', 'enabled', Setting.TYPE_BOOLEAN, true, 'Should the radio feature be enabled?'),
    new Setting('radio', 'restricted_to_vehicles', Setting.TYPE_BOOLEAN, true, 'Should the radio feature be restricted to players in vehicles?'),
];
