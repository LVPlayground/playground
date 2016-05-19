// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommandBuilder = require('components/command_manager/command_builder.js');
const Menu = require('components/menu/menu.js');

// Title of the dialog that displays the available races.
const DIALOG_TITLE = 'Racing on Las Venturas Playground';

// The race commands class provides the interface between players' ability to execute commands, and
// the ability to start or control races. It uses the command manager to do so.
class RaceCommands {
    constructor(manager) {
        this.manager_ = manager;

        server.commandManager.buildCommand('race')
            .sub(CommandBuilder.NUMBER_PARAMETER)
                .build(RaceCommands.prototype.raceStart.bind(this))
            .build(RaceCommands.prototype.raceOverview.bind(this));
    }

    // Either starts or joins the race with |id|, depending on whether an instance of the race is
    // currently accepting sign-ups. If not, a new sign-up round will be started.
    raceStart(player, id) {
        if (player.activity != Player.PLAYER_ACTIVITY_NONE)
            return player.sendMessage(Message.RACE_ERROR_ALREADY_ENGAGED);

        if (!this.manager_.isValid(id))
            return player.sendMessage(Message.RACE_ERROR_INVALID_RACE_ID);

        // TODO: Withdraw the price of playing a race from the player's account.

        this.manager_.startRace(player, id);
    }

    // Creates a dialog that provides an overview of the available races, together with their all-
    // time best times, and personalized best times if the player has logged in to their account.
    raceOverview(player) {
        this.manager_.loadRecordTimesForPlayer(player).then(races => {
            // Bail out if there are no races, since there won't be anything to display.
            if (!races.length)
                return player.sendMessage(Message.RACE_ERROR_NO_RACES_AVAILABLE);

            // A player's personal best time will be displayed if they're registered.
            let displayPersonalBest = player.isRegistered();

            let columns = ['Race', 'Best time'];
            if (displayPersonalBest)
                columns.push('Your best time');

            let menu = new Menu(DIALOG_TITLE, columns);
            races.forEach(race => {
                let columnValues = [race.name];

                // Append the best time on Las Venturas Playground to the values.
                if (race.bestRace !== null) {
                    columnValues.push(
                        Message.formatTime(race.bestRace.time) + ' (' + race.bestRace.name + ')');
                } else {
                    columnValues.push('---');
                }

                // If the user has logged in, append their personal best to the values.
                if (displayPersonalBest) {
                    if (race.personalBestTime !== null)
                        columnValues.push(Message.formatTime(race.personalBestTime));
                    else
                        columnValues.push('---');
                }

                // Append the item, with a per-row listener to start the selected race.
                menu.addItem(
                    ...columnValues, RaceCommands.prototype.raceStart.bind(this, player, race.id));
            });

            // Display the created menu to the player. Listeners will start a race when selected.
            menu.displayForPlayer(player);
        });
    }

    dispose() {
        server.commandManager.removeCommand('race');
    }
}

exports = RaceCommands;
