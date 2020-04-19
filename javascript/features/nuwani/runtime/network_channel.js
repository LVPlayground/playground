// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CaseInsensitiveMap } from 'base/case_insensitive_map.js';
import { MessageSource } from 'features/nuwani/runtime/message_source.js';

// This class encapsulates the concept of a channel on an IRC server. We track the channel's topic,
// as well as the users who are in the channel, with their current user modes.
export class NetworkChannel {
    name_ = null;

    topic_ = null;
    topicSource_ = null;
    topicTime_ = null;

    users_ = null;

    // Gets the name of this channel.
    get name() { return this.name_; }

    // Gets the topic currently active in this channel.
    get topic() { return this.topic_; }

    // Gets the MessageSource describing the user who set the channel's topic.
    get topicSource() { return this.topicSource_; }

    // Gets the time (as a Date object) at which the topic was changed by the source.
    get topicTime() { return this.topicTime_; }

    // Gets the users who currently are in the channel. This is a map from nickname to user mode(s).
    get users() { return this.users_; }

    constructor(name) {
        this.name_ = name;
        this.users_ = new CaseInsensitiveMap();
    }

    // Called when a RPL_TOPIC (332) message has been received for this channel.
    onTopicMessage(topic) {
        this.topic_ = topic;
    }

    // Called when a RPL_TOPICWHOTIME (333) message has been received for this channel.
    onTopicWhoTimeMessage(who, time) {
        this.topicSource_ = new MessageSource(who);
        this.topicTime_ = new Date(time * 1000);
    }
    
    // Called when the user having |nickname| has joined this channel. Optionally the |initialMode|
    // can be set when the user mode is known at time of join.
    onJoin(nickname, initialMode) {
        if (this.users_.has(nickname))
            throw new Error(`Invalid join: ${nickname} is not on channel ${this.name_}.`);

        this.users_.set(nickname, initialMode || '');
    }

    // Called when the user identified as |nickname| has changed their name to |newNickname|.
    onNameChange(nickname, newNickname) {
        if (!this.users_.has(nickname))
            return;
        
        this.users_.set(newNickname, this.users_.get(nickname));
        this.users_.delete(nickname);
    }

    // Called when a MODE command has set the |flag| on the given |nickname|.
    onModeSet(nickname, flag) {
        let mode = this.users_.get(nickname);

        if (mode === undefined)
            throw new Error(`Invalid MODE update for ${nickname} on channel ${this.name_}.`);
        
        if (!mode.includes(flag))
            mode += flag;

        this.users_.set(nickname, mode);
    }

    // Called when a MODE command has removed the |flag| from the given |nickname|.
    onModeUnset(nickname, flag) {
        let mode = this.users_.get(nickname);

        if (mode === undefined)
            throw new Error(`Invalid MODE update for ${nickname} on channel ${this.name_}.`);
        
        if (mode.includes(flag))
            mode = mode.replace(flag, '');

        this.users_.set(nickname, mode);
    }

    // Called when the user having |nickname| has left this channel, either by choice or by action
    // of a channel operator (KICK).
    onLeave(nickname, command) {
        if (!this.users_.has(nickname) && command !== 'QUIT')
            throw new Error(`Invalid part: ${nickname} is not on channel ${this.name_}.`);

        this.users_.delete(nickname);
    }
}
