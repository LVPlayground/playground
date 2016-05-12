// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Tag to be used for regular player-visible announcements.
const AnnounceTag = 'announce';

// Tag to be used for private administrator-visible announcements.
const AdminTag = 'admin';

// Implementation of the functionality of the Announce feature. This is where input will be verified
// and the messages will be dispatched to the appropriate audience.
class AnnounceManager {
    constructor(ircDelegate = null) {
        this.ircDelegate_ = ircDelegate;
    }

    // Announces |message| to all in-game players. Optionally |args| may be passed if the |message|
    // is an instance of the Message class, which is common infrastructure for user-visible text.
    announceToPlayers(message, ...args) {
        if (message instanceof Message)
            message = Message.format(message, ...args);

        const formattedMessage = Message.format(Message.ANNOUNCE_ALL, message);

        server.playerManager.forEach(player =>
            player.sendMessage(formattedMessage));

        this.announceToIRC(AnnounceTag, message);
    }

    // Announces |message| to all in-game administrators. Optionally |args| may be passed if
    // |message| is an instance of Message, which is common infrastructure for user-visible text.
    announceToAdministrators(message, ...args) {
        if (message instanceof Message)
            message = Message.format(message, ...args);

        const formattedMessage = Message.format(Message.ANNOUNCE_ADMINISTRATORS, message);

        server.playerManager.forEach(player => {
            if (!player.isAdministrator())
                return;

            player.sendMessage(formattedMessage);
        });

        this.announceToIRC(AdminTag, message);
    }

    // Announces |tag| with the given |parameters|, in order, to IRC. It is the responsibility for
    // bots to pick up on distribution and display of the message from thereon.
    announceToIRC(tag, ...parameters) {
        const message = '[' + tag + '] ' + parameters.join(' ');

        if (this.ircDelegate_) {
            this.ircDelegate_(message);
            return;
        }

        if (message.length > 400) {
            console.log('[AnnounceManager] Warning: Message dropped because it could cause an ' +
                        'overflow in the echo plugin: ' + message.substr(0, 125) + '...');
            return;
        }

        if (server.isTest())
            return;  // do not issue IRC messages when running a test

        pawnInvoke('EchoMessage', 's', message);
    }

    dispose() {
        this.ircDelegate_ = null;
    }
}

exports = AnnounceManager;
