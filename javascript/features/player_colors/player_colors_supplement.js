// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Color } from 'base/color.js';
import { Supplement } from 'base/supplementable.js';

import { getDefaultColorForPlayer } from 'features/player_colors/default_colors.js';
import { getLevelColorForPlayer } from 'features/player_colors/level_colors.js';

// Exposes the `Player.prototype.colors` supplement through which JavaScript code is able to access
// and change the colour information of a particular player.
export class PlayerColorsSupplement extends Supplement {
    #manager_ = null;
    #player_ = null;

    // Boolean indicating whether this player should be visible, and a weak map listing the
    // visibility overrides that have been created for this player.
    #visible_ = true;
    #visibilityOverrides_ = new WeakMap();

    // Level 3: Custom color that players can determine themselves.
    #customColor_ = null;

    // Level 4: Custom color that gangs are able to set for their members.
    #gangColor_ = null;

    // Level 5: Game color, which can be imposed by Games on the server.
    #gameColor_ = null;

    constructor(player, manager) {
        super();

        this.#manager_ = manager;
        this.#player_ = player;
    }

    // Gets the colour through which the player is currently represented on the server.
    get currentColor() { return this.#manager_.getCurrentColorForPlayer(this.#player_); }

    // Gets or sets whether this player should be visible. Making them invisible will hide both
    // their map icon and their name text for other players.
    get visible() { return this.#visible_; }
    set visible(value) {
        if (typeof value !== 'boolean')
            throw new Error(`The visibility value must be given as a boolean.`);
        
        this.#visible_ = value;
        this.#manager_.synchronizeForPlayer(this.#player_);
    }

    // Returns whether the |target| is able to see the current player. This depends on their base
    // visibility as well as the overrides that have been created.
    isVisibleForPlayer(target) {
        if (this.#visibilityOverrides_.has(target))
            return this.#visibilityOverrides_.get(target);

        return this.#visible_;
    }

    // Sets whether the |target| can see the current player. This supersedes the global visibility
    // setting for this player, even when it changes while an override is held.
    setVisibilityOverrideForPlayer(target, visible) {
        this.#visibilityOverrides_.set(target, !!visible);
        this.#manager_.synchronizeVisibilityForPlayer(this.#player_, target);
    }

    // Releases any held visibility override the current player has for the |target|.
    releaseVisibilityOverrideForPlayer(target) {
        this.#visibilityOverrides_.delete(target);
        this.#manager_.synchronizeVisibilityForPlayer(this.#player_, target);
    }

    // Gets the base color (level 1) that's determined solely based on the player's ID.
    get baseColor() { return getDefaultColorForPlayer(this.#player_); }

    // Gets the base color (level 2) that's determined solely based on the player's level.
    get levelColor() { return getLevelColorForPlayer(this.#player_); }

    // Gets or sets the custom color (level 3) that players can pick themselves. Optional.
    get customColor() { return this.#customColor_; }
    set customColor(value) {
        if (value && !(value instanceof Color))
            throw new Error(`Custom colors must be given as instances of the Color class.`);
        
        this.#customColor_ = value;
        this.#manager_.synchronizeForPlayer(this.#player_);
    }

    // Gets or sets the gang color (level 4) that gangs can pick for their members. Optional.
    get gangColor() { return this.#gangColor_; }
    set gangColor(value) {
        if (value && !(value instanceof Color))
            throw new Error(`Gang colors must be given as instances of the Color class.`);
        
        this.#gangColor_ = value;
        this.#manager_.synchronizeForPlayer(this.#player_);
    }

    // Gets or sets the game color (level 5) that can temporarily override other colors. Optional.
    get gameColor() { return this.#gameColor_; }
    set gameColor(value) {
        if (value && !(value instanceof Color))
            throw new Error(`Game colors must be given as instances of the Color class.`);
        
        this.#gameColor_ = value;
        this.#manager_.synchronizeForPlayer(this.#player_);
    }
}
