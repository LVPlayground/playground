// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { NetworkChannel } from 'features/nuwani/runtime/network_channel.js';

// The network tracker keeps track of state across the network, which channels are joined by
// the bot, and which users are on those channels with which access levels.
export class NetworkTracker {
    bot_ = null;

    channels_ = null;
    prefixes_ = null;
    settings_ = null;

    constructor(bot) {
        this.bot_ = bot;

        this.channels_ = new Map();
        this.prefixes_ = new Map();
        this.support_ = new Map();
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
                    if (rule === 'PREFIX' && value)
                        this.populatePrefixToUserModeCache(value);
                }
                break;

            case '332': {  // RPL_TOPIC
                if (message.params.length != 3)
                    throw new Error('Invalid RPL_TOPIC message received: ' + message);

                const [nickname, channel, topic] = message.params;
                if (this.channels_.has(channel))
                    this.channels_.get(channel).onTopicMessage(topic);

                break;
            }

            case '333': {  // RPL_TOPICWHOTIME
                if (message.params.length < 4)
                    throw new Error('Invalid RPL_TOPICWHOTIME message received: ' + message);

                const [nickname, channel, who, time] = message.params;
                if (this.channels_.has(channel))
                    this.channels_.get(channel).onTopicWhoTimeMessage(who, time);

                break;
            }

            case '353': {  // RPL_NAMREPLY
                if (message.params.length < 4)
                    throw new Error('Invalid RPL_NAMREPLY message received: ' + message);
                
                const [nickname, visibility, channelName, names] = message.params;
                if (!this.channels_.has(channelName))
                    throw new Error('Invalid channel in RPL_NAMREPLY message: ' + channelName);

                const channel = this.channels_.get(channelName);
                for (const name of names.split(' ')) {
                    const userMode = this.prefixes_.get(name[0]);

                    channel.onJoin(userMode ? name.substring(1)
                                            : name, userMode || '');
                }

                break;
            }

            case 'JOIN': {
                const [channelName] = message.params;
                
                if (message.source.nickname === this.bot_.nickname) {
                    if (this.channels_.has(channelName))
                        throw new Error('The bot has already joined channel: ' + channelName);
                    
                    this.channels_.set(channelName, new NetworkChannel(channelName));
                } else  if (!this.channels_.has(channelName)) {
                    throw new Error('Processing invalid JOIN for channel: ' + channelName);
                }

                this.channels_.get(channelName).onJoin(message.source.nickname);
                break;
            }

            case 'KICK': {
                const [channelName, nickname, reason] = message.params;

                if (!this.channels_.has(channelName))
                    throw new Error('Processing invalid KICK for unjoined channel: ' + channelName);
                
                if (nickname !== this.bot_.nickname)
                    this.channels_.get(channelName).onLeave(nickname);
                else
                    this.channels_.delete(channelName);
            }

            case 'NICK':
                if (message.source.nickname === this.bot_.nickname) {
                    this.bot_.onNicknameChange(message.params[0]);
                } else {
                    // TODO: Track name changes for other users on the network.
                }

                break;
            
            case 'PART': {
                const [channelName] = message.params;

                if (!this.channels_.has(channelName))
                    throw new Error('Processing invalid PART for unjoined channel: ' + channelName);

                if (message.source.nickname !== this.bot_.nickname)
                    this.channels_.get(channelName).onLeave(message.source.nickname);
                else
                    this.channels_.delete(channelName);

                break;
            }
        }
    }

    // Populates the PREFIX cache when configuration has been received from the server. This setting
    // determines the user modes that give users rights on any particular channel.
    populatePrefixToUserModeCache(prefix) {
        const divider = prefix.indexOf(')');
        if (divider === -1 || prefix.length != 2 * divider)
            throw new Error('Invalid PREFIX syntax found: ' + prefix);
        
        for (let i = 1; i < divider; ++i)
            this.prefixes_.set(prefix[divider + i], prefix[i]);
    }

    // Resets the network tracker to a default state. This should generally be called when the
    // connection with the server has been closed, and will be restarting soon.
    reset() {
        this.channels_ = new Map();
        this.support_ = new Map();
    }

    dispose() {
        this.support_ = null;
        this.channels_ = null;

        this.bot_ = null;
    }
}
