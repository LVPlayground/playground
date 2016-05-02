// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// Implementation of the actual gang chat feature. Will work with the gangs feature to get its data.
class GangChatManager {
    constructor(gangs) {
        this.gangs_ = gangs;

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playertext', GangChatManager.prototype.onPlayerText.bind(this));
    }

    // Called when a player sends a message to the chat box. If it starts 
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        const text = event.text;

        if (!player || !text || !text.length)
            return;  // basic sanity checks to make sure that the message is valid

        if (!text.startsWith('!') || text.startsWith('!!'))
            return;  // this message is not meant for gang chat

        event.preventDefault();

        const gang = this.gangs_.getGangForPlayer(player);
        if (!gang) {
            player.sendMessage(Message.GANG_CHAT_NO_GANG);
            return;
        }

        const message = text.substr(1).trim();
        
        for (let member of gang.members)
            member.sendMessage(Message.GANG_CHAT, gang.tag, player.id, player.name, message);

        // TODO(Russell): Distribute the message to administrators.
        // TODO(Russell): Distribute the message to the Seti@Home owner.
    }

    dispose() {
        this.callbacks_.dispose();
    }
}

exports = GangChatManager;
