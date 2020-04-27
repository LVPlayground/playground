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

    constructor(commandManager, announce, BanDatabaseConstructor = BanDatabase) {
        this.commandManager_ = commandManager;
        this.announce_ = announce;

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
                .build(BanCommands.prototype.onBanIpCommand.bind(this))
            .sub('range')
                .parameters([
                    { name: 'ip range', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                    { name: 'days', type: CommandBuilder.NUMBER_PARAMETER },
                    { name: 'reason', type: CommandBuilder.SENTENCE_PARAMETER }])
                .build(BanCommands.prototype.onBanRangeCommand.bind(this))
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
        if (subjectPlayer !== null) {
            if (subjectPlayer.isRegistered())
                subjectUserId = subjectPlayer.userId;

            this.announce_().announceToAdministrators(
                Message.NUWANI_ADMIN_ADDED_NOTE, context.nickname, subjectPlayer.name,
                subjectPlayer.id, note);
        }

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
        if (!this.validateDuration(context, days) || !this.validateNote(context, reason))
            return;

        // TODO: Tell the |player|.

        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_BANNED, context.nickname, player.name, player.id, days, reason);

        player.kick();  // actually remove them from the server

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeBan,
            banDurationDays: days,
            banIpAddress: player.ip,
            sourceNickname: context.nickname,
            subjectUserId: player.userId ?? 0,
            subjectNickname: player.name,
            note: reason
        });

        context.respond(`3Success: ${player.name} has been banned from the game.`);
        if (!success)
            context.respond(`4Error: The ban note for ${player.name} could not be stored.`);
    }

    // !ban ip [ip] [nickname] [days] [reason]
    //
    // Bans the singular |ip| address, belonging to |nickname|, for |days| days.
    async onBanIpCommand(context, ip, nickname, days, reason) {
        if (!this.validateDuration(context, days) || !this.validateNote(context, reason))
            return;

        const affected = this.validateIpAndReturnAffectedAddresses(context, 'ip', ip);
        if (!affected)
            return;  // an error occurred

        if (affected > 1) {
            context.respond(`4Error: Please use "!ban range" to ban more than a single address.`);
            return;
        }

        // TODO: See if the |ip| captures in-game players.

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeBanIp,
            banDurationDays: days,
            banIpAddress: ip,
            sourceNickname: context.nickname,
            subjectNickname: nickname,
            note: reason
        });

        if (success)
            context.respond(`3Success: The IP address ${ip} has been banned from the game.`);
        else
            context.respond(`4Error: The ban could not be stored in the database.`);
    }

    // !ban range [ip range] [nickname] [days] [reason]
    //
    // Bans the IP address |range|, belonging to |nickname|, for |days| days.
    async onBanRangeCommand(context, range, nickname, days, reason) {
        if (!this.validateDuration(context, days) || !this.validateNote(context, reason))
            return;

        const affected = this.validateIpAndReturnAffectedAddresses(context, 'range', range);
        if (!affected)
            return;
        
        if (affected === 1) {
            context.respond(`4Error: Please use "!ban ip" to ban a single address.`);
            return;
        }

        // TODO: See if the |range| captures in-game players.
        // TODO: Limit the reach of the |range| based on |context| level.

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeBanIp,
            banDurationDays: days,
            banIpRange: range,
            sourceNickname: context.nickname,
            subjectNickname: nickname,
            note: reason
        });

        if (success)
            context.respond(`3Success: The IP range ${range} has been banned from the game.`);
        else
            context.respond(`4Error: The ban could not be stored in the database.`);
    }

    // !ban serial [serial] [nickname] [days] [reason]
    //
    // Bans the singular |serial| number, belonging to |nickname|, for |days| days.
    async onBanSerialCommand(context, serial, nickname, days, reason) {
        if (!this.validateDuration(context, days) || !this.validateNote(context, reason))
            return;

        // TODO: See if the |serial| captures in-game players.

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeBan,
            banDurationDays: days,
            banSerialNumber: serial,
            sourceNickname: context.nickname,
            subjectNickname: nickname,
            note: reason
        });

        if (success)
            context.respond(`3Success: The serial ${serial} has been banned from the game.`);
        else
            context.respond(`4Error: The ban could not be stored in the database.`);
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
        if (!this.validateNote(context, reason))
            return;

        // TODO: Tell the |player|.

        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_KICKED, context.nickname, player.name, player.id, reason);

        player.kick();  // actually remove them from the server

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeKick,
            sourceNickname: context.nickname,
            subjectUserId: player.userId ?? 0,
            subjectNickname: player.name,
            note: reason
        });

        context.respond(`3Success: ${player.name} has been kicked from the game.`);
        if (!success)
            context.respond(`4Error: The kick note for ${player.name} could not be stored.`);
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
    
    // Validates that the given |days| is a sensible value for a ban. We put limits on this because
    // people will try to break this system, and they really shouldn't.
    validateDuration(context, days) {
        if (days < BanDatabase.kMinimumDuration || days > BanDatabase.kMaximumDuration) {
            context.respond(
                `4Error: The ban duration must be between ${BanDatabase.kMinimumDuration} ` +
                `and ${BanDatabase.kMaximumDuration} days.`);

            return false;
        }

        return true;
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

    // Validates the given |address|, which could be an individual IP address or a range, and
    // returns the number of IP addresses that would be affected by banning this.
    validateIpAndReturnAffectedAddresses(context, type, address) {
        const octets = address.split('.');
        const format = type === 'range' ? '37.48.87.*'
                                        : '37.48.87.211';

        if (octets.length !== 4) {
            context.respond(`4Error: The IP address must be in the format of ${format}.`);
            return 0;
        }

        let wildcards = [ false, false, false, false ];
        let wildcardCount = 0;

        for (let octetIndex = 0; octetIndex < octets.length; ++octetIndex) {
           if (octets[octetIndex] === '*' && type === 'range') {
               wildcards[octetIndex] = true;
               wildcardCount++;

               continue;
           }

           if (!/^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$/.test(octets[octetIndex])) {
               context.respond(`4Error: The IP address must be in the format of ${format}.`);
               return 0;
           }
        }

        let foundWildcard = false;
        for (const isWildcard of wildcards) {
            if (!isWildcard && foundWildcard) {
                context.respond(`4Error: Only more wildcards may follow a wildcard octet.`);
                return 0;
            }

            foundWildcard |= isWildcard;
        }

        return Math.pow(255, wildcardCount);
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
