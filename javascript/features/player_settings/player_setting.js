// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Setting from 'features/settings/setting.js';

// Encapsulates an individual setting. Must be constructed with its category, name, type and default
// value. Only the actual value can be changed during run-time.
class PlayerSetting extends Setting{
    constructor(category, group, subCommand, name, type, value, description) {
        super(category, name, type, value, description);
        
        this.group_ = group;
        this.subCommand_ = subCommand;
    }
    
    get group() { return this.group_; }
    
    get subCommand() { return this.subCommand_; }

    // Gets an identifier for the setting that contains both its category and its name.
    get identifier() { return `${this.category_}/${this.group_}/${this.subCommand_}`; }
}

// Variable types of the settings that are known. Update the `/lvp settings` command display when
// adding or removing types from here as well.
PlayerSetting.TYPE_BOOLEAN = 0;
PlayerSetting.TYPE_NUMBER = 1;
PlayerSetting.TYPE_STRING = 2;

PlayerSetting.CATEGORY = { };
PlayerSetting.CATEGORY.ANNOUNCEMENT = 'announcement';

PlayerSetting.ANNOUNCEMENT = { };
PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED = 'uncategorized';
PlayerSetting.ANNOUNCEMENT.HOUSES = 'houses';

PlayerSetting.SUBCOMMAND = { };
PlayerSetting.SUBCOMMAND.GENERAL = 'general';

PlayerSetting.SUBCOMMAND.HOUSES_SELL = 'sell';

//TODO (OttoRocket-LVP): Refactor (These are set twice!)
PlayerSetting.TYPE_BOOLEAN = 0;

export default PlayerSetting;
