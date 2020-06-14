// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { Feature } from 'components/feature_manager/feature.js';
import { Menu } from 'components/menu/menu.js';
import { PlayerAnimation } from 'features/animations/player_animation.js';

// Configuration file that declaratively details how an animation should be executed.
const kConfigurationFile = 'data/animations.json';

// Contains a series of commands that enables players to animate themselves. The actual animations
// are defined in a JSON file for convenience, all the other code and commands are generated.
export default class Animations extends Feature {
    abuse_ = null;
    animations_ = null;
    announce_ = null;
    settings_ = null;

    constructor() {
        super();

        // Use of the animation commands is subject to abuse mitigations.
        this.abuse_ = this.defineDependency('abuse');

        // Shares announcements about animations being forced on other players.
        this.announce_ = this.defineDependency('announce');

        // Certain announcement settings about animations are configurable.
        this.settings_ = this.defineDependency('settings');

        // Map from all animation command names to their descriptions.
        this.animations_ = new Map();

        // /animations
        server.commandManager.buildCommand('animations')
            .build(Animations.prototype.onAnimationsCommand.bind(this));

        if (!server.isTest())
            this.loadAnimations();
    }

    // Loads the animations from the |kConfigurationFile|. Not executed for tests unless explicitly
    // requested, when the actual animations are required.
    loadAnimations() {
        const configuration = JSON.parse(readFile(kConfigurationFile));
        for (const animationConfiguration of configuration) {
            const animation = new PlayerAnimation(animationConfiguration);

            // (1) Store the animation command name in the local set.
            this.animations_.set(animation.command, animation.description);

            // (2) Create a command for the given animation.
            server.commandManager.buildCommand(animation.command)
                .sub(CommandBuilder.PLAYER_PARAMETER)
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .build(Animations.prototype.executeAnimation.bind(this, animation))
                .build(Animations.prototype.executeAnimation.bind(this, animation));
        }
    }

    // Called when a player wants to execute the given |animation|. Will do a variety of checks,
    // including their state and whether they're recently been in a fight.
    executeAnimation(animation, currentPlayer, targetPlayer) {
        const player = targetPlayer ?? currentPlayer;
        const pronoun = player === currentPlayer ? 'You' : 'They';

        // (1a) Animations can only be started when the player is on-foot.
        if (player.state !== Player.kStateOnFoot) {
            player.sendMessage(Message.ANIMATIONS_NOT_ON_FOOT, pronoun);
            return;
        }

        // (1b) Animations can only been started when the player hasn't recently been fighting.
        if (!this.abuse_().canAnimate(player).allowed) {
            player.sendMessage(Message.ANIMATIONS_NOT_IDLE, pronoun);
            return;
        }

        // (2) Execute the animation for the |player|.
        animation.execute(player);

        // (3) Unless |currentPlayer| and the |targetPlayer| are the same, be transparent.
        if (!targetPlayer || currentPlayer === targetPlayer)
            return;
        
        currentPlayer.sendMessage(
            Message.ANIMATIONS_EXECUTED, animation.command, targetPlayer.name, targetPlayer.id);

        targetPlayer.sendMessage(
            Message.ANIMATIONS_EXECUTE_BY_ADMIN, currentPlayer.name, currentPlayer.id,
            animation.command);
        
        // (4) When required, announce that an animation was forced on a player.
        if (!this.settings_().getValue('abuse/announce_admin_animation'))
            return;
        
        this.announce_().announceToAdministrators(
            Message.ANIMATIONS_ADMIN_NOTICE, currentPlayer.name, currentPlayer.id,
            animation.command, targetPlayer.name, targetPlayer.id);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| types /animations, which will show them a dialog with all the
    // available animations on Las Venturas Playground.
    async onAnimationsCommand(player) {
        const dialog = new Menu('Animations', [
            'Command',
            'Description',
        ]);

        for (const [ command, description ] of this.animations_)
            dialog.addItem('/' + command, description);
        
        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('animations');

        for (const command of this.animations_.keys())
            server.commandManager.removeCommand(command);
        
        this.animations_.clear();
        this.animations_ = null;

        this.abuse_ = null;
        this.announce_ = null;
        this.settings_ = null;
    }
}
