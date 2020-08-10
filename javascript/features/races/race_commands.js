// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { Menu } from 'components/menu/menu.js';

import { formatTime } from 'base/time.js';

// Provides the "/race" command for players to interact with, which allows them to start a race or
// spectate one of the in-progress races. Builds on top of the Games API.
export class RaceCommands {
    #database_ = null;
    #games_ = null;
    #registry_ = null;

    constructor(database, games, registry) {
        this.#database_ = database;
        this.#games_ = games;
        this.#registry_ = registry;

        // /race [id]?
        server.commandManager.buildCommand('race')
            .description(`Compete in one of Las Venturas Playground's races.`)
            .sub(CommandBuilder.kTypeNumber, 'id')
                .description(`Compete in a specific race, identified by ID.`)
                .build(RaceCommands.prototype.onRaceStartCommand.bind(this))
            .build(RaceCommands.prototype.onRaceCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the `/race` command is executed without specifying a particular race. Will fetch
    // the race's high scores
    async onRaceCommand(player) {
        const columns = ['Race', 'Best time' ];
        const [ highscores, personalHighscores ] = await Promise.all([
            this.#database_.getHighscores(),
            this.#database_.getHighscoresForPlayer(player),
        ]);

        // Append the "Personal best" column if personal highscores are available.
        if (personalHighscores !== null)
            columns.push('Personal best');

        const dialog = new Menu('Races', columns);

        // Populate the |dialog| with each of the available races from the registry.
        for (const description of this.#registry_.races()) {
            const name = description.name;
            const listener =
                RaceCommands.prototype.onRaceStartCommand.bind(this, player, description.id);

            let highscore = '{9E9E9E}-';
            if (highscores.has(description.id)) {
                const { color, username, time } = highscores.get(description.id);
                if (color)
                    highscore = `${formatTime(time)} ({${color.toHexRGB()}}${username}{FFFFFF})`;
                else
                    highscore = `${formatTime(time)} (${username})`;
            }

            // If |personalHighscores| are available, consider those, otherwise just add the race's
            // name and best time to the |dialog|.
            if (personalHighscores !== null) {
                let personalHighscore = '{9E9E9E}-';
                if (personalHighscores.has(description.id))
                    personalHighscore = formatTime(personalHighscores.get(description.id));

                dialog.addItem(name, highscore, personalHighscore, listener);
            } else {
                dialog.addItem(name, highscore, listener);
            }
        }

        // Display the |dialog| to the |player|, and we're done.
        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| wants to start the race identified by |raceId|. Will defer to the
    // Games API, where limits checks and player availability will be executed.
    async onRaceStartCommand(player, raceId) {

    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('race');

        this.#registry_ = null;
        this.#games_ = null;
        this.#database_ = null;
    }
}
