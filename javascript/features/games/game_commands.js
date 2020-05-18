// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';
import { GameRegistration } from 'features/games/game_registration.js';

// This class is responsible for making sure that all the appropriate commands for games on the
// server are made available, as well as canonical functionality such as the `/challenge` command.
export class GameCommands {
    commands_ = null;
    finance_ = null;
    manager_ = null;
    registry_ = null;

    // Gets the |commands_| map for testing purposes.
    get commandsForTesting() { return this.commands_; }

    constructor(finance, manager, registry) {
        this.finance_ = finance;
        this.manager_ = manager;

        this.registry_ = registry;
        this.registry_.setCommandDelegate(this);

        // Set of commands that have been registered on the server for individual games.
        this.commands_ = new Set();
    }

    // ---------------------------------------------------------------------------------------------

    // Creates and registers a command to start the game described in |description|.
    createCommandForGame(description) {
        const commandName = description.command;

        if (this.commands_.has(commandName))
            throw new Error(`A game with the /${commandName} command has already been registered.`);
        
        // Registers the |commandName| with the server, so that everyone can use it.
        server.commandManager.buildCommand(commandName)
            .build(GameCommands.prototype.onCommand.bind(this, description));
        
        this.commands_.add(commandName);
    }

    // Removes the command that had been created to start the game described in |description|.
    removeCommandForGame(description) {
        const commandName = description.command;

        if (!this.commands_.has(commandName))
            throw new Error(`No game with the /${commandName} command has been registered yet.`);
        
        // Removes the |commandName| from the server, so that people can't use it anymore.
        server.commandManager.removeCommand(commandName);

        this.commands_.delete(commandName);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has executed the command necessary to start the game described in
    // the given |description|. This will first check that they're not occupied with another
    // activity just yet. If they aren't, it will either register them for an existing pending game,
    // or create a new game just for them.
    onCommand(description, player) {
        const activity = this.manager_.getPlayerActivity(player);
        if (activity) {
            let message = null;

            switch (activity.getActivityState()) {
                case GameActivity.kStateRegistered:
                    message = Message.GAME_REGISTRATION_ALREADY_REGISTERED;
                    break;
                default:
                    throw new Error(`Unknown activity: ${activity}`)
            }

            player.sendMessage(message, activity.getActivityName());
            return;
        }

        // Check if the player has enough money to participate in the game.
        if (this.finance_().getPlayerCash(player) < description.price) {
            player.sendMessage(
                Message.GAME_REGISTRATION_NOT_ENOUGH_MONEY, description.price, description.name);
            return;
        }

        // Check if there are any existing games that the |player| might be able to join.
        const pendingRegistrations = this.manager_.getPendingGameRegistrations(description);
        for (const pendingRegistration of pendingRegistrations) {
            if (pendingRegistration.type !== GameRegistration.kTypePublic)
                continue;  // this is not a game to which everyone can sign up
            
            // Take the registration fee from the |player|.
            this.finance_().takePlayerCash(player, description.price);

            player.sendMessage(
                Message.GAME_REGISTRATION_JOINED, pendingRegistration.getActivityName());

            // Actually register the |player| to participate, and we're done here.
            pendingRegistration.registerPlayer(player, description.price);
            return;
        }

        // If the |description| requires more players than currently are available, let's refuse to
        // start the game, to avoid disappointment down the line.
        const availablePlayers = GameRegistration.getTheoreticalNumberOfParticipants(this.manager_);
        if (description.minimumPlayers > availablePlayers) {
            player.sendMessage(
                Message.GAME_REGISTRATION_NOT_ENOUGH_PLAYERS, description.name,
                description.minimumPlayers, availablePlayers);

            return;
        }

        // Create a new registration flow for the |description|, to which all other players are
        // invited to participate. This enables future commands to join the game instead.
        const registration =
            this.manager_.createGameRegistration(description, GameRegistration.kTypePublic);

        if (!registration) {
            player.sendMessage(Message.GAME_REGISTRATION_UNAVAILABLE, description.name);
            return;
        }

        // Take the registration fee from the |player|.
        this.finance_().takePlayerCash(player, description.price);

        // Register the |player| to participate in the |registration|.
        registration.registerPlayer(player, description.price)

        // If the |player| is the only on available for the game, and the game allows single-player
        // participation, it's possible that it's immediately started.
        if (registration.hasFinished()) {
            player.sendMessage(Message.GAME_REGISTRATION_STARTED, registration.getActivityName());
            return;
        }

        player.sendMessage(Message.GAME_REGISTRATION_JOINED, registration.getActivityName());
        player.sendMessage(Message.GAME_REGISTRATION_CREATED, registration.duration);

        // Send an e-mail to all other unengaged people on the server to see if the want to
        // participate in the game as well. They're welcome to sign up.
        const formattedAnnouncement =
            Message.format(Message.GAME_REGISTRATION_ANNOUNCEMENT, description.name,
                           description.command, description.price);

        for (const recipient of server.playerManager) {
            if (recipient === player || recipient.isNonPlayerCharacter())
                continue;  // no need to send to either the |player| or to bots
            
            if (this.manager_.getPlayerActivity(recipient))
                continue;  // the |recipient| is already involved in another game
            
            recipient.sendMessage(formattedAnnouncement);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.registry_.setCommandDelegate(null);
        this.registry_ = null;

        for (const commandName of this.commands_)
            server.commandManager.removeCommand(commandName);
    
        this.commands_ = null;
    }
}
