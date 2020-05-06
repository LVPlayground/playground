// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlayerSetting from 'entities/player_setting.js';

export default [
    // The uncategorized setting; Prefixed with _ so i will be shown first.
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED, PlayerSetting.SUBCOMMAND.GENERAL, '_uncategorized', PlayerSetting.TYPE_BOOLEAN, true, 'These are ALL uncategorized announcements handled by the JS manager.'),    
    
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.GENERAL, 'houses', PlayerSetting.TYPE_BOOLEAN, true, 'These are ALL house announcements. Individual settings will not be considered if turned off.'),
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.HOUSES_BUY, 'houses buy', PlayerSetting.TYPE_BOOLEAN, false, 'This is the house buy command.'),
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.HOUSES_CREATED, 'houses created', PlayerSetting.TYPE_BOOLEAN, true, 'This is the house created command.'),
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.HOUSES_DELETED, 'houses deleted', PlayerSetting.TYPE_BOOLEAN, true, 'This is the house deleted command.'),
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.HOUSES_EVICTED, 'houses evicted', PlayerSetting.TYPE_BOOLEAN, true, 'This is the house evicted command.'),
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.HOUSES_SELL, 'houses sell', PlayerSetting.TYPE_BOOLEAN, false, 'This is the house sell command.'),
    new PlayerSetting(PlayerSetting.CATEGORY.ANNOUNCEMENT, PlayerSetting.ANNOUNCEMENT.HOUSES, PlayerSetting.SUBCOMMAND.HOUSES_TELEPORTED, 'houses teleported', PlayerSetting.TYPE_BOOLEAN, true, 'This is the house teleport command.')
];

