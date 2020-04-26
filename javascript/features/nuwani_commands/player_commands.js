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

    constructor(commandManager, PlayerDatabaseConstructor = PlayerDatabase) {
        this.commandManager_ = commandManager;
        this.database_ = new PlayerDatabaseConstructor();

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

        // !supported
        // !getvalue [key]
        // !setvalue [key] [value]
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
                deathFormat = 'have only died once themselves';
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
        this.commandManager_.removeCommand('players');
        this.commandManager_.removeCommand('getname');
        this.commandManager_.removeCommand('getid');
    }
}
