// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Testing class that mimics the interface of the Bot class, as well as a full IRC connection with
// default configuration.
export class TestBot {
    delegate_ = null;
    config_ = null;
    nickname_ = null;

    connected_ = false;
    userModes_ = null;
    messages_ = null;

    get config() { return this.config_; }
    get nickname() { return this.nickname_; }

    isConnected() { return this.connected_ == true; }

    // Returns the messages that were written to this bot. Only available for testing purposes,
    // thus clarified as a suffix in the method name.
    get messagesForTesting() { return this.messages_; }

    constructor(delegate, config, servers, channels) {
        this.delegate_ = delegate;
        this.config_ = config || {
            nickname: 'NuwaniJS',
            password: null,
            optional: false,
            master: true,
        };

        this.nickname_ = this.config_.nickname;

        this.connected_ = false;
        this.userModes_ = new Map();
        this.messages_ = [];
    }

    connect() {
        this.connected_ = true;

        if (this.delegate_)
            this.delegate_.onBotConnected(this);
    }

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

    disconnect() {
        this.connected_ = false;

        if (this.delegate_)
            this.delegate_.onBotDisconnected();
    }

    dispose() {}
}
