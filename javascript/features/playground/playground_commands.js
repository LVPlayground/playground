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
import { isSafeInteger, toSafeInteger } from 'base/string_util.js';

// A series of general commands that don't fit in any particular
export class PlaygroundCommands {
    announce_ = null;
    commands_ = null;
    communication_ = null;
    nuwani_ = null;
    settings_ = null;

    constructor(announce, communication, nuwani, settings) {
        this.announce_ = announce;
        this.communication_ = communication;
        this.nuwani_ = nuwani;
        this.settings_ = settings;

        this.commands_ = new Map();

        // -----------------------------------------------------------------------------------------

        // The `/lvp` command offers administrators and higher a number of functions to manage the
        // server, the available commands and availability of a number of smaller features.
        server.commandManager.buildCommand('lvp')
            .description('Manages Las Venturas Playground.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('access')
                .description('Access controls for all our JavaScript commands.')
                .restrict(Player.LEVEL_ADMINISTRATOR)
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
                .restrict(Player.LEVEL_ADMINISTRATOR)
                .build(PlaygroundCommands.prototype.onPlaygroundSettingsCommand.bind(this))
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

    // Provides administrators with thorough access controls for all of Las Venturas Playground's
    // commands. The |player| will be able and control commands accessible to them.
    async onPlaygroundAccessCommand(player) {
        return this.displayCommandDialog(
            player, /* baseCommand= */ null, [ ...server.commandManager.commands ]);
    }

    // Displays an access control dialog to the |player| for the |commands| which describes the list
    // of commands to display in this mode. May recursively call itself for complex commands.
    async displayCommandDialog(player, baseCommand, commands) {
        // (1) Create the dialog that's to be shown. This dialog will only be used for the command
        // listing when there's at least a single sub-command to show.
        const dialog = new Menu('Access management', [
            'Command',
            'Level',
            'Description',
            'Exceptions',

        ], { pageSize: 25 });

        // (2) Sort the |commands| in alphabetical order, in-place, based on what's been given.
        commands.sort((lhs, rhs) => {
            if (lhs.restrictLevel !== rhs.restrictLevel)
                return lhs.restrictLevel > rhs.restrictLevel ? -1 : 1;

            return lhs.command.localeCompare(rhs.command);
        });

        // (3) Add each of the |commands| to the |dialog|, together with information on the level
        // it's been tied to, and whether there are exceptions for this command.
        for (const command of commands) {
            let level = null;
            let exceptions = '{9E9E9E}-';
            let suffix = '';

            // (a) Display a helpful suffix to tell folks which menu will be shown after selection.
            if (command !== baseCommand && command.hasSubCommands())
                suffix = '{9E9E9E}...';

            // (b) Figure out the label to use for the command's level restriction.
            switch (command.restrictLevel) {
                case Player.LEVEL_PLAYER:
                    level = 'Players';
                    break;

                case Player.LEVEL_ADMINISTRATOR:
                    level = '{FFFF00}Administrators';
                    break;

                case Player.LEVEL_MANAGEMENT:
                    level = '{4CAF50}Management';
                    break;
            }

            // (c) Create a listener function which activates when this command has been selected by
            // the player. Either call this function again, or move on to command configuration.
            const listener = () => {
                if (command !== baseCommand && command.hasSubCommands())
                    return this.displayCommandDialog(player, command, [ ...command.subs.values() ]);
                else
                    ;  // TODO: Display a command configuration dialog
            };

            // (d) Add the |command| and all formatted information to the |dialog|.
            dialog.addItem(
                command.command + suffix, level, command.description, exceptions, listener);
        }

        // (3) Present the dialog to the |player|.
        return await dialog.displayForPlayer(player);
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

    // Displays some generic information for those typing `/lvp`. Administrators and higher will see
    // a list of sub-commands that they're allowed to execute.
    onPlaygroundCommand(player) {
        let options = [];

        if (player.isAdministrator())
            options.push('access', 'settings');

        if (player.isManagement())
            options.push('profile', 'reload');

        player.sendMessage(Message.LVP_PLAYGROUND_HEADER);
        if (!options.length)
            return;

        player.sendMessage(Message.COMMAND_USAGE, '/lvp [' + options.sort().join('/') + ']');
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('lvp');

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
