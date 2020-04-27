// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/nuwani_commands/ban_database.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of a series of commands that enables administrators to revoke access from certain
// players, IP addresses and serial numbers from the server, as well as understanding why someone
// might not have access. This includes a series of tools for understanding IP and serial usage.
export class BanCommands {
    commandManager_ = null;

    constructor(commandManager, BanDatabaseConstructor = BanDatabase) {
        this.commandManager_ = commandManager;
        this.database_ = new BanDatabaseConstructor();

        // !addnote [nickname] [note]
        this.commandManager_.buildCommand('addnote')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                { name: 'note', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(BanCommands.prototype.onAddNoteCommand.bind(this));

        // !ban ip [ip] [nickname] [days] [reason]
        // !ban range [ip range] [nickname] [days] [reason]
        // !ban serial [serial] [nickname] [days] [reason]
        // !ban [player] [days] [reason]
        this.commandManager_.buildCommand('ban')
            .sub('ip')
                .parameters([
                    { name: 'ip', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'days', type: CommandBuilder.NUMBER_PARAMETER },
                    { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
                .build(BanCommands.prototype.onBanSerialCommand.bind(this))
            .sub('range')
                .parameters([
                    { name: 'ip range', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'days', type: CommandBuilder.NUMBER_PARAMETER },
                    { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
                .build(BanCommands.prototype.onBanSerialCommand.bind(this))
            .sub('serial')
                .parameters([
                    { name: 'serial', type: CommandBuilder.NUMBER_PARAMETER },
                    { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'days', type: CommandBuilder.NUMBER_PARAMETER },
                    { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
                .build(BanCommands.prototype.onBanSerialCommand.bind(this))
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'days', type: CommandBuilder.NUMBER_PARAMETER },
                { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(BanCommands.prototype.onBanPlayerCommand.bind(this));

        // !isbanned [nickname | ip | ip range | serial]
        this.commandManager_.buildCommand('isbanned')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{
                name: 'nickname | ip | ip range | serial', type: CommandBuilder.WORD_PARAMETER }])
            .build(BanCommands.prototype.onIsBannedCommand.bind(this));

        // !kick [player] [reason]
        this.commandManager_.buildCommand('kick')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(BanCommands.prototype.onKickPlayerCommand.bind(this));

        // !lastbans
        this.commandManager_.buildCommand('lastbans')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(BanCommands.prototype.onLastBansCommand.bind(this));

        // !ipinfo [nickname | ip | ip range]
        this.commandManager_.buildCommand('ipinfo')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'nickname | ip | ip range', type: CommandBuilder.WORD_PARAMETER }])
            .build(BanCommands.prototype.onIpInfoCommand.bind(this));

        // !serialinfo [nickname | serial]
        this.commandManager_.buildCommand('serialinfo')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'nickname | serial', type: CommandBuilder.WORD_PARAMETER }])
            .build(BanCommands.prototype.onSerialInfoCommand.bind(this));

        // !why [nickname]
        this.commandManager_.buildCommand('why')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'nickname', type: CommandBuilder.WORD_PARAMETER }])
            .build(BanCommands.prototype.onWhyCommand.bind(this));

        // !unban [ip | ip range | serial] [reason]
        this.commandManager_.buildCommand('unban')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'ip | ip range | serial', type: CommandBuilder.WORD_PARAMETER },
                { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(BanCommands.prototype.onWhyCommand.bind(this));
    }

    // !addnote [nickname] [note]
    //
    // Adds the given |note| to the permanent record of the player identified by |nickname|. When
    // the given |nickname| is online and logged in to their account, their user Id will be added
    // the log of as well. The user Id of the sender will never be associated.
    async onAddNoteCommand(context, nickname, note) {
        if (!this.validateNote(context, note))
            return;

        let subjectUserId = null;

        const subjectPlayer = server.playerManager.getByName(nickname);
        if (subjectPlayer !== null && subjectPlayer.isRegistered())
            subjectUserId = userId;
        
        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeNote,
            sourceNickname: context.nickname,
            subjectUserId: subjectUserId,
            subjectNickname: nickname,
            note
        });

        if (success)
            context.respond(`3Success: The note for ${nickname} has been added to their record.`);
        else
            context.respond(`4Error: The note for ${nickname} could not be stored.`);
    }

    // !ban [player] [days] [reason]
    //
    // Bans the in-game |player| for a period of |days|, for the given |reason|. The ban will be an
    // IP-based ban on whichever address they are connected with right now.
    async onBanPlayerCommand(context, player, days, reason) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !ban ip [ip] [nickname] [days] [reason]
    //
    // Bans the singular |ip| address, belonging to |nickname|, for |days| days.
    async onBanIpCommand(context, ip, nickname, days, reason) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !ban range [ip range] [nickname] [days] [reason]
    //
    // Bans the IP address |range|, belonging to |nickname|, for |days| days.
    async onBanRangeCommand(context, range, nickname, days, reason) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !ban serial [serial] [nickname] [days] [reason]
    //
    // Bans the singular |serial| number, belonging to |nickname|, for |days| days.
    async onBanSerialCommand(context, serial, nickname, days, reason) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !isbanned [nickname | ip | ip range | serial]
    //
    // Checks whether the given nickname, IP address (range) or serial number is banned.
    async onIsBannedCommand(context, value) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !kick [player] [reason]
    //
    // Kicks the in-game |player| from the game for the given |reason|.
    async onKickPlayerCommand(context, player, reason) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !lastbans
    //
    // Lists the most recent bans that were created on the server.
    async onLastBansCommand(context) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !ipinfo [nickname | ip | ip range]
    //
    // Displays information about the IP addresses used by |nickname|, or the nicknames who have
    // used the singular |ip| address or the given |ip range| in the past.
    async onIpInfoCommand(context, value) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !serialinfo [nickname | serial]
    //
    // Displays information about the serial numbers used by the given |nickname|, or the nicknames
    // who have used the given |serial| number in the past.
    async onSerialInfoCommand(context, value) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !unban [ip | ip range | serial] [reason]
    //
    // Lifts the ban identified on the given |ip| address, |ip range| or |serial| number.
    async onUnbanCommand(context, value, reason) {
        context.respond('4Error: This command has not been implemented yet.');
    }

    // !why [nickname]
    //
    // Displays the recent entries in the permanent record of the given |player|.
    async onWhyCommand(context, nickname) {
        context.respond('4Error: This command has not been implemented yet.');
    }
    
    // Common routine for validating the given |note|, and responding to |context| with an error
    // message in case there are any issues with it.
    validateNote(context, note) {
        if (note.length <= 3 || note.length > 128) {
            context.respond('4Error: The note must be between 4 and 128 characters in length.');
            return false;
        }

        return true;
    }

    dispose() {
        this.commandManager_.removeCommand('unban');
        this.commandManager_.removeCommand('why');
        this.commandManager_.removeCommand('serialinfo');
        this.commandManager_.removeCommand('ipinfo');
        this.commandManager_.removeCommand('lastbans');
        this.commandManager_.removeCommand('kick');
        this.commandManager_.removeCommand('isbanned');
        this.commandManager_.removeCommand('ban');
        this.commandManager_.removeCommand('addnote');
    }
}
