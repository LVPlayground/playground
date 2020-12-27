// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DecorationSet } from 'features/decorations/decoration_set.js';
import { Feature } from 'components/feature_manager/feature.js';

// Directory in which all the decorations have been written.
const kDecorationDirectory = 'data/decorations/';

// The list of decorations available on Las Venturas Playground. Don't forget to add the setting.
export const kDecorations = new Set([
    { filename: 'christmas_decorations.json', setting: 'decorations/christmas_decorations' },
    { filename: 'fantasy_island.json', setting: 'decorations/fantasy_island' },
    { filename: 'gunther.json', setting: 'decorations/gunther' },
    { filename: 'las_venturas_scrapyard.json', setting: 'decorations/las_venturas_scrapyard' },
    { filename: 'las_venturas_taxi_rank.json', setting: 'decorations/las_venturas_taxi_rank' },
    { filename: 'los_santos_winter.json', setting: 'decorations/los_santos_winter' },
    { filename: 'pilots.json', setting: 'decorations/pilots' },
    { filename: 'pirate_ship_party.json', setting: 'decorations/pirate_ship_party' },
    { filename: 'san_ferro_road_works.json', setting: 'decorations/san_ferro_road_works' },
    { filename: 'stunts_lv_airport.json', setting: 'decorations/stunts_lv_airport' },
    { filename: 'stunts_lv_south.json', setting: 'decorations/stunts_lv_south' },
    { filename: 'stunts_sf_airport.json', setting: 'decorations/stunts_sf_airport' },
    { filename: 'vip_room.json', setting: 'decorations/vip_room' },
]);

// Provides the ability to have a series of decorations available on the server. Each of the scenes
// can be enabled and disabled through the `/lvp settings` command, in case they're not always
// applicable (for example Christmas decorations).
export default class Decorations extends Feature {
    decorations_ = null;
    settings_ = null;

    constructor() {
        super();

        // Each decoration has to be configurable through `/lvp settings`.
        this.settings_ = this.defineDependency('settings');
        this.settings_.addReloadObserver(
            this, Decorations.prototype.attachSettingListeners.bind(this));

        // Immediately load all the |kDecorations| that have been defined on the server.
        this.decorations_ = new Map();

        for (const { filename, setting } of kDecorations) {
            const decoration = new DecorationSet(kDecorationDirectory + filename);
            if (this.settings_().getValue(setting))
                decoration.enable();

            this.decorations_.set(setting, decoration);
        }

        this.attachSettingListeners();
    }

    // Attaches all the change listeners for the known settings. Will have to be rebound if and when
    // the Settings feature reloads, as that makes all observers go away.
    attachSettingListeners() {
        for (const { setting } of kDecorations) {
            this.settings_().addSettingObserver(
                setting, this, Decorations.prototype.onSettingChanged.bind(this));
        }
    }

    // Called when the given |setting| has changed to the given |value|.
    onSettingChanged(setting, value) {
        const decoration = this.decorations_.get(setting);
        if (!decoration)
            return;  // this |setting| doesn't map to a known configuration, odd
        
        if (value)
            decoration.enable();
        else
            decoration.disable();
    }

    dispose() {
        this.settings_.removeReloadObserver(this);

        for (const  [ setting, decoration ] of this.decorations_) {
            this.settings_().removeSettingObserver(setting, this);
            decoration.disable();
        }
    }
}
