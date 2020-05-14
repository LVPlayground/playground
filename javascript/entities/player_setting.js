// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Setting from 'entities/setting.js';

// Encapsulates an individual player setting. 
// Only the actual value can be changed during run-time.
class PlayerSetting extends Setting {
    constructor(category, group, subCommand, name, type, value, description) {
        super(category, name, type, value, description);
        
        this.group_ = group;
        this.subCommand_ = subCommand;
    }
    
    get group() { return this.group_; }
    
    get subCommand() { return this.subCommand_; }

    // Gets an identifier for the setting that contains both its category and its name.
    get identifier() { 
        if(this.subCommand !== null && this.subCommand_ !== undefined) {
            return `${this.category_}/${this.group_}/${this.subCommand_}`; 
        }

        return  `${this.category_}/${this.group_}`;
    }

    clone() {
        return new PlayerSetting(this.category_, this.group_, this.subCommand_, this.name_, this.type_, this.value_, this.description_);
    }
}

// Variable types of the PlayerSettings
// They have to equal the bas class.    
PlayerSetting.TYPE_BOOLEAN = 0;
PlayerSetting.TYPE_NUMBER = 1;
PlayerSetting.TYPE_STRING = 2;

PlayerSetting.CATEGORY = { };
PlayerSetting.CATEGORY.ANNOUNCEMENT = 'announcement';
PlayerSetting.CATEGORY.GANG = 'gang';

PlayerSetting.ANNOUNCEMENT = { };
PlayerSetting.ANNOUNCEMENT.UNCATEGORIZED = 'uncategorized';
PlayerSetting.ANNOUNCEMENT.GANGS = 'gangs';
PlayerSetting.ANNOUNCEMENT.HOUSES = 'houses';

PlayerSetting.SUBCOMMAND = { };
PlayerSetting.SUBCOMMAND.GENERAL = 'general';

PlayerSetting.SUBCOMMAND.GANGS_CHANGED_SKIN = 'skin changed';

PlayerSetting.SUBCOMMAND.HOUSES_BUY = 'buy';
PlayerSetting.SUBCOMMAND.HOUSES_CREATED = 'created';
PlayerSetting.SUBCOMMAND.HOUSES_DELETED = 'deleted';
PlayerSetting.SUBCOMMAND.HOUSES_EVICTED = 'evicted';
PlayerSetting.SUBCOMMAND.HOUSES_SELL = 'sell';
PlayerSetting.SUBCOMMAND.HOUSES_TELEPORTED = 'teleported';


PlayerSetting.GANG = { };
PlayerSetting.GANG.USE_SKIN = 'use_skin';

export default PlayerSetting;
