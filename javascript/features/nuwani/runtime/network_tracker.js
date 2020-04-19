// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ModeParser } from 'features/nuwani/runtime/mode_parser.js';
import { NetworkChannel } from 'features/nuwani/runtime/network_channel.js';

// The network tracker keeps track of state across the network, which channels are joined by
// the bot, and which users are on those channels with which access levels.
export class NetworkTracker {
    bot_ = null;

    channels_ = null;
    levelPrefixes_ = null;
    levelModes_ = null;
    settings_ = null;

    modeParser_ = null;

    constructor(bot) {
        this.bot_ = bot;

        this.channels_ = new Map();
        this.levelPrefixes_ = new Map();
        this.levelModes_ = new Map();
        this.support_ = new Map();

        this.modeParser_ = new ModeParser();
    }

    // Gets the channels that the bot has joined on the current network.
    get channels() { return this.channels_; }

    // Returns the support |rule|'s value, the boolean true when it's a flag, or null when unknown.
    getSupportRule(rule) { return this.support_.get(rule); }

    // Handles the given |message|. The network tracker will only inspect incoming messages, and
    // adjust our internal state based on what's learned through them.
    handleMessage(message) {
        switch (message.command) {
            case '005':  // RPL_ISUPPORT
                for (const param of message.params) {
                    const [rule, value] = param.split('=');

                    // Ignore rule that aren't in uppercase, as descriptive text usually follows.
                    if (rule !== rule.toUpperCase())
                        continue;

                    this.support_.set(rule, value || true);

                    switch (rule) {
                        case 'PREFIX':
                            this.populateChannelModePrefixCaches(value);
                            this.modeParser_.setChannelPrefixes(value);
                            break;
                        case 'CHANMODES':
                            this.modeParser_.setChannelModes(value);
                            break;
                    }
                }

                break;

            case '332': {  // RPL_TOPIC
                if (message.params.length != 3)
                    throw new Error('Invalid RPL_TOPIC message received: ' + message);

                const [nickname, channel, topic] = message.params;

                const lowerCaseChannel = channel.toLowerCase();
                if (this.channels_.has(lowerCaseChannel))
                    this.channels_.get(lowerCaseChannel).onTopicMessage(topic);

                break;
            }

            case '333': {  // RPL_TOPICWHOTIME
                if (message.params.length < 4)
                    throw new Error('Invalid RPL_TOPICWHOTIME message received: ' + message);

                const [nickname, channel, who, time] = message.params;

                const lowerCaseChannel = channel.toLowerCase();
                if (this.channels_.has(lowerCaseChannel))
                    this.channels_.get(lowerCaseChannel).onTopicWhoTimeMessage(who, time);

                break;
            }

            case '353': {  // RPL_NAMREPLY
                if (message.params.length < 4)
                    throw new Error('Invalid RPL_NAMREPLY message received: ' + message);
                
                const [nickname, visibility, channelName, names] = message.params;

                const lowerCaseChannelName = channelName.toLowerCase();
                if (!this.channels_.has(lowerCaseChannelName))
                    throw new Error('Invalid channel in RPL_NAMREPLY message: ' + channelName);

                const channel = this.channels_.get(lowerCaseChannelName);
                for (const name of names.split(' ')) {
                    const userMode = this.levelPrefixes_.get(name[0]);
                    const cleanName = userMode ? name.substring(1) : name;

                    // Some IRCds include the recent joinee in the NAMES reply, before the actual
                    // JOIN comes through. This leads to an interesting race condition.
                    if (cleanName === this.bot_.nickname)
                        continue;

                    channel.onJoin(cleanName, userMode || '');
                }

                break;
            }

            case 'JOIN': {
                const [channelName] = message.params;
                const lowerCaseChannelName = channelName.toLowerCase();

                if (message.source.nickname === this.bot_.nickname) {
                    if (this.channels_.has(lowerCaseChannelName))
                        throw new Error('The bot has already joined channel: ' + channelName);
                    
                    this.channels_.set(lowerCaseChannelName, new NetworkChannel(channelName));
                } else  if (!this.channels_.has(lowerCaseChannelName)) {
                    throw new Error('Processing invalid JOIN for channel: ' + channelName);
                }

                this.channels_.get(lowerCaseChannelName).onJoin(message.source.nickname);
                break;
            }

            case 'KICK': {
                const [channelName, nickname, reason] = message.params;
                const lowerCaseChannelName = channelName.toLowerCase();

                if (!this.channels_.has(lowerCaseChannelName))
                    throw new Error('Processing invalid KICK for unjoined channel: ' + channelName);
                
                if (nickname !== this.bot_.nickname)
                    this.channels_.get(lowerCaseChannelName).onLeave(nickname, 'KICK');
                else
                    this.channels_.delete(lowerCaseChannelName);
                
                break;
            }

            case 'MODE': {
                const [target] = message.params;

                if (this.channels_.has(target)) {
                    const mutations = this.modeParser_.parse(message);
                    const channel = this.channels_.get(target);

                    mutations.set.forEach(mutation => {
                        if (!this.levelModes_.has(mutation.flag))
                            return;
                        
                        channel.onModeSet(mutation.param, mutation.flag);
                    });

                    mutations.unset.forEach(mutation => {
                        if (!this.levelModes_.has(mutation.flag))
                            return;
                        
                        channel.onModeUnset(mutation.param, mutation.flag);
                    });
                }

                break;
            }

            case 'NICK':
                if (message.source.nickname === this.bot_.nickname)
                    this.bot_.onNicknameChange(message.params[0]);

                for (const channel of this.channels_.values())
                    channel.onNameChange(message.source.nickname, message.params[0]);

                break;
            
            case 'PART': {
                const [channelName] = message.params;
                const lowerCaseChannelName = channelName.toLowerCase();

                if (!this.channels_.has(lowerCaseChannelName))
                    throw new Error('Processing invalid PART for unjoined channel: ' + channelName);

                if (message.source.nickname !== this.bot_.nickname) {
                    this.channels_.get(lowerCaseChannelName).onLeave(
                        message.source.nickname, 'PART');
                } else {
                    this.channels_.delete(lowerCaseChannelName);
                }

                break;
            }

            case 'PING':
                this.bot_.write(`PONG :${message.params[0]}`)
                break;

            case 'QUIT': {
                for (const channel of this.channels_.values())
                    channel.onLeave(message.source.nickname, 'QUIT');
                
                break;
            }
        }
    }

    // Populates the PREFIX cache when configuration has been received from the server. This setting
    // determines the user modes that give users rights on any particular channel.
    populateChannelModePrefixCaches(prefix) {
        const divider = prefix.indexOf(')');
        if (divider === -1 || prefix.length != 2 * divider)
            throw new Error('Invalid PREFIX syntax found: ' + prefix);
        
        for (let i = 1; i < divider; ++i) {
            this.levelPrefixes_.set(prefix[divider + i], prefix[i]);
            this.levelModes_.set(prefix[i], prefix[divider + i]);
        }
    }

    // Resets the network tracker to a default state. This should generally be called when the
    // connection with the server has been closed, and will be restarting soon.
    reset() {
        this.channels_.clear();
        this.levelModes_.clear();
        this.levelPrefixes_.clear();
        this.support_.clear();
    }

    dispose() {
        this.support_ = null;
        this.channels_ = null;

        this.bot_ = null;
    }
}
