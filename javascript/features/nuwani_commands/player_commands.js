// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { PlayerDatabase } from 'features/nuwani_commands/player_database.js';

import { format } from 'base/string_formatter.js';

// Time durations, in seconds, for the named periods of time.
const kMinuteSeconds = 60;
const kHourSeconds = kMinuteSeconds * 60;
const kDaySeconds = kHourSeconds * 24;
const kMonthSeconds = kDaySeconds * 30.5;
const kYearSeconds = kDaySeconds * 365;

// Implementation of a series of commands that allow the state of players to be modified, both of
// in-game players and of those who aren't currently online. 
export class PlayerCommands {
    commandManager_ = null;
    database_ = null;

    constructor(commandManager, passwordSalt, PlayerDatabaseConstructor = PlayerDatabase) {
        this.commandManager_ = commandManager;
        this.database_ = new PlayerDatabaseConstructor(passwordSalt);

        // !addalias [nickname] [alias]
        this.commandManager_.buildCommand('addalias')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                { name: 'alias', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onAddAliasCommand.bind(this));

        // !aliases [nickname]
        this.commandManager_.buildCommand('aliases')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'nickname', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onAliasesCommand.bind(this));
        
        // !removealias [nickname] [alias]
        this.commandManager_.buildCommand('removealias')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                { name: 'alias', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onRemoveAliasCommand.bind(this));

