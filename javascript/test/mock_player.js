// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked player. Has the same interface and abilities as a real Player object, except that it does
// not rely on the SA-MP server to be available, nor communicates with Pawn.
class MockPlayer {
    constructor(playerId, event) {
        this.id_ = playerId;

        this.name_ = event.name || 'Player' + playerId;
        this.level_ = event.level || Player.LEVEL_PLAYER;
        this.userId_ = null;
        this.ipAddress_ = event.ipAddress || '127.0.0.1';

        this.messages_ = [];

        this.connected_ = true;
    }

    get id() { return this.id_; }

    isConnected() { return this.connected_; }

    notifyDisconnected() {
        this.connected_ = false;
    }

    get name() { return this.name_; }
    set name(value) { this.name_ = value; }

    get ipAddress() { return this.ipAddress_; }

    get level() { return this.level_; }
    set level(value) { this.level_ = value; }

    isRegistered() { return this.userId_ != null; }

    get userId() { return this.userId_; }

    // Sends |message| to the player. It will be stored in the local messages array and can be
    // retrieved through the |messages| getter.
    sendMessage(message, ...args) {
        if (message instanceof Message)
            message = Message.format(message, ...args);

        this.messages_.push(message.toString());
    }

    // Clears the messages that have been sent to this player.
    clearMessages() { this.messages_ = []; }

    // Gets the messages that have been sent to this player.
    get messages() { return this.messages_; }

    // Identifies the player to a fake account. The options can be specified optionally.
    identify({ userId = 0, gangId = 0 } = {}) {
        server.playerManager.onPlayerLogin({
            playerid: this.id_,
            userid: userId,
            gangid: gangId
        });
    }

    // Issues |commandText| as if it had been send by this player. Returns whether the event with
    // which the command had been issued was prevented.
    issueCommand(commandText) {
        let defaultPrevented = false;

        server.commandManager.onPlayerCommandText({
            preventDefault: () => defaultPrevented = true,

            playerid: this.id_,
            cmdtext: commandText
        });

        return defaultPrevented;
    }

    // Disconnects the player from the server. They will be removed from the PlayerManager too.
    disconnect(reason = 0) {
        server.playerManager.onPlayerDisconnect({
            playerid: this.id_,
            reason: reason
        });
    }

    // TODO: Add new getters and setters as required.
}

exports = MockPlayer;
