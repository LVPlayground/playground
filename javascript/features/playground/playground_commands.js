// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/commands/command_builder.js';
import { Menu } from 'components/menu/menu.js';
import { MessageBox } from 'components/dialogs/message_box.js';
import { Question } from 'components/dialogs/question.js';
import { Setting } from 'entities/setting.js';

import { alert } from 'components/dialogs/alert.js';
import { confirm } from 'components/dialogs/confirm.js';
import { format } from 'base/format.js';
import { isSafeInteger, toSafeInteger } from 'base/string_util.js';
import { messages } from 'features/playground/playground.messages.js';
import { timeDifferenceToString } from 'base/time.js';

// A series of general commands that don't fit in any particular
export class PlaygroundCommands {
    activeTrace_ = false;
    announce_ = null;
    commands_ = null;
    communication_ = null;
    nuwani_ = null;
    permissionDelegate_ = null;
    settings_ = null;

    constructor(announce, communication, nuwani, permissionDelegate, settings) {
        this.announce_ = announce;
        this.communication_ = communication;
        this.nuwani_ = nuwani;
        this.permissionDelegate_ = permissionDelegate;
        this.settings_ = settings;

        this.commands_ = new Map();

        // -----------------------------------------------------------------------------------------

        // The `/tempfix [player]` command enables the rights of a particular player to be fixed if
        // they have been granted temporary administrator rights.
        server.commandManager.buildCommand('tempfix')
            .description('Grants temporary rights to a particular player.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([ { name: 'player', type: CommandBuilder.kTypePlayer } ])
            .build(PlaygroundCommands.prototype.onTempFixCommand.bind(this));

        // The `/lvp` command offers administrators and higher a number of functions to manage the
        // server, the available commands and availability of a number of smaller features.
        server.commandManager.buildCommand('lvp')
            .description('Manages Las Venturas Playground.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('access')
                .description('Access controls for all our JavaScript commands.')
                .restrict(Player.LEVEL_ADMINISTRATOR, /* restrictTemporary= */ true)
                .build(PlaygroundCommands.prototype.onPlaygroundAccessCommand.bind(this))
            .sub('reload')
                .description('Live reload one of the JavaScript features.')
                .restrict(Player.LEVEL_MANAGEMENT)
                .sub('messages')
                    .description('Live reload the message formatting files.')
                    .build(PlaygroundCommands.prototype.onPlaygroundReloadMessagesCommand.bind(this))
                .parameters([ { name: 'feature', type: CommandBuilder.kTypeText } ])
                .build(PlaygroundCommands.prototype.onPlaygroundReloadCommand.bind(this))
            .sub('settings')
                .description(`Amend some of the server's settings.`)
                .restrict(Player.LEVEL_ADMINISTRATOR, /* restrictTemporary= */ true)
                .build(PlaygroundCommands.prototype.onPlaygroundSettingsCommand.bind(this))
            .sub('trace')
                .description(`Capture a detailed trace of the server's processing.`)
                .restrict(Player.LEVEL_MANAGEMENT)
                .parameters([ { name: 'seconds', type: CommandBuilder.kTypeNumber } ])
                .build(PlaygroundCommands.prototype.onPlayergroundTraceCommand.bind(this))
            .build(PlaygroundCommands.prototype.onPlaygroundCommand.bind(this));
    }

    // Asynchronously loads the misc commands provided by this feature. They are defined in their
    // own source files, which must be loaded asynchronously.
    async loadCommands() {
        const commandFiles = [
            'features/playground/commands/autohello.js',
            'features/playground/commands/boost.js',
            'features/playground/commands/engine.js',
            'features/playground/commands/fancy.js',
            'features/playground/commands/flap.js',
            'features/playground/commands/fly.js',
            'features/playground/commands/indicators.js',
            'features/playground/commands/jetpack.js',
            'features/playground/commands/kickflip.js',
            'features/playground/commands/lagcompmode.js',
            'features/playground/commands/player_settings.js',
            'features/playground/commands/isolate.js',
            'features/playground/commands/rampcar.js',
            'features/playground/commands/skipdamage.js',
            'features/playground/commands/slow.js',
        ];

        for (const commandFile of commandFiles) {
            const CommandImplementation = (await import(commandFile)).default;
            if (!CommandImplementation instanceof Command)
                throw new Error(filename + ' does not contain a command.');

            const command = new CommandImplementation(this.announce_, this.nuwani_);

            command.build(
                server.commandManager.buildCommand(command.name)
                    .description(command.description)
                    .restrict(command.defaultPlayerLevel));

            // Store the |command| in the |commands_| dictionary.
            this.commands_.set(command.name, command);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Used when the |player| would like to fix the temporary rights of |target|. This is a work-
    // around until the account system moves to JavaScript properly.
    onTempFixCommand(player, target) {
        if (target.isAdministrator()) {
            player.sendMessage(`{DC143C}Error{FFFFFF}: ${target.name} already is an administrator.`)
            return;
        }

        target.level = Player.LEVEL_ADMINISTRATOR;
        target.levelIsTemporary = true;

        player.sendMessage(`{33AA33}Success{FFFFFF}: ${target.name} their rights have been fixed.`);

        this.announce_().announceToAdministrators(
            `%s (Id:%d) has fixed temporary rights for %s (Id:%d)`, player.name, player.id,
            target.name, target.id);
    }

    // Provides administrators with thorough access controls for all of Las Venturas Playground's
    // commands. The |player| will be able and control commands accessible to them.
    async onPlaygroundAccessCommand(player) {
        return this.displayCommandListDialog(
            player, /* baseCommand= */ null, [ ...server.commandManager.commands ]);
    }

    // Displays an access control dialog to the |player| for the |commands| which describes the list
    // of commands to display in this mode. May recursively call itself for complex commands.
    async displayCommandListDialog(player, baseCommand, commands) {
        // (1) Create the dialog that's to be shown. This dialog will only be used for the command
        // listing when there's at least a single sub-command to show.
        const dialog = new Menu('Access management', [
            'Command',
            'Level',
            'Description',
            'Exceptions',

        ], { pageSize: 25 });

        // (1) Create a mapping with all the current levels for the commands in |commands|
        const commandRestriction = new Map();

        for (const command of commands) {
            commandRestriction.set(
                command, this.permissionDelegate_.getCommandLevel(command).restrictLevel);
        }

        // (2) Sort the |commands| in alphabetical order, in-place, based on what's been given.
        commands.sort((lhs, rhs) => {
            const lhsLevel = commandRestriction.get(lhs);
            const rhsLevel = commandRestriction.get(rhs);

            if (lhsLevel !== rhsLevel)
                return lhsLevel > rhsLevel ? -1 : 1;

            return lhs.command.localeCompare(rhs.command);
        });

        // (a) If |baseCommand| is given, include it in the |commands| as the first entry.
        if (baseCommand)
            commands.unshift(baseCommand);

        // (3) Add each of the |commands| to the |dialog|, together with information on the level
        // it's been tied to, and whether there are exceptions for this command.
        for (const command of commands) {
            if (!this.permissionDelegate_.canExecuteCommand(player, null, command, false))
                continue;  // the |player| does not have access to this command

            let color = '';
            let level = null;
            let exceptions = '{9E9E9E}-';
            let suffix = '';

            // (a) Display a helpful suffix to tell folks which menu will be shown after selection.
            if (command !== baseCommand && command.hasSubCommands())
                suffix = '{9E9E9E}...';

            // (b) Figure out the label to use for the command's level restriction.
            const { restrictLevel, originalLevel, restrictTemporary, originalTemporary } =
                this.permissionDelegate_.getCommandLevel(command);

            if (restrictLevel !== originalLevel || restrictTemporary !== originalTemporary)
                color = '{F44336}';

            switch (restrictLevel) {
                case Player.LEVEL_PLAYER:
                    level = 'Players';
                    break;

                case Player.LEVEL_ADMINISTRATOR:
                    level = '{FFFF00}Administrators';
                    if (restrictTemporary)
                        level += ' {F44336}*';

                    break;

                case Player.LEVEL_MANAGEMENT:
                    level = '{4CAF50}Management';
                    break;
            }

            // (c) Create a label for the number of exceptions that exist for this command.
            const exceptionCount = this.permissionDelegate_.getExceptions(command).length;
            if (exceptionCount === 1)
                exceptions = '{F44336}1 exception';
            else if (exceptionCount >= 2)
                exceptions = `{F44336}${exceptionCount} exceptions`;

            // (d) Create a listener function which activates when this command has been selected by
            // the player. Either call this function again, or move on to command configuration.
            const listener = () => {
                if (command !== baseCommand && command.hasSubCommands()) {
                    return this.displayCommandListDialog(
                        player, command, [ ...command.subs.values() ]);
                } else {
                    return this.displayCommandDialog(player, command);
                }
            };

            // (d) Add the |command| and all formatted information to the |dialog|.
            dialog.addItem(
                color + command.command + suffix, level, command.description, exceptions, listener);
        }

        // (3) Present the dialog to the |player|.
        return await dialog.displayForPlayer(player);
    }

    // Displays a dialog with the settings available for the |player| specific to the given
    // |command|, for instance to add and remove exceptions, and change the default level.
    async displayCommandDialog(player, command) {
        const { restrictLevel, originalLevel, restrictTemporary, originalTemporary } =
            this.permissionDelegate_.getCommandLevel(command);

        if (originalLevel > player.level) {
            return await alert(player, {
                title: 'Access management',
                message: `Sorry, this command is normally restricted to a level above yours,\n` +
                         `so you're not able to amend its access rights.`
            });
        }

        let levelPrefix = originalLevel !== restrictLevel ? '{F44336}' : '';
        let levelSuffix = originalLevel !== restrictLevel ? '{FFFFFF}' : '';
        let level = 'Player';

        switch (restrictLevel) {
            case Player.LEVEL_ADMINISTRATOR:
                level = 'Administrators';
                break;
            case Player.LEVEL_MANAGEMENT:
                level = 'Management';
                break;
        }

        const dialog = new Menu(command.command);

        // (1) Add a dialog that allows the |player| to change the level it's available to.
        dialog.addItem(`Change required level (${levelPrefix}${level}${levelSuffix})`, async () => {
            return await this.displayCommandLevelDialog(player, command);
        });

        // (2) For command restricted to administrators, it's possible to decide whether it should
        // be limited from temporary administrators as well. This can be overridden as appropriate.
        if (restrictLevel === Player.LEVEL_ADMINISTRATOR && player.isManagement()) {
            const tempPrefix = originalTemporary !== restrictTemporary ? '{F44336}' : '';
            const tempSuffix = originalTemporary !== restrictTemporary ? '{FFFFFF}' : '';
            const temp = restrictTemporary ? 'restricted' : 'not restricted';

            dialog.addItem(
                `Restrict from temporary administrators (${tempPrefix}${temp}${tempSuffix})`,
                async () => await this.displayCommandTemporaryDialog(player, command));
        }

        // (3) Add a dialog that allows the |player| to issue a new exception.
        dialog.addItem('Add a usage exception', async () => {
            return await this.displayCommandExceptionDialog(player, command);
        });

        // (4) If any exceptions have been granted, list those here for modification as well.
        const exceptions = this.permissionDelegate_.getExceptions(command);
        if (exceptions.length > 0) {
            dialog.addItem('----------');

            // (a) Sort the |exceptions| by player name, in ascending order.
            exceptions.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

            // (b) Add each of the |exceptions to the created |dialog|.
            for (const exceptedPlayer of exceptions) {
                dialog.addItem(`Remove exception for ${exceptedPlayer.name}`, async () => {
                    return await this.removeCommandException(player, command, exceptedPlayer);
                });
            }
        }

        // (4) Display the created |dialog| to the |player|.
        return await dialog.displayForPlayer(player);
    }

    // Displays a dialog to the |player| that allows them to change the required player level for
    // folks to be able to access the given |command|.
    async displayCommandLevelDialog(player, command) {
        const dialog = new Menu(command.command);
        const levels = new Map([
            [ Player.LEVEL_MANAGEMENT, 'Management' ],
            [ Player.LEVEL_ADMINISTRATOR, 'Administrators' ],
            [ Player.LEVEL_PLAYER, 'Players' ],
        ]);

        const { restrictLevel, originalLevel } = this.permissionDelegate_.getCommandLevel(command);

        // Function to change the level of |command| to the given |level|. Will be announced to all
        // in-game administrators as well, and to players when granting/removing their abilities.
        const changeCommandLevel = async (level) => {
            if (restrictLevel === level)
                return;  // the level isn't being changed

            // (1) Update the |command|'s level to the given |level| internally.
            this.permissionDelegate_.setCommandLevel(command, level);

            // (2) If the |command| was available to players, but is not anymore, tell them.
            // Conversely, if it's now available and previously wasn't, tell them too.
            if (restrictLevel === Player.LEVEL_PLAYER) {
                this.announce_().broadcast(
                    'miscellaneous/commands', messages.playground_announce_command_revoked,
                    {
                        command: command.command,
                        player,
                    });
            } else if (level === Player.LEVEL_PLAYER) {
                this.announce_().broadcast(
                    'miscellaneous/commands', messages.playground_announce_command_granted,
                    {
                        command: command.command,
                        player,
                    });
            }

            // (3) Tell all in-game administrators about the change in level having been made.
            this.announce_().announceToAdministrators(
                Message.LVP_ACCESS_ADMIN_NOTICE, player.name, player.id, command.command,
                levels.get(level));

            // (4) Tell the |player| that their change has propagated.
            return await alert(player, {
                title: command.command,
                message: `The command's access rights have been updated.`
            });
        };

        // (1) Add all available levels to the given |dialog|.
        for (const [ level, levelText ] of levels) {
            if (level > player.level)
                continue;  // the |player| cannot revoke commands from their own access

            let suffix = '';

            if (originalLevel === level)
                suffix = ' {9E9E9E}(original)';
            else if (restrictLevel === level)
                suffix = ' {F44336}(current)';

            dialog.addItem(levelText + suffix, changeCommandLevel.bind(this, level));
        }

        // (2) Display the |dialog| to the given |player|.
        return dialog.displayForPlayer(player);
    }

    // Displays a dialog to the |player| which allows them to either restrict or unrestrict it from
    // usage by temporary administrators. This is an ability now available to Management.
    async displayCommandTemporaryDialog(player, command) {
        const dialog = new Menu(command.command);
        const options = [
            [ true,   'Restricted to permanent administrators' ],
            [ false,  'Available to all administrators' ],
        ];

        const { restrictLevel, restrictTemporary, originalTemporary } =
            this.permissionDelegate_.getCommandLevel(command);

        // (1) Add each of the |options| to the |dialog|, and clarify the available options.
        for (const [ value, label ] of options) {
            let suffix = '';

            if (originalTemporary === value)
                suffix = ' {9E9E9E}(original)';
            else if (restrictTemporary === value)
                suffix = ' {F44336}(current)';

            dialog.addItem(label + suffix, async () => {
                // (1) Update the |command|'s level to the current level with the given temporary
                // administrator restrictions internally.
                this.permissionDelegate_.setCommandLevel(command, restrictLevel, value);

                // (2) Tell all in-game administrators about the change in level having been made.
                this.announce_().announceToAdministrators(
                    value ? Message.LVP_ACCESS_ADMIN_TEMP_RESTRICTED
                          : Message.LVP_ACCESS_ADMIN_TEMP_UNRESTRICTED,
                    player.name, player.id, command.command);

                // (3) Tell the |player| that their change has propagated.
                return await alert(player, {
                    title: command.command,
                    message: `The command's restrictions have been updated.`
                });
            });
        }

        // (2) Display the |dialog| to the given |player|.
        return dialog.displayForPlayer(player);
    }

    // Displays a dialog to the |player| which allows them to add a new exception to the given
    // |command|. Exceptions can only be issued to registered players.
    async displayCommandExceptionDialog(player, command) {
        const target = await Question.ask(player, {
            question: command.command,
            message: 'Which player do you want to give access to this command?',
            constraints: {
                validation: input => !!server.playerManager.find({ nameOrId: input }),
                explanation: `Sorry, I don't know which player you mean by that. Try again?`,
                abort: `Sorry, you need to tell me which player to add the exception for.`
            }
        });

        if (!target)
            return;  // the |player| aborted

        const targetPlayer = server.playerManager.find({ nameOrId: target });
        if (!targetPlayer)
            return;  // validation succeeded, but now fails.. race condition?

        // (1) If the |targetPlayer| is not registered, we cannot add an exception for them.
        if (!targetPlayer.account.isIdentified()) {
            return await alert(player, {
                title: command.command,
                message: `Sorry, exceptions can only be added for registered players.`
            });
        }

        // (2) If the |targetPlayer| is the current |player|, tell them to stop being silly.
        if (targetPlayer === player) {
            return await alert(player, {
                title: command.command,
                message: `Sorry, you're being silly so computer says no.`
            });
        }

        // (3) If the |targetPlayer| already has access, let's not bother adding an exception.
        if (this.permissionDelegate_.canExecuteCommand(targetPlayer, null, command, false)) {
            return await alert(player, {
                title: command.command,
                message: `Sorry, ${targetPlayer.name} can already execute the command and thus\n` +
                         `does not need an exception. Are you trying to be sneaky? :D`
            });
        }

        // (3) Add the exception for the |targetPlayer| with the given |command|.
        this.permissionDelegate_.addException(targetPlayer, command);

        // (4) Tell the |targetPlayer| about the exception that has been added.
        targetPlayer.sendMessage(
            Message.LVP_ACCESS_EXCEPTION_ADDED_FYI, player.name, player.id, command.command);

        // (5) Tell in-game administrators about the exception having been added, except when the
        // original |command| requirement is Management-only, in which case it's silent.
        if (command.restrictLevel !== Player.LEVEL_MANAGEMENT) {
            this.announce_().announceToAdministrators(
                Message.LVP_ACCESS_EXCEPTION_ADDED_ADMIN, player.name, player.id, targetPlayer.name,
                targetPlayer.id, command.command);
        }

        // (6) Tell the |player| that the exception has been added.
        return await alert(player, {
            title: command.command,
            message: `An exception has been added for ${targetPlayer.name}`
        });
    }

    // Handles the flow where the |player| wants to remove an exception issued for |exceptedPlayer|
    // to use the given |command|. This will have to be confirmed by the |player|.
    async removeCommandException(player, command, exceptedPlayer) {
        const confirmation = await confirm(player, {
            title: command.command,
            message: `Are you sure that you want to remove the exception granted\n` +
                     `to ${exceptedPlayer.name}? They will be informed about this.`
        });

        if (!confirmation)
            return;  // the |player| changed their mind

        // (1) Revoke the permission for the |exceptedPlayer|.
        this.permissionDelegate_.removeException(exceptedPlayer, command);

        // (2) Let the |exceptedPlayer| know about having lost the exception.
        exceptedPlayer.sendMessage(
            Message.LVP_ACCESS_EXCEPTION_REMOVED_FYI, player.name, player.id, command.command);

        // (3) Let administrators know about the |exceptedPlayer| having lost the exception.
        if (command.restrictLevel !== Player.LEVEL_MANAGEMENT) {
            this.announce_().announceToAdministrators(
                Message.LVP_ACCESS_EXCEPTION_REMOVED_ADMIN, player.name, player.id, command.command,
                exceptedPlayer.name, exceptedPlayer.id);
        }

        // (4) Let |player| know that the exception has been removed.
        return await alert(player, {
            title: command.command,
            message: `An exception has been removed for ${exceptedPlayer.name}`
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Facilitates reloading the server's message format file, which allows changing text and output
    // dynamically whenever a needs arises. Might be required when live reloading features to add
    // new functionality, that requires additional strings.
    async onPlaygroundReloadMessagesCommand(player) {
        this.announce_().announceToAdministrators(
            Message.LVP_RELOAD_MESSAGES_ADMIN, player.name, player.id);

        try {
            const { originalMessageCount, messageCount } = Message.reloadMessages();
            player.sendMessage(
                Message.LVP_RELOAD_MESSAGES_SUCCESS, messageCount, originalMessageCount);

        } catch (exception) {
            player.sendMessage(Message.LVP_RELOAD_MESSAGES_ERROR, exception.message);
        }
    }

    // Facilitates the developer's ability to reload features without having to restart the server.
    // There are strict requirements a feature has to meet in regards to dependencies in order for
    // it to be live reloadable.
    async onPlaygroundReloadCommand(player, feature) {
        if (!server.featureManager.isEligibleForLiveReload(feature)) {
            player.sendMessage(Message.LVP_RELOAD_NOT_ELIGIBLE, feature);
            return;
        }

        // Get the instance of our Announce dependency.
        const announce = this.announce_();

        await server.featureManager.liveReload(feature);

        // WARNING: The dispose() function of this instance may now have been called, so we cannot
        // rely on this class' state anymore. For all intents and purposes, assume it's gone.

        announce.announceToAdministrators(
            Message.LVP_ANNOUNCE_FEATURE_RELOADED, player.name, player.id, feature);

        player.sendMessage(Message.LVP_RELOAD_RELOADED, feature);
    }

    // ---------------------------------------------------------------------------------------------

    // Displays a series of menus to administrators and Management members that want to inspect, or
    // make changes to, how certain features on the server work. The availability of options depends
    // on the legel of the |player| calling this command.
    async onPlaygroundSettingsCommand(player) {
        const categories = new Map(); // label => { settings, listener }
        const menu = new Menu('Choose a category of settings', ['Category', 'Settings']);

        const communication = this.communication_();

        // Administrators and Management members alive have access to the word filters.
        categories.set('Blocked words', {
            settings: communication.getBlockedWords().length + ' words',
            listener: PlaygroundCommands.prototype.handleBlockedWords.bind(this, player),
        });

        categories.set('Player communication', {
            settings: communication.isCommunicationMuted() ? '{FFFF00}disabled' : 'enabled',
            listener: PlaygroundCommands.prototype.handleBlockCommunication.bind(this, player),
        });

        categories.set('Substitutions', {
            settings: communication.getReplacements().length + ' words',
            listener: PlaygroundCommands.prototype.handleSubstitutions.bind(this, player),
        });

        // Management members have access to individual settings for all features on the server as
        // well. These require far more context to be able to effectively toggle.
        if (player.isManagement()) {
            const settingCategories = new Map();

            // (1) Split up all available settings in categories & settings belonging to them.
            for (const setting of this.settings_().getSettings()) {
                if (!settingCategories.has(setting.category))
                    settingCategories.set(setting.category, new Set());

                settingCategories.get(setting.category).add(setting);
            }

            // (2) Create a label and listener for each of the setting categories.
            for (const [category, categorySettings] of settingCategories.entries()) {
                const label = category[0].toUpperCase() + category.substring(1);
                const settings = `${categorySettings.size} settings`;
                const listener =
                    PlaygroundCommands.prototype.handleSettingCategory.bind(this, player, category);

                categories.set(label, { settings, listener });
            }
        }

        // Now sort the available |categories|, compile the menu, and display it to the |player|.
        const sortedCategories = Array.from(categories.keys()).sort();
        for (const category of sortedCategories) {
            const { settings, listener } = categories.get(category);

            menu.addItem(category, settings, listener);
        }

        await menu.displayForPlayer(player);
    }

    // Handles the list of blocked words which players are forbidden to say on the server.
    // Communication that contains one (or more) of these words will be blocked.
    async handleBlockedWords(player) {
        const words = this.communication_().getBlockedWords();
        const substitutions = this.communication_().getReplacements();

        const menu = new Menu('Blocked words', ['Blocked word', 'Added by']);
        menu.addItem('Block a new word', '-', async () => {
            const wordToBlock = await Question.ask(player, {
                question: 'Blocked words',
                message: 'Which word do you want to block?',
                constraints: {
                    validation: /^.{3,24}$/i,
                    explanation: 'The word must be between 3 and 24 characters in length.',
                    abort: 'Sorry, you did not enter a valid word to block.',
                }
            });

            if (!wordToBlock)
                return;  // the |player| abandoned the flow

            const lowerCaseWordToBlock = wordToBlock.trim().toLowerCase();

            // Verify that the |lowerCaseWordToBlock| has not already been blocked on the server.
            for (const existingWord of words) {
                if (existingWord.word !== lowerCaseWordToBlock)
                    continue;

                return alert(player, {
                    title: 'Blocked words',
                    message: `The word "${lowerCaseWordToBlock}" has already been blocked.`
                });
            }

            // Verify that the |lowerCaseWordToBlock| hasn't already been added as a substitution.
            for (const existingSubstitution of substitutions) {
                if (existingSubstitution.before !== lowerCaseWordToBlock)
                    continue;

                return alert(player, {
                    title: 'Blocked words',
                    message: `The word "${lowerCaseWordToBlock}" already exists as a substitution.`
                });
            }

            // Actually block the |lowerCaseWordToBlock| now.
            this.communication_().addBlockedWord(player, lowerCaseWordToBlock);

            // Inform administrators of the newly blocked word.
            this.announce_().announceToAdministrators(
                Message.LVP_ANNOUNCE_WORD_BLOCKED, player.name, player.id, lowerCaseWordToBlock);

            // Confirm the action to the |player|.
            return alert(player, {
                title: 'Blocked words',
                message: `The word "${lowerCaseWordToBlock}" has been blocked on the server.`
            });
        });

        // Add a delimiter before listing all the currently blocked words.
        menu.addItem('-----', '-----');

        for (const { word, nickname } of words.sort()) {
            menu.addItem(word, nickname, async() => {
                const confirmation = await confirm(player, {
                    title: 'Blocked words',
                    message: `Are you sure that you want to unblock the word "${word}"?`,
                });

                if (!confirmation)
                    return;  // the |player| abandoned the flow

                // Actually remove the |word| from the blocked word list.
                this.communication_().removeBlockedWord(player, word);

                // Inform administrators of the re-allowed word.
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_WORD_UNBLOCKED, player.name, player.id, word);

                // Confirm the action to the |player|.
                return alert(player, {
                    title: 'Blocked words',
                    message: `The word "${word}" has been unblocked on the server.`
                });
            });
        }

        await menu.displayForPlayer(player);
    }

    // Handles players' ability to communicate on the server, which administrators have the ability
    // to toggle with the `/lvp settings` command.
    async handleBlockCommunication(player) {
        let muted = this.communication_().isCommunicationMuted();
        let label = muted ? 'enable' : 'disable';

        const confirmation = await confirm(player, {
            title: 'Communication',
            message: `Are you sure that you want to {FFA500}${label}{A9C4E4} all communication?`,
        });

        if (!confirmation)
            return;  // the |player| changed their mind

        muted = !muted;  // flip the flag!
        label = muted ? 'disabled' : 'enabled';

        this.communication_().setCommunicationMuted(muted);

        const attributedAnnouncement =
            Message.format(Message.LVP_ANNOUNCE_COMMUNICATION_BLOCKED, player.name, player.id,
                           label);

        // (1) Announce to all in-game administrators and everyone on IRC.
        this.announce_().announceToAdministrators(attributedAnnouncement);
        this.nuwani_().echo('notice-announce', attributedAnnouncement);

        // (2) Announce to all in-game players.
        const announcement =
            Message.format(muted ? Message.COMMUNICATION_SERVER_MUTED
                                 : Message.COMMUNICATION_SERVER_UNMUTED, player.name);

        for (const recipient of server.playerManager)
            recipient.sendMessage(announcement);

        // (3 Let the |player| know what they've just done.
        return alert(player, {
            title: 'Communication',
            message: 'All communication on Las Venturas Playground has been ' + label
        });
    }

    // Handles the option for the |player| to add or remove substitutions that will apply to
    // communication throughout Las Venturas Playground.
    async handleSubstitutions(player) {
        const words = this.communication_().getBlockedWords();
        const substitutions = this.communication_().getReplacements();

        const menu = new Menu('Substitutions', ['Phrase', 'Substitution', 'Added by']);
        menu.addItem('Add a new substitution', '-', '-', async () => {
            const before = await Question.ask(player, {
                question: 'Substitutions',
                message: 'Which word do you want to substitute?',
                constraints: {
                    validation: /^.{3,24}$/i,
                    explanation: 'The word must be between 3 and 24 characters in length.',
                    abort: 'Sorry, you did not enter a valid word to replace.',
                }
            });

            if (!before)
                return;  // the |player| abandoned the flow

            const after = await Question.ask(player, {
                question: 'Substitutions',
                message: 'Which word should it be substituted with?',
                constraints: {
                    validation: /^.{1,24}$/i,
                    explanation: 'The substitution must be between 1 and 24 characters in length.',
                    abort: 'Sorry, you did not enter a valid word to substitute.',
                }
            });

            if (!after)
                return;  // the |player| abandoned the flow

            const lowerCaseBefore = before.trim().toLowerCase();
            const lowerCaseAfter = after.trim().toLowerCase();

            // Verify that the |lowerCaseBefore| is not already being substituted to something else.
            for (const existingSubstitution of substitutions) {
                if (existingSubstitution.before !== lowerCaseBefore)
                    continue;

                return alert(player, {
                    title: 'Substitutions',
                    message: `The word "${lowerCaseBefore}" is already being substituted.`
                });
            }

            // Verify that the |lowerCaseBefore| is not already known as a blocked word.
            for (const existingWord of words) {
                if (existingWord.word !== lowerCaseBefore)
                    continue;

                return alert(player, {
                    title: 'Substitutions',
                    message: `The word "${lowerCaseBefore}" already exists as a blocked word.`
                });
            }

            // Actually block the |lowerCaseWordToBlock| now.
            this.communication_().addReplacement(player, lowerCaseBefore, lowerCaseAfter);

            // Inform administrators of the newly blocked word.
            this.announce_().announceToAdministrators(
                Message.LVP_ANNOUNCE_SUBSTITUTION_ADDED, player.name, player.id, lowerCaseBefore,
                lowerCaseAfter);

            // Confirm the action to the |player|.
            return alert(player, {
                title: 'Substitutions',
                message: `The word "${lowerCaseBefore}" will now be substituted with "` +
                         `${lowerCaseAfter}" on the server.`
            });
        });

        // Add a delimiter before listing all the existing substitutions.
        menu.addItem('-----', '-----', '-----');

        for (const { before, after, nickname } of substitutions.sort()) {
            menu.addItem(before, after, nickname, async() => {
                const confirmation = await confirm(player, {
                    title: 'Substitutions',
                    message: `Are you sure that you want remove the substitution for "${before}"?`,
                });

                if (!confirmation)
                    return;  // the |player| abandoned the flow

                // Actually remove the substitution for the |before|.
                this.communication_().removeReplacement(player, before);

                // Inform administrators of the substitution which has been removed.
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SUBSTITUTION_REMOVED, player.name, player.id, before,
                    after);

                return alert(player, {
                    title: 'Substitutions',
                    message: `The word "${before}" will no longer be substituted.`
                });
            });
        }

        await menu.displayForPlayer(player);
    }

    // Handles interaction with feature-specific settings for the given |player|, in the given
    // |category|. The actual settings part of this category will be re-computed on call.
    async handleSettingCategory(player, category) {
        const settings = new Set();

        // Fetch the settings which are part of the given |category| first.
        for (const setting of this.settings_().getSettings()) {
            if (setting.category !== category)
                continue;

            settings.add(setting);
        }

        const sortedSettings =
            Array.from(settings).sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));

        const innerMenu = new Menu('Choose a setting', ['Setting', 'Value']);
        for (const setting of sortedSettings) {
            let valueLabel = 'null';

            switch (setting.type) {
                case Setting.TYPE_BOOLEAN:
                    valueLabel = setting.value ? 'enabled' : 'disabled';
                    if (setting.value != setting.defaultValue) {
                        valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                                        (setting.defaultValue ? 'enabled' : 'disabled') + ')';
                    }

                    break;

                case Setting.TYPE_NUMBER:
                    valueLabel = '' + setting.value;
                    if (setting.value != setting.defaultValue) {
                        valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                                        setting.defaultValue + ')';
                    }

                    break;

                case Setting.TYPE_STRING:
                    valueLabel = setting.value;
                    if (setting.value != setting.defaultValue) {
                        valueLabel = '{FFFF00}' + valueLabel + '{FFFFFF} (default: ' +
                                        setting.defaultValue + ')';
                    }

                    break;

                default:
                    throw new Error('Invalid setting type for ' + setting.name);
            }

            // Add a menu item for the particular setting, that will in turn defer to a
            // function that allows the particular setting to be changed.
            innerMenu.addItem(setting.name, valueLabel, async(player) => {
                switch (setting.type) {
                    case Setting.TYPE_BOOLEAN:
                        await this.handleBooleanSettingModification(player, setting);
                        break;

                    case Setting.TYPE_NUMBER:
                        await this.handleNumberSettingModification(player, setting);
                        break;

                    case Setting.TYPE_STRING:
                        await this.handleStringSettingModification(player, setting);
                        break;
                }
            });
        }

        await innerMenu.displayForPlayer(player);
    }

    // Handles the |player| modifying the |setting|, which represents a boolean value.
    async handleBooleanSettingModification(player, setting) {
        const menu = new Menu(setting.description);

        // Create creative labels that describe both the current value, the new value and the
        // default value that was configured for the setting in its entirety.
        const enableLabel = (setting.value ? '{FFFF00}' : '') + 'Enable' +
                            (setting.defaultValue ? ' {FFFFFF}(default)' : '');
        const disableLabel = (!setting.value ? '{FFFF00}' : '') + 'Disable' +
                             (!setting.defaultValue ? ' {FFFFFF}(default)' : '');

        menu.addItem(enableLabel, async(player) => {
            this.settings_().setValue(setting.identifier, true);
            this.announceSettingChangeToAdministrators(player, setting);

            return await MessageBox.display(player, {
                title: 'The setting has been enabled!',
                message: Message.format(Message.LVP_SETTING_TOGGLED, setting.identifier, 'enabled')
            });
        });

        menu.addItem(disableLabel, async(player) => {
            this.settings_().setValue(setting.identifier, false);
            this.announceSettingChangeToAdministrators(player, setting);

            return await MessageBox.display(player, {
                title: 'The setting has been disabled!',
                message: Message.format(Message.LVP_SETTING_TOGGLED, setting.identifier, 'disabled')
            });
        });

        await menu.displayForPlayer(player);
    }

    // Handles the |player| modifying the |setting|, which represents a numeric value.
    async handleNumberSettingModification(player, setting) {
        const answer = await Question.ask(player, {
            question: setting.identifier,
            message: setting.description + '\nThe default value is {FFA500}' +
                     setting.defaultValue + '{A9C4E4}',
            leftButton: 'Update'
        });

        if (!answer)
            return;  // the |player| cancelled the dialog.

        if (!isSafeInteger(answer)) {
            return await MessageBox.display(player, {
                title: 'Invalid value for the ' + setting.identifier + ' setting!',
                message: Message.format(Message.LVP_SETTING_INVALID_NUMBER, answer)
            });
        }

        this.settings_().setValue(setting.identifier, toSafeInteger(answer));
        this.announceSettingChangeToAdministrators(player, setting);

        return await MessageBox.display(player, {
            title: 'The setting has been disabled!',
            message: Message.format(Message.LVP_SETTING_UPDATED, setting.identifier, answer)
        });
    }

    // Handles the |player| modifying the |setting|, which represents a textual value.
    async handleStringSettingModification(player, setting) {
        const answer = await Question.ask(player, {
            question: setting.identifier,
            message: setting.description + '\nThe default value is {FFA500}' +
                     setting.defaultValue + '{A9C4E4}',
            leftButton: 'Update'
        });

        if (!answer)
            return;  // the |player| cancelled the dialog.

        if (!answer.length || answer.length > 255) {
            return await MessageBox.display(player, {
                title: 'Invalid value for the ' + setting.identifier + ' setting!',
                message: Message.LVP_SETTING_INVALID_STRING
            });
        }

        this.settings_().setValue(setting.identifier, answer);
        this.announceSettingChangeToAdministrators(player, setting);

        return await MessageBox.display(player, {
            title: 'The setting has been disabled!',
            message: Message.format(Message.LVP_SETTING_UPDATED, setting.identifier, answer)
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Announces the updated value for the |setting|, as made by |player|, to administrators.
    announceSettingChangeToAdministrators(player, setting) {
        switch (setting.type) {
            case Setting.TYPE_BOOLEAN:
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SETTING_TOGGLED, player.name, player.id,
                    (setting.value ? 'enabled' : 'disabled'), setting.identifier);

                break;

            case Setting.TYPE_NUMBER:
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SETTING_UPDATED_NUM, player.name, player.id,
                    setting.identifier, setting.value);

                break;

            case Setting.TYPE_STRING:
                this.announce_().announceToAdministrators(
                    Message.LVP_ANNOUNCE_SETTING_UPDATED_STRING, player.name, player.id,
                    setting.identifier, setting.value);

                break;
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Captures a trace of the server's activities for the given number of |seconds|. The name of
    // the trace will be automatically generated based on the current time and date.
    async onPlayergroundTraceCommand(player, seconds) {
        if (!seconds || seconds < 10 || seconds > 1800) {
            player.sendMessage(Message.LVP_TRACE_USAGE);
            return;
        }

        if (this.activeTrace_) {
            player.sendMessage(Message.LVP_TRACE_IN_PROGRESS);
            return;
        }

        // (1) Mark that a trace is in progress, effectively locking this command.
        this.activeTrace_ = true;

        const duration = timeDifferenceToString(seconds);

        // (2) Announce the trace to administrators, in case lag is experienced.
        this.announce_().announceToAdministrators(
            Message.LVP_TRACE_ADMIN_STARTED, player.name, player.id, duration);

        // (3) Start the actual trace, and acknowledge this action to the |player|.
        player.sendMessage(Message.LVP_TRACE_STARTED, duration);

        startTrace();

        // (4) Wait for the trace to be completed. Mind that the |player| might disconnect in this
        // time, particularly for longer-running traces of 10 minutes or more.
        await wait(seconds * 1000);

        // (5) Capture the trace to the generated |filename|. This could lock up the server for a
        // second or so, particularly if the trace ran for a longer period of time.
        const date = new Date();
        const filename = format(
            'trace-%s-%02d-%02d-%02d-%02d-%02d.json', date.getFullYear(), date.getMonth() + 1,
            date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());

        stopTrace(filename);

        // (6) Tell administrators about the trace having succeeded.
        this.announce_().announceToAdministrators(Message.LVP_TRACE_ADMIN_FINISHED, filename);

        // (7) If the |player| is still connected, let them know about the successful trace too.
        if (player.isConnected())
            player.sendMessage(Message.LVP_TRACE_FINISHED, filename);

        this.activeTrace_ = false;
    }

    // ---------------------------------------------------------------------------------------------

    // Displays some generic information for those typing `/lvp`. Administrators and higher will see
    // a list of sub-commands that they're allowed to execute.
    onPlaygroundCommand(player) {
        let options = [];

        if (player.isAdministrator())
            options.push('access', 'settings');

        if (player.isManagement())
            options.push('profile', 'reload', 'trace');

        player.sendMessage(Message.LVP_PLAYGROUND_HEADER);
        if (!options.length)
            return;

        player.sendMessage(Message.COMMAND_USAGE, '/lvp [' + options.sort().join('/') + ']');
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('lvp');
        server.commandManager.removeCommand('tempfix');

        this.commands_.forEach((command, name) => {
            server.commandManager.removeCommand(name);
            command.dispose();
        });

        this.commands_.clear();

        this.announce_ = null;
        this.communication_ = null;
        this.nuwani_ = null;
        this.settings_ = null;
    }
}