        // !getid [nickname]
        this.commandManager_.buildCommand('getid')
            .parameters([{ name: 'nickname', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));

        // !getname [id]
        this.commandManager_.buildCommand('getname')
            .parameters([{ name: 'id', type: CommandBuilder.PLAYER_PARAMETER }])
            .build(PlayerCommands.prototype.onGetPlayerCommand.bind(this));

        // !players
        // !players [nickname]
        this.commandManager_.buildCommand('players')
            .sub(CommandBuilder.WORD_PARAMETER)
                .build(PlayerCommands.prototype.onPlayerInfoCommand.bind(this))
            .build(PlayerCommands.prototype.onPlayerOnlineListCommand.bind(this));

        // !history [nickname]
        this.commandManager_.buildCommand('history')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .parameters([{ name: 'nickname', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onHistoryCommand.bind(this));

        // !changename [nickname] [newNickname]
        this.commandManager_.buildCommand('changename')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                { name: 'newNickname', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onChangeNameCommand.bind(this));

        // !changepass [nickname]
        this.commandManager_.buildCommand('changepass')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([{ name: 'nickname', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onChangePasswordCommand.bind(this));

        // !supported
        this.commandManager_.buildCommand('supported')
            .restrict(Player.LEVEL_MANAGEMENT)
            .build(PlayerCommands.prototype.onSupportedCommand.bind(this));

        // !getvalue [field]
        this.commandManager_.buildCommand('getvalue')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                { name: 'field', type: CommandBuilder.WORD_PARAMETER }])
            .build(PlayerCommands.prototype.onGetValueCommand.bind(this));

        // !setvalue [field] [value]
        this.commandManager_.buildCommand('setvalue')
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([
                { name: 'nickname', type: CommandBuilder.WORD_PARAMETER },
                { name: 'field', type: CommandBuilder.WORD_PARAMETER },
                { name: 'value', type: CommandBuilder.SENTENCE_PARAMETER }])
            .build(PlayerCommands.prototype.onSetValueCommand.bind(this));
    }

    // !addalias [nickname] [alias]
    //
    // Adds the given |alias| to |nickname|'s account as an alternative username. Our system allows
    // players to be identified with any number of names.
    async onAddAliasCommand(context, nickname, alias) {
        if (server.playerManager.getByName(nickname) !== null ||
                server.playerManager.getByName(alias) !== null) {
            context.respond('4Error: Cannot change the details of in-game players.');
            return;
        }

        try {
            await this.database_.addAlias(nickname, alias);
            context.respond(`3Success: ${alias} has been added as an alias for ${nickname}.`);
        } catch (exception) {
            context.respond(`4Error: ${exception.message}`);
        }
    }

    // !aliases [nickname]
    //
    // Lists the aliases associated with the |nickname|. This may be an alias itself.
    async onAliasesCommand(context, nickname) {
        const result = await this.database_.getAliases(nickname);
        if (!result) {
            context.respond(`4Error: The player ${nickname} could not be found in the database.`);
            return;
        }

        const aliases = result.aliases.length ? result.aliases.sort().join(', ')
                                              : '';

        context.respond(`10Aliases of ${result.nickname}: ${aliases}`);
    }

    // !removealias [nickname] [alias]
    //
    // Removes the given |alias| from |nickname|'s account. It will immediately become available for
    // use by other players again.
    async onRemoveAliasCommand(context, nickname, alias) {
        if (server.playerManager.getByName(nickname) !== null ||
                server.playerManager.getByName(alias) !== null) {
            context.respond('4Error: Cannot change the details of in-game players.');
            return;
        }

        try {
            await this.database_.removeAlias(nickname, alias);
            context.respond(`3Success: ${alias} has been removed as an alias for ${nickname}.`);
        } catch (exception) {
            context.respond(`4Error: ${exception.message}`);
        }
    }

    // !history [nickname]
    //
    // Lists the user's previous nicknames and aliases, to be able to better identify someone's
    // past and the skeletons hiding in their closet.
    async onHistoryCommand(context, nickname) {
        const result = await this.database_.getNicknameHistory(nickname);
        if (result === null || !result.length) {
            context.respond(`4Error: No history for ${nickname} could be found in the database.`);
            return;
        }

        context.respond(`5Previous nicknames: ${result.join(', ')}`);
    }

    // !changename [nickname] [newNickname]
    //
    // Requests the user identified by |nickname| to be identified by |newNickname| instead. The old
    // name will become immediately available for use by other players again.
    async onChangeNameCommand(context, nickname, newNickname) {
        if (server.playerManager.getByName(nickname) !== null ||
                server.playerManager.getByName(newNickname) !== null) {
            context.respond('4Error: Cannot change the details of in-game players.');
            return;
        }

        try {
            await this.database_.changeName(nickname, newNickname);
            context.respond(`3Success: ${nickname} will henceforth be known as ${newNickname}.`);
        } catch (exception) {
            context.respond(`4Error: ${exception.message}`);
        }
    }

    // !changepass [nickname]
    //
    // Changes the password of the given |nickname| to a new, randomly generated password that will
    // be shared back to issues of this command. We disallow setting arbitrary new passwords.
    async onChangePasswordCommand(context, nickname) {
        if (server.playerManager.getByName(nickname) !== null) {
            context.respond('4Error: Cannot update the password of in-game players.');
            return;
        }

        let password = '';

        // Generate a random password based on the |kPasswordCharacters| that is |kPasswordLength|
        // characters in length. The characters {o, O, 0} and {l, I, 1} have been removed to make
        // it easier for people to actually use this password if they so desire.
        const kPasswordCharacters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const kPasswordLength = 12;

        for (let char = 0; char < kPasswordLength; ++char) {
            password +=
                kPasswordCharacters.charAt(Math.floor(Math.random() * kPasswordCharacters.length));
        }

        // Write the new password to the database for this player. Failures imply that the user's
        // account could not be found in the database.
        const result = await this.database_.changePassword(nickname, password);
        if (result) {
            context.respond(
                `3Success: The password of ${nickname} has been updated to ${password}.`);
        } else {
            context.respond(`4Error: The player ${nickname} could not be found in the database.`);
        }
    }

    // !supported
    //
    // Displays a list of the supported fields in the player account data store that can be read and
    // updated by the commands. Type and table information is omitted.
    onSupportedCommand(context) {
        const supported = Object.keys(this.database_.getSupportedFields()).sort();
        context.respond('5Supported fields: ' + supported.join(', '));
    }

    // !getvalue [nickname] [field]
    //
    // Displays the given |field| from |nickname|'s account data. Only available to management.
    async onGetValueCommand(context, nickname, field) {
        try {
            const value = await this.database_.getPlayerField(nickname, field);
            context.respond(`5Value of "${field}": ${value}`);
        } catch (exception) {
            context.respond(`4Error: ${exception.message}`);
        }
    }

    // !setvalue [nickname] [field] [value]
    //
    // Updates the given |field| in the |nickname|'s account data to the given |value|. Values will
    // be treated differently on their type. Storage is managed by the PlayerDatabase.
    async onSetValueCommand(context, nickname, field, value) {
        if (server.playerManager.getByName(nickname) !== null) {
            context.respond('4Error: Cannot update account data of in-game players.');
            return;
        }

        try {
            const writtenValue = await this.database_.updatePlayerField(nickname, field, value);
            context.respond(`3Success: The value has been updated to "${writtenValue}".`);
        } catch (exception) {
            context.respond(`4Error: ${exception.message}`);
        }
    }

    // !getid [nickname]
    // !getname [id]
    //
    // Finds a specific player by either their nickname or assigned player Id. Both commands will
    // share an identical output, so we only have to implement this once.
    onGetPlayerCommand(context, player) {
        context.respond(`10*** 05${player.name} (Id:${player.id})`);
    }
    
    // !players
    //
    // Lists the players who are connected to Las Venturas Playground rightn ow, including their
    // registration status and, if any, level. The players will be alphabetically ordered.
    onPlayerOnlineListCommand(context) {
        let players = [];
        let formattedPlayers = [];

        // (1) Establish the list of players to consider for the output. NPCs are ignored, and the
        // levels of undercover people are hidden as well.
        server.playerManager.forEach(player => {
            if (player.isNonPlayerCharacter())
                return;
            
            const name = player.name;
            const registered = player.isRegistered();
            const vip = player.isVip();
            const level = player.isUndercover() ? Player.LEVEL_PLAYER
                                                : player.level;

            players.push({ name, registered, vip, level });
        });

        // (2) Sort the list of |players| alphabetically for display. 
        players.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        
        // (3) Format each of the entries in |players| in accordance with the information we've
        // gathered on them.
        for (const info of players) {
            let color = null;

            if (!info.registered) {
                color = '14';  // dark grey
            } else {
                switch (info.level) {
                    case Player.LEVEL_PLAYER:
                        if (info.vip)
                            color = '12';  // dark blue

                        break;

                    case Player.LEVEL_ADMINISTRATOR:
                        color = '04';  // red
                        break;

                    case Player.LEVEL_MANAGEMENT:
                        color = '03';  // dark green
                        break;
                }
            }

            formattedPlayers.push(color + info.name + (color ? '' : ''));
        }

        // (4) Output the formatted result to the requester on IRC.
        if (!formattedPlayers.length)
            context.respond('7There are currently no players online.');
        else
            context.respond(`7Online players (${players.length}): ` + formattedPlayers.join(', '));
    }

    // !players [nickname]
    //
    // Displays more information about the player identified by the given |nickname|, which may
    // be an alias. Statistics will be shared, including a link to their profile.
    async onPlayerInfoCommand(context, nickname) {
        const summary = await this.database_.getPlayerSummaryInfo(nickname);
        if (!summary) {
            context.respond(`4Error: Sorry, the player ${nickname} has not registered ` +
                            `with Las Venturas Playground.`);
            return;
        }

        let onlineTimeFormat = '';
        let deathmatchFormat = '';
        let levelFormat = '%s is ';
        let recencyFormat = '';

        let params = [nickname];

        // (1) Format the level information in a clear way.
        switch (summary.level) {
            case 'Management':
                levelFormat += 'a 03Management member';
                break;

            case 'Administrator':
                levelFormat += 'an 04administrator';
                break;

            default:
                levelFormat += summary.is_vip ? 'a 12VIP'
                                              : 'a player';
                break;
        }

        // (2) Format the online time in an appropriate way.
        if (summary.online_time === 0) {
            onlineTimeFormat = 'never been online yet';
        } else {
            onlineTimeFormat = 'been online for ';

            const exploded = this.explodeOnlineTime(summary.online_time);
            if (exploded.hours > 0 && exploded.minutes > 0) {
                onlineTimeFormat += '%d hour' + (exploded.hours == 1 ? '' : 's');
                onlineTimeFormat += ' and %d minute' + (exploded.minutes == 1 ? '' : 's');
                params.push(exploded.hours);
                params.push(exploded.minutes);
            } else if (exploded.hours > 0) {
                onlineTimeFormat += '%d hour' + (exploded.hours == 1 ? '' : 's');
                params.push(exploded.hours);
            } else if (exploded.minutes > 0) {
                onlineTimeFormat += '%d minute' + (exploded.minutes == 1 ? '' : 's');
                params.push(exploded.minutes);
            } else {
                onlineTimeFormat += '%d second' + (exploded.seconds == 1 ? '' : 's');
                params.push(exploded.seconds);
            }
        }

        // (3) Format the deathmatch information in an appropriate way.
        if (summary.kill_count > 0 || summary.death_count > 0) {
            let killFormat = '';
            if (summary.kill_count === 0) {
                killFormat = `They haven't killed anyone yet`;
            } else if (summary.killFormat === 1) {
                killFormat = 'They have killed one person';
            } else {
                killFormat = 'They have killed %d people';
                params.push(summary.kill_count);
            }

            let join = '';
            if (summary.kill_count > 0 && summary.death_count > 0) {
                join = ' and ';
            } else {
                join = ', but ';
            }

            let deathFormat = '';
            if (summary.death_count === 0) {
                deathFormat = 'have never died themselves yet';
            } else if (summary.death_count === 1) {
                deathFormat = 'have died once themselves';
            } else {
                deathFormat = 'have died %d times themselves';
                params.push(summary.death_count);
            }

            let ratio = '';
            if (summary.kill_count > 0 && summary.death_count > 0) {
                ratio = ', giving them a ratio of %d';
                params.push(Math.round((summary.kill_count / summary.death_count) * 100) / 100);
            }

            deathmatchFormat = killFormat + join + deathFormat + ratio + '. ';
        }

        // (4) Format the information about when they were last seen.
        if (summary.last_seen > 0) {
            recencyFormat = '%s was last seen online ';
            params.push(nickname);

            const exploded = this.explodeLastSeen(summary.last_seen);
            if (exploded.years === 1) {
                recencyFormat += 'a year ago. ';
            } else if (exploded.years > 1) {
                recencyFormat += '%d years ago. ';
                params.push(exploded.years);
            } else if (exploded.months === 1) {
                recencyFormat += 'a month ago. ';
            } else if (exploded.months > 0) {
                recencyFormat += '%d months ago. ';
                params.push(exploded.months);
            } else if (exploded.days === 1) {
                recencyFormat += 'yesterday. ';
            } else if (exploded.days > 0) {
                recencyFormat += '%d days ago. ';
                params.push(exploded.days);
            } else {
                recencyFormat += 'earlier today. ';
            }
        }

        // (5) Append a link to their profile page on the website.
        params.push('https://profile.sa-mp.nl/' + encodeURIComponent(nickname));

        // Now all that remains to be done is to compile the actual format for this player's summary
        // and respond to the IRC command with the final result.
        const messageFormat =
            `${levelFormat} who has ${onlineTimeFormat}. ${deathmatchFormat}${recencyFormat}%s`;
        
        context.respond(format(messageFormat, ...params));
    }

    // Explodes the given |time| in seconds to a structure containing hours, minutes and seconds.
    explodeOnlineTime(time) {
        const hours = Math.floor(time / kHourSeconds);
        const minutes = Math.floor(time / kMinuteSeconds) - hours * 60;
        const seconds = time - (hours * kHourSeconds) - (minutes * kMinuteSeconds);

        return { hours, minutes, seconds };
    }

    // Explodes the given |time| in seconds to a structure containing years, months and days. The
    // exploded values are not accurate, but instead are rounded towards the closest value to
    // give the displayed information more colour. (Only one unit should be shown.)
    explodeLastSeen(time) {
        const actualYears = Math.floor(time / kYearSeconds);
        const roundedYears = Math.round(time / kYearSeconds);

        const actualMonths = Math.floor(time / kMonthSeconds) - actualYears * 12;
        const roundedMonths = Math.round(time / kMonthSeconds) - actualYears * 12;

        const actualDays = Math.floor(time / kDaySeconds) - (actualMonths * kMonthSeconds) -
                                                            (actualYears * kYearSeconds);

        return {
            years: roundedYears,
            months: (!roundedYears && roundedMonths === 1) ? actualMonths
                                                           : roundedMonths,
            days: actualDays,
        };
    }

    dispose() {
        this.commandManager_.removeCommand('setvalue');
        this.commandManager_.removeCommand('getvalue');
        this.commandManager_.removeCommand('supported');
        this.commandManager_.removeCommand('changepass');
        this.commandManager_.removeCommand('changename');
        this.commandManager_.removeCommand('history');
        this.commandManager_.removeCommand('players');
        this.commandManager_.removeCommand('getname');
        this.commandManager_.removeCommand('getid');
        this.commandManager_.removeCommand('removealias');
        this.commandManager_.removeCommand('aliases');
        this.commandManager_.removeCommand('addalias');
    }
}
