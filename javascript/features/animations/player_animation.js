// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Powers an animation that can be applied to a particular player, for the full animation config
// as has been defined in the JSON file.
export class PlayerAnimation {
    // Type of animation that's described by this instance.
    static kTypeSpecialAction = 0;

    // ---------------------------------------------------------------------------------------------

    #command_ = null;
    #description_ = null;
    #type_ = null;

    // Options for kTypeSpecialAction animations.
    #action_ = null;

    constructor(config) {
        if (!config.hasOwnProperty('command') || typeof config.command !== 'string')
            throw new Error(`All animations are required to have a "command" property.`);
        
        if (!config.hasOwnProperty('description') || typeof config.description !== 'string')
            throw new Error(`All animations are required to have a "description" property.`);
        
        if (!config.hasOwnProperty('type') || typeof config.type !== 'string')
            throw new Error(`All animations are required to have a "type" property.`);
        
        this.#command_ = config.command;
        this.#description_ = config.description;

        switch (config.type) {
            case 'special-action':
                this.initializeSpecialAction(config);
                break;
            
            default:
                throw new Error(`Invalid type for the given animation (${this}): ${config.type}.`);
        }
    }

    get command() { return this.#command_; }
    get description() { return this.#description_; }

    // ---------------------------------------------------------------------------------------------

    // Initializes |this| as a special action-based animation. That's one of the following values:
    // https://wiki.sa-mp.com/wiki/SpecialActions
    initializeSpecialAction(config) {
        if (!config.hasOwnProperty('action') || typeof config.action !== 'number')
            throw new Error(`Special action animations must have an "action" property.`);
        
        this.#type_ = PlayerAnimation.kTypeSpecialAction;
        this.#action_ = config.action;
    }

    // ---------------------------------------------------------------------------------------------

    // Executes the animation for the given |player|.
    execute(player) {
        // TODO: Preparation steps to get the player ready for the animation.

        switch (this.#type_) {
            case PlayerAnimation.kTypeSpecialAction:
                player.specialAction = this.#action_;
                break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object PlayerAnimation(${this.#command_})]`; }
}
