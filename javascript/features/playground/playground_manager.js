// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import FreeVip from 'features/playground/traits/free_vip.js';
import ObjectGroup from 'entities/object_group.js';
import PirateShipParty from 'features/playground/traits/pirate_ship_party.js';

// The playground manager provides back-end logic for the features provided as part of this module.
// It controls all settings, as well as the default values for the settings.
class PlaygroundManager {
    constructor(settings) {
        this.settings_ = settings;

        this.christmasDecorations_ = null;
        this.freeVip_ = null;
        this.pirateParty_ = null;
        this.vipRoomObjects_ = null;

        // Settings that should be observed for changes. This manager implements the behaviour
        // necessary for servicing them.
        this.observable_settings_ = [
            'decorations/holidays_free_vip',
            'decorations/objects_christmas',
            'decorations/objects_pirate_party',
            'decorations/objects_vip_room',
        ];
    }

    // Called when the |enable| state of the given |setting| changes.
    toggle(setting, enable) {
        const disable = !enable;

        switch (setting) {
            case 'decorations/holidays_free_vip':
                if (enable && !this.freeVip_) {
                    this.freeVip_ = new FreeVip();
                } else if (disable && this.freeVip_) {
                    this.freeVip_.dispose();
                    this.freeVip_ = null;
                }
                break;

            case 'decorations/objects_christmas':
                if (enable && !this.christmasDecorations_) {
                    this.christmasDecorations_ =
                        ObjectGroup.create('data/objects/christmas_decorations.json',
                                           0 /* virtual world */, 0 /* interior */);
                } else if (disable && this.christmasDecorations_) {
                    this.christmasDecorations_.dispose();
                    this.christmasDecorations_ = null;
                }
                break;

            case 'decorations/objects_pirate_party':
                if (enable && !this.pirateParty_) {
                    this.pirateParty_ = new PirateShipParty();
                } else if (disable && this.pirateParty_) {
                    this.pirateParty_.dispose();
                    this.pirateParty_ = null;
                }
                break;

            case 'decorations/objects_vip_room':
                if (enable && !this.vipRoomObjects_) {
                    this.vipRoomObjects_ =
                        ObjectGroup.create('data/objects/vip_room.json',
                                           0 /* virtual world */, 0 /* interior */)
                } else if (disable && this.vipRoomObjects_) {
                    this.vipRoomObjects_.dispose();
                    this.vipRoomObjects_ = null;
                }
                break;

            default:
                throw new Error('Invalid setting: ' + setting);
        }
    }

    // Initializes the manager with the default values for all the settings. The enabled-by-default
    // ones will be automatically enabled.
    initialize() {
        for (let setting of this.observable_settings_) {
            if (this.settings_().getValue(setting))
                this.toggle(setting, true /* enabled */);

            this.settings_().addSettingObserver(
                setting, this, PlaygroundManager.prototype.toggle);
        }
    }

    // Cleans up the manager. Enabled settings will automatically be disabled.
    dispose() {
        for (let setting of this.observable_settings_) {
            if (this.settings_().getValue(setting))
                this.toggle(setting, false /* enabled */);

            this.settings_().removeSettingObserver(setting, this);
        }
    }
}

export default PlaygroundManager;
