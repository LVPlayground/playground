// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Represents a player-bound command. Accessible using either "/my [name]" or "/p [player] [name]"
// when the player executing the command is an administrator. Has access to various dependencies.
export class PlayerCommand {
    #announce_ = null;
    #finance_ = null;
    #limits_ = null;
    #playerColors_ = null;

    constructor(announce, finance, limits, playerColors) {
        this.#announce_ = announce;
        this.#finance_ = finance;
        this.#limits_ = limits;
        this.#playerColors_ = playerColors;
    }

    // Gets read-only access to the dependencies available to commands.
    get announce() { return this.#announce_; }
    get finance() { return this.#finance_; }
    get limits() { return this.#limits_; }
    get playerColors() { return this.#playerColors_; }

    // ---------------------------------------------------------------------------------------------
    // Required API to be implemented by individual commands.
    // ---------------------------------------------------------------------------------------------

    // Gets the name of the command ("/{name}").
    get name() { throw new Error('PlayerCommand::name is expected to be implemented.'); }

    // Gets the description of the command.
    get description() {
        throw new Error('PlayerCommand::description is expected to be implemented.');
    }

    // Executes the command, which has been invoked by the |player|, for the |target|. The |target|
    // may either be the |player| (when /my is used), or another player through administrator use.
    execute(player, target) {}

    // ---------------------------------------------------------------------------------------------
    // Optional API to be implemented by individual commands.
    // ---------------------------------------------------------------------------------------------

    // Gets the required level for this command to be available through the "/p [player]" command.
    get administratorLevel() { return Player.LEVEL_ADMINISTRATOR; }

    // Gets the parameters (& default values) available when players run this command.
    get parameters() { return []; }

    // Gets the required level for this command to be available through the "/my" command.
    get playerLevel() { return Player.LEVEL_PLAYER; }

    // Gets whether players have to be VIP in order to be able to execute this command.
    get requireVip() { return false; }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object PlayerCommand("/${this.name}")]`; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.#announce_ = null;
        this.#finance_ = null;
        this.#limits_ = null;
        this.#playerColors_ = null;
    }
}
