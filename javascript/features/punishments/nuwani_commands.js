// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/punishments/ban_database.js';
import { CommandBuilder } from 'components/commands/command_builder.js';

import { format } from 'base/format.js';
import { fromNow, relativeTime } from 'base/time.js';
import { isIpAddress, isIpRange, isPartOfRangeBan } from 'features/nuwani_commands/ip_utilities.js';

// Delay kicking the player by this duration of time, to make sure that they receive the messages.
export const kPlayerKickDelayMs = 1000;

// Implementation of a series of commands that enables administrators to revoke access from certain
// players, IP addresses and serial numbers from the server, as well as understanding why someone
// might not have access. This includes a series of tools for understanding IP and serial usage.
export class NuwaniCommands {
    commandManager_ = null;

    constructor(commandManager, announce, database) {
        this.commandManager_ = commandManager;
        this.announce_ = announce;
        this.database_ = database;

        // !addnote [nickname] [note]
        this.commandManager_.buildCommand('addnote')
            .description(`Adds a note to a player's permanent record.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'nickname', type: CommandBuilder.kTypeText },
                { name: 'note', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onAddNoteCommand.bind(this));

        // !ban ip [ip] [nickname] [days] [reason]
        // !ban range [ip range] [nickname] [days] [reason]
        // !ban serial [serial] [nickname] [days] [reason]
        // !ban [player] [days] [reason]
        this.commandManager_.buildCommand('ban')
            .description(`Revokes someone's ability to access the server.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('ip')
                .description(`Issue an IP-based ban.`)
                .parameters([
                    { name: 'ip', type: CommandBuilder.kTypeText },
                    { name: 'nickname', type: CommandBuilder.kTypeText },
                    { name: 'days', type: CommandBuilder.kTypeNumber },
                    { name: 'reason', type: CommandBuilder.kTypeText }])
                .build(NuwaniCommands.prototype.onBanIpCommand.bind(this))
            .sub('range')
                .description(`Issue an IP-based range ban.`)
                .parameters([
                    { name: 'ip range', type: CommandBuilder.kTypeText },
                    { name: 'nickname', type: CommandBuilder.kTypeText },
                    { name: 'days', type: CommandBuilder.kTypeNumber },
                    { name: 'reason', type: CommandBuilder.kTypeText }])
                .build(NuwaniCommands.prototype.onBanRangeCommand.bind(this))
            .sub('serial')
                .description(`Issue a serial-based ban.`)
                .parameters([
                    { name: 'serial', type: CommandBuilder.kTypeNumber },
                    { name: 'nickname', type: CommandBuilder.kTypeText },
                    { name: 'days', type: CommandBuilder.kTypeNumber },
                    { name: 'reason', type: CommandBuilder.kTypeText }])
                .build(NuwaniCommands.prototype.onBanSerialCommand.bind(this))
            .sub(CommandBuilder.kTypePlayer, 'player')
                .description(`Issue a ban on an in-game player.`)
                .parameters([
                    { name: 'days', type: CommandBuilder.kTypeNumber },
                    { name: 'reason', type: CommandBuilder.kTypeText }])
                .build(NuwaniCommands.prototype.onBanPlayerCommand.bind(this))
            .build(NuwaniCommands.prototype.onBanCommand.bind(this));

        // !banip
        this.commandManager_.buildCommand('banip')
            .description(`Deprecated command, use !ban ip instead.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(NuwaniCommands.prototype.onDeprecatedBanIpCommand.bind(this));

        // !isbanned [nickname | ip | ip range | serial]
        this.commandManager_.buildCommand('isbanned')
            .description(`Check whether someone is banned from the server.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{
                name: 'nickname | ip | ip range | serial', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onIsBannedCommand.bind(this));

        // !kick [player] [reason]
        this.commandManager_.buildCommand('kick')
            .description(`Forcefully disconnect a player from the server.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'player', type: CommandBuilder.kTypePlayer },
                { name: 'reason', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onKickPlayerCommand.bind(this));

        // !lastbans
        this.commandManager_.buildCommand('lastbans')
            .description(`Display the most recent bans issued on the server.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(NuwaniCommands.prototype.onLastBansCommand.bind(this));

        // !ipinfo [nickname | ip | ip range] [maxAge = 1095]
        this.commandManager_.buildCommand('ipinfo')
            .description(`Display information about a particular person.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'nickname | ip | ip range', type: CommandBuilder.kTypeText },
                { name: 'maxAge', type: CommandBuilder.kTypeNumber, defaultValue: 1095 }])
            .build(NuwaniCommands.prototype.onIpInfoCommand.bind(this));

        // !rexception
        // !rexception list [range]?
        // !rexception add [range] [nickname]
        // !rexception remove [range] [nickname]
        this.commandManager_.buildCommand('rexception')
            .description(`Manage exceptions to IP-based range bans.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('list')
                .description(`Display exceptions for a given IP range.`)
                .parameters([{ name: 'range', type: CommandBuilder.kTypeText, optional: true }])
                .build(NuwaniCommands.prototype.onRangeExceptionListCommand.bind(this))
            .sub('add')
                .description(`Add an exception for a given IP range.`)
                .parameters([
                    { name: 'range', type: CommandBuilder.kTypeText },
                    { name: 'nickname', type: CommandBuilder.kTypeText }])
                .build(NuwaniCommands.prototype.onRangeExceptionAddCommand.bind(this))
            .sub('remove')
                .description(`Remove an exception for a given IP range.`)
                .parameters([
                    { name: 'range', type: CommandBuilder.kTypeText },
                    { name: 'nickname', type: CommandBuilder.kTypeText }])
                .build(NuwaniCommands.prototype.onRangeExceptionRemoveCommand.bind(this))
            .build(NuwaniCommands.prototype.onRangeExceptionCommand.bind(this));

        // !serialinfo [nickname | serial] [maxAge = 1095]
        this.commandManager_.buildCommand('serialinfo')
            .description(`Display information about a particular serial.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'nickname | serial', type: CommandBuilder.kTypeText },
                { name: 'maxAge', type: CommandBuilder.kTypeNumber, defaultValue: 1095 }])
            .build(NuwaniCommands.prototype.onSerialInfoCommand.bind(this));

        // !why [nickname]
        this.commandManager_.buildCommand('why')
            .description(`Display a player's persistent record.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'nickname', type: CommandBuilder.kTypeText },
                { name: 'maxAge', type: CommandBuilder.kTypeNumber, defaultValue: 365 }])
            .build(NuwaniCommands.prototype.onWhyCommand.bind(this));

        // !unban [nickname | ip | ip range | serial] [reason]
        this.commandManager_.buildCommand('unban')
            .description(`Remove a ban for a specific person.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([
                { name: 'nickname | ip | ip range | serial', type: CommandBuilder.kTypeText },
                { name: 'reason', type: CommandBuilder.kTypeText }])
            .build(NuwaniCommands.prototype.onUnbanCommand.bind(this));
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
            if (subjectPlayer.account.isRegistered())
                subjectUserId = subjectPlayer.account.userId;

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

    // !ban
    //
    // Shows information about how to use the !ban command, since it's quite a complicated command.
    onBanCommand(context) {
        context.respondWithUsage('!ban [[player] | ip | range | serial]');
    }

    // !ban [player] [days] [reason]
    //
    // Bans the in-game |player| for a period of |days|, for the given |reason|. The ban will be an
    // IP-based ban on whichever address they are connected with right now.
    async onBanPlayerCommand(context, player, days, reason) {
        if (!this.validateDuration(context, days) || !this.validateNote(context, reason))
            return;
        
        let userId = player.account.userId ?? 0;

        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_BANNED, context.nickname, player.name, player.id, days, reason);

        player.sendMessage(Message.NUWANI_PLAYER_BANNED_NOTICE, context.nickname, days, reason);
        wait(kPlayerKickDelayMs).then(() => player.kick());  // actually remove them from the server

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeBan,
            banDurationDays: days,
            banIpAddress: player.ip,
            sourceNickname: context.nickname,
            subjectUserId: userId,
            subjectNickname: player.name,
            note: reason
        });

        context.respond(`3Success: ${player.name} has been banned from the game.`);
        if (!success)
            context.respond(`4Error: The ban note for ${player.name} could not be stored.`);
    }

    // !banip
    //
    // When an administrator on IRC types !banip. This has changed to "!ban ip", but we can be
    // courteous and show them an error message. Or maybe we'll just be a bit mean.
    onDeprecatedBanIpCommand(context) {
        const count = Math.floor(Math.random() * 4000) + 1500;
        context.respond('3Success: %d bans have been removed from the server.', count);

        wait(5000).then(() => {
            context.respond(
                `13Just kidding! Sorry ${context.nickname}, you probably want to use the new ` +
                `"!ban ip" command instead.`);
        });
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

        const existingBans = await this.database_.findActiveBans({ ip });
        if (existingBans.length) {
            const description = this.formatBanInformationString(existingBans[0]);

            context.respond(`4Error: This IP address ban is already covered by ${description}.`);
            return;
        }

        this.disconnectPlayersAffectedByBan(context.nickname, { ip }, days, reason);

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

        let limit = 1;
        switch (context.level) {
            case Player.LEVEL_MANAGEMENT:
                limit = BanDatabase.kMaximumIpRangeCountManagement;
                break;
            
            case Player.LEVEL_ADMINISTRATOR:
                limit = BanDatabase.kMaximumIpRangeCountAdministrator;
                break;
            
            default:
                throw new Error('Unexpected user level found: ' + context.level);
        }

        // Impose the |limit|, to err on the safe side.
        if (affected > limit) {
            context.respond(
                format(`4Error: You're not allowed to ban more than %d IP addresses at a ` +
                       `time. This ban would affect %d addresses.`, limit, affected));
            return;
        }

        const existingBans = await this.database_.findActiveBans({ range });
        if (existingBans.length) {
            const description = this.formatBanInformationString(existingBans[0]);

            context.respond(`4Error: This range ban is already covered by ${description}.`);
            return;
        }

        this.disconnectPlayersAffectedByBan(context.nickname, { range }, days, reason);

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

        const existingBans = await this.database_.findActiveBans({ serial });
        if (existingBans.length) {
            const description = this.formatBanInformationString(existingBans[0]);

            context.respond(`4Error: This serial ban is already covered by ${description}.`);
            return;
        }

        this.disconnectPlayersAffectedByBan(context.nickname, { serial }, days, reason);

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
    // Checks whether the given nickname, IP address or serial number is banned, and display details
    // about the ban(s) that they are currently subject to.
    async onIsBannedCommand(context, value) {
        const conditional = this.database_.deriveBanConditional(value);
        if (!conditional) {
            context.respond(
                `4Error: ${value} is neither a nickname, serial number or IP address.`);
            return;
        }

        const conditionalType = this.formatBanConditionalType(conditional);

        const bans = await this.database_.findActiveBans(conditional);
        if (!bans.length) {
            context.respond(`5Result: No bans could be found for the given ${conditionalType}.`);
            return;
        }

        let responseBans = [];
        for (const information of bans)
            responseBans.push(this.formatBanInformationString(information));

        context.respond(`5Result: ` + responseBans.join(', '));
    }

    // !kick [player] [reason]
    //
    // Kicks the in-game |player| from the game for the given |reason|. 
    async onKickPlayerCommand(context, player, reason) {
        if (!this.validateNote(context, reason))
            return;

        const userId = player.account.userId ?? 0;

        this.announce_().announceToAdministrators(
            Message.NUWANI_ADMIN_KICKED, context.nickname, player.name, player.id, reason);

        player.sendMessage(Message.NUWANI_PLAYER_KICKED_NOTICE, context.nickname, reason);
        wait(kPlayerKickDelayMs).then(() => player.kick());  // actually remove them from the server

        const success = await this.database_.addEntry({
            type: BanDatabase.kTypeKick,
            sourceNickname: context.nickname,
            subjectUserId: userId,
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
        const bans = await this.database_.getRecentBans(/* limit= */ 5);

        let responseBans = [];
        for (const information of bans)
            responseBans.push(this.formatBanInformationString(information));

        context.respond('5Most recent bans: ' + responseBans.join(', '));
    }

    // !ipinfo [nickname | ip | ip range] [maxAge = 1095]
    //
    // Displays information about the IP addresses used by |nickname|, or the nicknames who have
    // used the singular |ip| address or the given |ip range| in the past.
    async onIpInfoCommand(context, value, maxAge = 1095) {
        let results = null;

        if (isIpAddress(value) || isIpRange(value)) {
            results = await this.database_.findNicknamesForIpAddressOrRange({
                ip: value,
                maxAge,
            });

            if (!results || !results.total) {
                context.respond(`4Error: No nicknames found for the IP address ${value}.`);
                return;
            }
        } else {
            results = await this.database_.findIpAddressesForNickname({
                nickname: value,
                maxAge,
            });

            if (!results || !results.total) {
                context.respond(`4Error: No IP addresses found for the nickname ${value}.`);
                return;
            }
        }

        let suffix = '';
        if (results.total > results.entries.length)
            suffix = ` 15[${results.total - results.entries.length} omitted...]`;

        context.respond('5Result: ' + this.formatInfoResults(results) + suffix);
    }

    // !rexception
    //
    // Displays information on how to hold the !rexception command to make it not blow up.
    onRangeExceptionCommand(context) {
        context.respondWithUsage('!rexception [list | add | remove]');
    }

    // !rexception list [range]?
    //
    // Displays either the ranges which have exceptions added to them, or, when given, the list of
    // exceptions that have been created for the given |range|.
    async onRangeExceptionListCommand(context, range) {
        if (range) {
            const exceptions = await this.database_.getRangeExceptions(range);
            const formattedExceptions = exceptions.map(exception => {
                const attribution = `by ${exception.author}`;
                const usage =
                    `used ${format('%d', exception.tally)} time${exception.tally !== 1 ? 's' : ''}`;

                return `${exception.nickname} 14(${usage}, ${attribution})`;
            });

            if (!formattedExceptions.length) {
                context.respond(`4Error: No exceptions could be found for ${range}.`);
                return;
            }

            for (let message = 0; message < 2; ++message) {
                const selection = formattedExceptions.splice(0, 10).join(', ');
                if (!selection.length)
                    return;

                let suffix = '';

                if (message === 1 && formattedExceptions.length > 0)
                    suffix = ` 15[${formattedExceptions.length} omitted...]`;

                context.respond(`5Exceptions for ${range}: ${selection}${suffix}`);
            }

        } else {
            const ranges = await this.database_.getRangesWithExceptions();
            const formattedRanges = ranges.map(({ range, count }) => {
                return `${range} 14(${format('%d', count)} exception${count != 1 ? 's' : ''})`;
            });

            if (!formattedRanges.length) {
                context.respond('4Error: No range ban exceptions have been created.');
                return;
            }

            for (let message = 0; message < 2; ++message) {
                const selection = formattedRanges.splice(0, 10).join(', ');
                if (!selection.length)
                    return;

                let suffix = '';

                if (message === 1 && formattedRanges.length > 0)
                    suffix = ` 15[${formattedRanges.length} omitted...]`;

                context.respond(`5Ranges with exceptions: ${selection}${suffix}`);
            }
        }
    }

    // !rexception add [range] [nickname]
    //
    // Adds the given |nickname| to the list of exceptions for the |range| ban. The |range| has to
    // be a currently banned range in order for the exception to be added.
    async onRangeExceptionAddCommand(context, range, nickname) {
        const ban = await this.database_.findActiveBans({ range });

        let identifiedBan = false;
        for (const info of ban) {
            if (info.range !== range)
                continue;
            
            identifiedBan = true;
        }

        // No exact ban could be found, which means that there's absolutely no point in adding a new
        // range ban exception to it.
        if (!identifiedBan) {
            context.respond(`4Error: The exact range ${range} is not currently banned.`);
            return;
        }

        await this.database_.addRangeException(range, nickname, context.nickname);

        context.respond(
            `3Success: An exception has been added for ${nickname} on the ${range} IP range.`);
    }

    // !rexception remove [range] [nickname]
    //
    // Removes the given |nickname| from the list of exceptions on the given |range| ban.
    async onRangeExceptionRemoveCommand(context, range, nickname) {
        const exceptions = await this.database_.getRangeExceptions(range);
        for (const exception of exceptions) {
            if (exception.nickname !== nickname)
                continue;
            
            await this.database_.removeRangeException(exception.id);

            context.respond(
                `3Success: The exception for ${nickname} on ${range} has been removed.`);
            return;
        }

        context.respond(`4Error: ${nickname} does not have an exception for the ${range} range.`);
    }

    // !serialinfo [nickname | serial] [maxAge = 1095]
    //
    // Displays information about the serial numbers used by the given |nickname|, or the nicknames
    // who have used the given |serial| number in the past.
    async onSerialInfoCommand(context, value, maxAge = 1095) {
        let serialNumber = parseInt(value, 10);
        let results = null;
        let warning = '';

        if (!Number.isNaN(serialNumber) && serialNumber.toString().length == value.length) {
            results = await this.database_.findNicknamesForSerial({
                serial: serialNumber,
                maxAge,
            });

            if (!results || !results.total) {
                context.respond(`4Error: No nicknames found for the serial number ${value}.`);
                return;
            }

            if (results.commonSerial)
                warning = ' 4(common serial!)';

        } else {
            results = await this.database_.findSerialsForNickname({
                nickname: value,
                maxAge,
            });

            if (!results || !results.total) {
                context.respond(`4Error: No serial numbers found for the nickname ${value}.`);
                return;
            }
        }

        let suffix = '';
        if (results.total > results.entries.length)
            suffix = ` 15[${results.total - results.entries.length} omitted...]`;

        context.respond(`5Result${warning}: ${this.formatInfoResults(results)}${suffix}`);
    }

    // !unban [nickname | ip | ip range | serial] [reason]
    //
    // Lifts the ban identified on the given |ip| address, |ip range| or |serial| number. An exact
    // match is necessary in order to actually execute the unban.
    async onUnbanCommand(context, value, reason) {
        const conditional = this.database_.deriveBanConditional(value);
        if (!conditional) {
            context.respond(
                `4Error: ${value} is neither a nickname, IP address, IP range or serial number.`);
            return;
        }

        if (!this.validateNote(context, reason))
            return;

        const conditionalType = this.formatBanConditionalType(conditional);

        const bans = await this.database_.findActiveBans(conditional);
        if (!bans.length) {
            context.respond(`4Error: No bans could be found for the given ${conditionalType}.`);
            return;
        }

        let strictMatchingBans = [];
        let nameMatchingBans = [];

        // We require an exact match on the |reason| in order to unban them, to avoid ambiguity in
        // _what_ is being unbanned: IP bans should not lift full range bans by accident.
        for (const information of bans) {
            if (information.nickname === value)
                nameMatchingBans.push(information);

            if (information.ip !== value && information.range !== value &&
                    (!information.serial || information.serial.toString() !== value)) {
                continue;
            }

            strictMatchingBans.push(information);
        }

        // If there's a single entry in |strictMatchingBans|, it's very clear what they want to be
        // unbanned. Similarly, if there's a single ban in |nameMatchingBans| then we can derive the
        // necessary information from that as well.
        if (strictMatchingBans.length === 1 || nameMatchingBans.length == 1) {
            const matchingBan =
                strictMatchingBans.length == 1 ? strictMatchingBans[0] : nameMatchingBans[0];

            // Add the unban notice carrying |reason| to the player's permanent record.
            await this.database_.addEntry({
                type: BanDatabase.kTypeUnban,
                sourceNickname: context.nickname,
                subjectNickname: matchingBan.nickname,
                note: reason,
            })

            // Actually lift the ban, by changing the expiration date to right now.
            await this.database_.unban(matchingBan.id);

            // The actual medium that the |matchingBan| described.
            const banMedium = matchingBan.ip || matchingBan.range || matchingBan.serial;

            context.respond(
                `3Success: ${matchingBan.nickname} 14(${banMedium}) has been unbanned.`);
            return;
        }

        let responseBans = [];

        // Otherwise it's ambiguous what ban the user intended to be lifted. Display output that is
        // similar to the !isbanned command, enabling them to make a more specific choice.
        for (const information of bans)
            responseBans.push(this.formatBanInformationString(information));

        context.respond(
            `4Error: There are no strict matching bans for "${value}", please be more specific.`);
        context.respond(`5Result: ` + responseBans.join(', '));
    }

    // !why [nickname] [maxAge=365]
    //
    // Displays the recent entries in the permanent record of the given |player|.
    async onWhyCommand(context, nickname, maxAge = kDefaultPlayerRecordRecencyDays) {
        const { total, logs } = await this.database_.getLogEntries({ nickname, maxAge, limit: 5 });
        if (!logs.length) {
            context.respond(`4Error: No logs could be found for ${nickname}.`);
            return;
        }

        const url = 'https://profile.sa-mp.nl/bans/' + encodeURIComponent(nickname);

        context.respond(`4*** Player log for ${nickname} (${total} items) - ${url}`);
        for (const entry of logs) {
            const date = entry.date.toISOString().replace(/^(.+?)T(.+?)\..*$/, '$1 $2');
            const attribution = `${entry.type} by ${entry.issuedBy}`;
            const reason = entry.reason;

            const banValue = entry.ip || entry.range || entry.serial;
            const banDuration = entry.expiration.getTime() > entry.date.getTime()
                    ? ', ' + relativeTime({ date1: entry.date, date2: entry.expiration }).text
                    : '';

            const ban = banValue ? ` 14(${banValue}${banDuration})` : '';

            context.respond(`4[${date}] 3(${attribution}): ${reason}${ban}`);
        }
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

        return Math.pow(256, wildcardCount);
    }

    // Disconnects players from the server who are affected by the ban, which could either be an
    // individual |ip| address, an IP |range| or a |serial| number. Will inform both the user and
    // in-game administrators of this action.
    disconnectPlayersAffectedByBan(nickname, ban, days, reason) {
        let bannedPlayers = [];

        // Check if the ban would apply to anyone currently in-game. If so, they are to be removed
        // from the server, and a notice will be sent to in-game administrators as well.
        server.playerManager.forEach(player => {
            if (ban.hasOwnProperty('ip')) {
                if (player.ip !== ban.ip)
                    return;  // IP-based ban, and the player has another IP address.

            } else if (ban.hasOwnProperty('range')) {
                if (!isPartOfRangeBan(player.ip, ban.range))
                    return;

            } else if (ban.hasOwnProperty('serial')) {
                if (player.serial !== ban.serial)
                    return;  // serial-based ban, and the player has another serial.

            } else {
                throw new Error('Unknown properties of the |given| ban, cannot proceed.');
            }

            bannedPlayers.push([ player.name, player.id ]);

            player.sendMessage(Message.NUWANI_PLAYER_BANNED_NOTICE, nickname, days, reason);
            wait(kPlayerKickDelayMs).then(() => player.kick());
        });

        // Tell administrators about the ban(s), in one message per three affected users.
        while (bannedPlayers.length > 0) {
            const group = bannedPlayers.splice(0, 3);

            const identities = group.map(info => `${info[0]} (Id:${info[1]})`);
            const identitiesText = identities.join(', ');

            this.announce_().announceToAdministrators(
                Message.NUWANI_ADMIN_BANNED_GROUP, nickname, identitiesText, days, reason);
        }
    }

    // Formats the given |banInformation| into a string that's convenient for sharing on IRC.
    formatBanInformationString(banInformation) {
        const { nickname, issuedBy } = banInformation;
        const expression = banInformation.ip ?? banInformation.range ?? banInformation.serial;
        const timeDifference = fromNow({ date: banInformation.date });

        return `${nickname} 14(${expression}, ${timeDifference} by ${issuedBy})`;
    }

    // Converts the given |conditional| to a string. It requires at least one of the type fields to
    // be set, and will return a friendly, textual representation about it.
    formatBanConditionalType(conditional) {
        if (conditional.nickname)
            return 'nickname';
        if (conditional.ip)
            return 'IP address';
        if (conditional.range)
            return 'IP range';
        if (conditional.serial)
            return 'serial number';

        throw new Error('Unrecognised ban conditional: ' + String(conditional));
    }

    // Formats the |results|, for either !ipinfo or !serialinfo, into a string that's ready to be
    // displayed on the network.
    formatInfoResults(results) {
        let resultText = [];

        for (const entry of results.entries) {
            const meta = [];

            if (entry.common)
                meta.push('4common14');

            if (entry.sessions > 1)
                meta.push(format('%dx', entry.sessions));

            if (meta.length >= 1)
                resultText.push(`${entry.text} 14(${meta.join(', ')})`);
            else
                resultText.push(entry.text);
        }

        return resultText.join(', ');
    }

    dispose() {
        this.commandManager_.removeCommand('unban');
        this.commandManager_.removeCommand('why');
        this.commandManager_.removeCommand('serialinfo');
        this.commandManager_.removeCommand('rexception');
        this.commandManager_.removeCommand('ipinfo');
        this.commandManager_.removeCommand('lastbans');
        this.commandManager_.removeCommand('kick');
        this.commandManager_.removeCommand('isbanned');
        this.commandManager_.removeCommand('banip');
        this.commandManager_.removeCommand('ban');
        this.commandManager_.removeCommand('addnote');
    }
}
