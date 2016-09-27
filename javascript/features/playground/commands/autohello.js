// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Command = require('features/playground/command.js');
const CommandBuilder = require('components/command_manager/command_builder.js');

// Minimum and maximum waits for a greet, in seconds.
const MinimumWait = 3.5;
const MaximumWait = 10;

// Time, in minutes, for which we'll remember reconnecting players.
const ReconnectionTimeout = 15;

// Time, in minutes, for which we'll ignore players after a reconnect.
const IgnoreTimeout = 60;

// List of greetings that will randomly be selected from when a player logs in.
const Greetings = [
    'Hey %s',
    'Hello %s',
    'Howdy, %s!',
    'Hiya %s',
    'Yo %s',
    'Hi %s',
    'What\'s up, %s?',
    'What\'s new, %s?',
    'How are you doing, %s?',
    'g\'day, %s',
];

// Command: /autohello [player?]
class AutoHelloMessageCommand extends Command {
    constructor(...args) {
        super(...args);

        this.greeters_ = new Set();
        this.reconnected_ = new Map();
        this.ignored_ = new Set();

        // Observe the PlayerManager for disconnecting and logging in players.
        server.playerManager.addObserver(this);
    }

    get name() { return 'autohello'; }
    get defaultPlayerLevel() { return Player.LEVEL_MANAGEMENT; }

    build(commandBuilder) {
        commandBuilder
            .parameters([{ name: 'target', type: CommandBuilder.PLAYER_PARAMETER, optional: true }])
            .build(AutoHelloMessageCommand.prototype.onAutoHelloCommand.bind(this));
    }

    onAutoHelloCommand(player, target) {
        target = target || player;

        // The command toggles whether |target| will welcome identifying players.
        if (this.greeters_.has(target)) {
            player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' will stop being nice.');
            this.greeters_.delete(target);

        } else {
            player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' will now welcome players.');
            this.greeters_.add(target);
        }
    }

    // Make sure that the |player| stops greeting people.
    async onPlayerDisconnect(player) {
        this.greeters_.delete(player);

        if (!player.isRegistered())
            return;

        const uniqueSymbol = Symbol('Reconnection for ' + player.name);
        const userId = player.userId;

        this.reconnected_.set(userId, uniqueSymbol);

        await minutes(ReconnectionTimeout);

        if (this.reconnected_.get(userId) !== uniqueSymbol)
            return;

        this.reconnected_.delete(userId);
    }

    // Called when the |player| has identified to their account. This is where we might say hi.
    onPlayerLogin(player) {
        if (!this.greeters_.size || this.ignored_.has(player.userId))
            return;

        for (const greeter of this.greeters_)
            this.greetPlayer(player, greeter);
    }

    // Asynchronously greets the |player| on behalf of |greeter|.
    async greetPlayer(player, greeter) {
        await seconds((Math.random() * (MaximumWait - MinimumWait)) + MinimumWait);
        if (!player.isConnected() || !greeter.isConnected())
            return;

        const userId = player.userId;

        const isReconnect = this.reconnected_.has(userId);
        const message = isReconnect ? 'wb %s'
                                    : Greetings[Math.floor(Math.random() * Greetings.length)];

        const greetingsMessage = message.replace('%s', player.name);
        const greet = '{' + greeter.color.toHexRGB() + '}[' + greeter.id + '] '+ greeter.name +
                      ': {FFFFFF}' + greetingsMessage;

        const virtualWorld = player.virtualWorld;
        if (greeter.virtualWorld != virtualWorld)
            return;  // the |player| and the |greeter| must be in the same virtual world.

        server.playerManager.forEach(p => {
            if (p.virtualWorld != virtualWorld)
                return;

            p.sendMessage(greet);
        });

        // Make sure that people on IRC get to see the greeting as well.
        this.announce_().announceToIRC('text', greeter.id, greeter.name, greetingsMessage);

        // If this was a reconnection, we'll want to ignore the player for quite some time.
        if (!isReconnect)
            return;

        this.ignored_.add(userId);
        await minutes(IgnoreTimeout);
        this.ignored_.delete(userId);
    }

    dispose() {
        server.playerManager.removeObserver(this);

        this.greeters_.clear();
        this.greeters_ = null;
    }
}

exports = AutoHelloMessageCommand;
