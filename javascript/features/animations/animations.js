// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { DanceAnimation } from 'features/animations/dance_animation.js';
import { Feature } from 'components/feature_manager/feature.js';
import { Menu } from 'components/menu/menu.js';
import { PlayerAnimation } from 'features/animations/player_animation.js';

import { messages } from 'features/animations/animations.messages.js';

// Configuration file that declaratively details how an animation should be executed.
const kConfigurationFile = 'data/animations.json';

// Contains a series of commands that enables players to animate themselves. The actual animations
// are defined in a JSON file for convenience, all the other code and commands are generated.
export default class Animations extends Feature {
    animations_ = null;
    announce_ = null;
    limits_ = null;
    settings_ = null;

    constructor() {
        super();

        // Shares announcements about animations being forced on other players.
        this.announce_ = this.defineDependency('announce');

        // Use of the animation commands is subject to usage limitations.
        this.limits_ = this.defineDependency('limits');

        // Certain announcement settings about animations are configurable.
        this.settings_ = this.defineDependency('settings');

        // Map from all animation command names to their PlayerAnimation instances.
        this.animations_ = new Map();

        // /animations
        server.commandManager.buildCommand('animations')
            .description('Displays an overview of the available animations.')
            .build(Animations.prototype.onAnimationsCommand.bind(this));

        // /dance [1-4] [player]?
        server.commandManager.buildCommand('dance')
            .description('Enables you to join the party and dance!')
            .parameters([
                { name: 'style', type: CommandBuilder.kTypeNumber, optional: true },
                { name: 'player', type: CommandBuilder.kTypePlayer, optional: true } ])
            .build(Animations.prototype.onDanceCommand.bind(this));

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
            this.animations_.set(animation.command, animation);

            // (2) Create a command for the given animation.
            server.commandManager.buildCommand(animation.command)
                .description(animation.description)
                .sub(CommandBuilder.kTypePlayer, 'target')
                    .description('Executes this animation for another player.')
                    .restrict(Player.LEVEL_ADMINISTRATOR)
                    .build(Animations.prototype.executeAnimation.bind(this, animation))
                .build(Animations.prototype.executeAnimation.bind(this, animation));
        }
    }

    // Called when a player wants to execute the given |animation|. Will do a variety of checks,
    // including their state and whether they're recently been in a fight.
    executeAnimation(animation, currentPlayer, targetPlayer) {
        const player = targetPlayer ?? currentPlayer;

        // Utility function to fix the pronoun in a particular message.
        const fixPronoun = message => {
            return player === currentPlayer ? String(message)
                                            : String(message).replace('you', 'they')
                                                             .replace('your', 'their');
        };

        // (1a) Animations can only be started when the player is on-foot.
        if (player.state !== Player.kStateOnFoot) {
            currentPlayer.sendMessage(fixPronoun(messages.animations_not_on_foot));
            return;
        }

        // (1b) Animations can only been started when the player hasn't recently been fighting.
        const decision = this.limits_().canAnimate(player);
        if (!decision.isApproved()) {
            currentPlayer.sendMessage(messages.animations_not_idle, {
                reason: fixPronoun(decision.toString())
            });

            return;
        }

        // (2) Execute the animation for the |player|.
        animation.execute(player);

        // (3) Unless |currentPlayer| and the |targetPlayer| are the same, be transparent.
        if (!targetPlayer || currentPlayer === targetPlayer)
            return;

        currentPlayer.sendMessage(messages.animations_executed, {
            command: animation.command,
            player: targetPlayer,
        });

        targetPlayer.sendMessage(messages.animations_executed_fyi, {
            command: animation.command,
            player: currentPlayer,
        });

        // (4) When required, announce that an animation was forced on a player.
        if (!this.settings_().getValue('abuse/announce_admin_animation'))
            return;

        this.announce_().announceToAdministrators(messages.animations_admin_notice, {
            command: animation.command,
            player: currentPlayer,
            target: targetPlayer,
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| types /animations, which will show them a dialog with all the
    // available animations on Las Venturas Playground.
    async onAnimationsCommand(player) {
        const dialog = new Menu('Animations', [
            'Command',
            'Description',
        ]);

        // (1) Populate an array with behaviour for the /dance command, which is special cased.
        const commands = [
            [
                'dance [1-4]',
                'Makes your character dance!',
                Animations.prototype.onDanceCommand.bind(this, player, /* style= */ 1)
            ]
        ];

        // (2) Add all the predefined animations to the dialog.
        for (const [ command, animation ] of this.animations_) {
            commands.push([
                command,
                animation.description,
                Animations.prototype.executeAnimation.bind(this, animation, player)
            ]);
        }

        // Sort the |commands| alphabetically. Someone will mess up our JSON file.
        commands.sort((lhs, rhs) => lhs[0].localeCompare(rhs[0]));

        for (const [ command, description, listener ] of commands)
            dialog.addItem('/' + command, description, listener);

        await dialog.displayForPlayer(player);
    }

    // Called when a player executes the "/dance" command. The |style| is optional, and a usage
    // message should be shown when omitted. The |targetPlayer| should only be available to admins.
    onDanceCommand(player, style = null, targetPlayer = null) {
        const kDanceSpecialActions = new Map([
            [ 1, Player.kSpecialActionDance1 ],
            [ 2, Player.kSpecialActionDance2 ],
            [ 3, Player.kSpecialActionDance3 ],
            [ 4, Player.kSpecialActionDance4 ],
        ]);

        // Show a usage message if the passed |style| is not valid.
        if (!kDanceSpecialActions.has(style)) {
            if (player.isAdministrator())
                player.sendMessage(messages.animations_dance_usage_admin);
            else
                player.sendMessage(messages.animations_dance_usage);
            return;
        }

        // If the |player| is not an administrator, force-remove any passed players.
        if (!player.isAdministrator())
            targetPlayer = null;

        this.executeAnimation(
            new DanceAnimation(kDanceSpecialActions.get(style)), player, targetPlayer);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('dance');
        server.commandManager.removeCommand('animations');

        for (const command of this.animations_.keys())
            server.commandManager.removeCommand(command);

        this.animations_.clear();
        this.animations_ = null;

        this.announce_ = null;
        this.limits_ = null;
        this.settings_ = null;
    }
}
