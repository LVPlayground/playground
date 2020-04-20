// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Testing class that mimics the interface of the Bot class, as well as a full IRC connection with
// default configuration.
export class TestBot {
    config_ = null;
    nickname_ = null;

    userModes_ = null;
    messages_ = null;

    get config() { return this.config_; }
    get nickname() { return this.nickname_; }

    // Returns the messages that were written to this bot. Only available for testing purposes,
    // thus clarified as a suffix in the method name.
    get messagesForTesting() { return this.messages_; }

    constructor() {
        this.config_ = {
            nickname: 'NuwaniJS',
            password: null,
            master: true,
        };

        this.nickname_ = this.config_.nickname;

        this.userModes_ = new Map();
        this.messages_ = [];
    }

    connect() {}

    write(message) {
        this.messages_.push(message);
    }

    isChannelName(target) {
        return target.startsWith('#');
    }
    
    getUserModesInEchoChannel(nickname) {
        return this.userModes_.get(nickname);
    }

    setUserModesInEchoChannelForTesting(nickname, userModes) {
        this.userModes_.set(nickname, userModes);
    }

    removeUserFromEchoChannelForTesting(nickname) {
        this.userModes_.delete(nickname);
    }

    disconnect() {}

    dispose() {}
}
