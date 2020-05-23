// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Setting from 'entities/setting.js';

// Boolean indicating whether we're currently in the month December. Months are
// zero-based in JavaScript for some reason.
const isDecember = (new Date()).getMonth() == 11;

export default [
    /** Abuse related settings */
    new Setting('abuse', 'blocker_damage_issued_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after issuing damage.'),
    new Setting('abuse', 'blocker_damage_taken_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after having taken damage.'),
    new Setting('abuse', 'blocker_weapon_fire_time', Setting.TYPE_NUMBER, 10, 'Number of seconds to block actions after firing your weapon.'),
    
    new Setting('abuse', 'detector_cleo_dmage', Setting.TYPE_BOOLEAN, false, 'Should the CLEO Dmage detector be enabled?'),
    new Setting('abuse', 'detector_cleo_dmage_sample_rate', Setting.TYPE_NUMBER, 5, 'Sample rate for the CLEO Dmage detector'),
    new Setting('abuse', 'detector_cleo_proaim', Setting.TYPE_BOOLEAN, false, 'Should the CLEO Pro-Aim detector be enabled?'),
    new Setting('abuse', 'detector_illegal_vehicle_entry', Setting.TYPE_BOOLEAN, true, 'Should the illegal vehicle entry detector be enabled?'),

    new Setting('abuse', 'spawn_vehicle_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override vehicle spawning restrictions?'),
    new Setting('abuse', 'spawn_vehicle_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between spawning two vehicles.'),

    new Setting('abuse', 'teleportation_admin_override', Setting.TYPE_BOOLEAN, true, 'Should administrators override teleportation restrictions?'),
    new Setting('abuse', 'teleportation_throttle_time', Setting.TYPE_NUMBER, 180, 'Minimum number of seconds between teleporting twice.'),

    new Setting('abuse', 'warning_report_limit', Setting.TYPE_NUMBER, 3, 'Number of types to report a specific abuse type for a player.'),

    /** Account related settings */
    new Setting('account', 'info_visibility', Setting.TYPE_BOOLEAN, true, 'Should players be able to see information about their account?'),
    new Setting('account', 'nickname_control', Setting.TYPE_BOOLEAN, true, 'Should players be able to change their nickname?'),
    new Setting('account', 'nickname_limit_days', Setting.TYPE_NUMBER, 14, 'Minimum number of days between nickname changes.'),
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

    /** Financial related settings */
    new Setting('financial', 'community_contribution_cycle_sec', Setting.TYPE_NUMBER, 300, 'How often should contributions be collected (seconds)?'),
    new Setting('financial', 'community_contribution_guest_base', Setting.TYPE_NUMBER, 300000, 'Starting at what wealth level should guests contribute?'),
    new Setting('financial', 'community_contribution_guest_pct', Setting.TYPE_NUMBER, 5, 'What percentage of cash should guests contribute?'),
    new Setting('financial', 'community_contribution_player_base', Setting.TYPE_NUMBER, 1000000, 'Starting at what wealth level should players contribute?'),
    new Setting('financial', 'community_contribution_player_pct', Setting.TYPE_NUMBER, 4, 'What percentage of cash should registered players contribute?'),
    new Setting('financial', 'community_contribution_vip_base', Setting.TYPE_NUMBER, 2500000, 'Starting at what wealth level should VIPs contribute?'),
    new Setting('financial', 'community_contribution_vip_pct', Setting.TYPE_NUMBER, 3, 'What percentage of cash should VIPs contribute?'),
    new Setting('financial', 'spawn_money', Setting.TYPE_NUMBER, 10000, 'How much money should a player get when they spawn?'),

    /** Game-related settings */
    new Setting('games', 'registration_expiration_sec', Setting.TYPE_NUMBER, 20, 'After how many seconds does a game registration expire?'),

    /** Gang-related settings */
    new Setting('gangs', 'zones_area_bonus_members', Setting.TYPE_NUMBER, 8, 'Starting at how many members will an area bonus be applied?'),
    new Setting('gangs', 'zones_area_bonus_members_pct', Setting.TYPE_NUMBER, 20, 'Area increase percentage granted for the member bonus.'),
    new Setting('gangs', 'zones_area_max_distance', Setting.TYPE_NUMBER, 100, 'Maximum distance from the mean for gang areas.'),
    new Setting('gangs', 'zones_area_min_edge_length', Setting.TYPE_NUMBER, 50, 'Minimum length of each of the areas edges (width/height).'),
    new Setting('gangs', 'zones_area_min_representation', Setting.TYPE_NUMBER, 50, 'Representation percentage required for gang areas.'),
    new Setting('gangs', 'zones_area_padding_pct', Setting.TYPE_NUMBER, 20, 'Percentage of padding applied over the strictly enclosing area.'),
    new Setting('gangs', 'zones_cluter_iterations', Setting.TYPE_NUMBER, 250, 'Number of iterations to apply when running k-means clustering.'),
    new Setting('gangs', 'zones_cluster_limit', Setting.TYPE_NUMBER, 8, 'Maximum number of clusters when running k-means clustering.'),

    /** Playground related settings */
    new Setting('playground', 'enable_beta_features', Setting.TYPE_BOOLEAN, false, 'Enables beta server functionality.'),
    new Setting('playground', 'gunther_help_interval_sec', Setting.TYPE_NUMBER, 300, 'At which interval should Gunther issue helpful /show commands?'),
    new Setting('playground', 'reaction_test_multiplication_pct', Setting.TYPE_NUMBER, 25, 'What percentage of calculation tests should be multiplication?'),
    new Setting('playground', 'reaction_test_delay_sec', Setting.TYPE_NUMBER, 270, 'Average time between reaction tests.'),
    new Setting('playground', 'reaction_test_expire_sec', Setting.TYPE_NUMBER, 300, 'After how many seconds does a reaction test expire?'),
    new Setting('playground', 'reaction_test_jitter_sec', Setting.TYPE_NUMBER, 150, 'Jitter to apply to the delay to reduce predictability.'),
    new Setting('playground', 'reaction_test_prize', Setting.TYPE_NUMBER, 5000, 'How much money will a player get for winning a reaction test?'),
    new Setting('playground', 'reaction_test_remember_delay_sec', Setting.TYPE_NUMBER, 150, 'How much delay should the remember tests wait for?'),
    new Setting('playground', 'reaction_test_remember_jitter_sec', Setting.TYPE_NUMBER, 90, 'How much jitter should be applied to the remember tests?'),

    /** Radio related settings */
    new Setting('radio', 'default_channel', Setting.TYPE_STRING, 'LVP Radio', 'Name of the default radio channel.'),
    new Setting('radio', 'enabled', Setting.TYPE_BOOLEAN, true, 'Should the radio feature be enabled?'),
    new Setting('radio', 'restricted_to_vehicles', Setting.TYPE_BOOLEAN, true, 'Should the radio feature be restricted to players in vehicles?'),
];
