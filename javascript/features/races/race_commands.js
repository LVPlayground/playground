// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandBuilder = require('components/command_manager/command_builder.js'),
    Menu = require('components/menu/menu.js');

// Title of the dialog that displays the available races.
const DIALOG_TITLE = 'Racing on Las Venturas Playground';

// The race commands class provides the interface between players' ability to execute commands, and
// the ability to start or control races. It uses the command manager to do so.
class RaceCommands {
  constructor(commandManager, raceManager) {
    this.raceManager_ = raceManager;

    // Register the /prace command, currently limited to administrators because it's experimental.
    commandManager.buildCommand('prace')
        .restrict(Player.LEVEL_ADMINISTRATOR)

        // /prace [id]
        .sub(CommandBuilder.NUMBER_PARAMETER)
            .build(this.__proto__.raceStart.bind(this))

        // /prace
        .build(this.__proto__.raceOverview.bind(this));
  }

  // Either starts or joins the race with |id|, depending on whether an instance of the race is
  // currently accepting sign-ups. If not, a new sign-up round will be started.
  raceStart(player, id) {
    // TODO: Check whether the player is engaged in an activity already.

    if (!this.raceManager_.isValid(id)) {
      // TODO: Message the player about |id| not being a valid race.
      return;
    }

    // TODO: Withdraw the price of playing a race from the player's account.

    this.raceManager_.startRace(player, id, false /* skipSignup */);
  }

  // Creates a dialog that provides an overview of the available races, together with their all-time
  // best times, and personalized best times if the player has logged in to their account. This
  // command is asynchronous because the personalized times may have to be read from the database.
  raceOverview(player) {
    this.raceManager_.listRacesForPlayer(player).then(races => {
      let menu = null;

      // Bail out if there are no races, since there won't be anything to display.
      if (!races.length)
        return;

      // Include personalized best times if they're available in a three-column menu, otherwise
      // build a two-column menu only displaying the race's name and the general best time.
      if (races[0].personalHighScore !== null) {
        menu = new Menu(DIALOG_TITLE, ['Race', 'Best time', 'Your best time']);
        races.forEach(race =>
            menu.addItem(race.name, race.bestTime, race.personalBestTime,
                         this.__proto__.raceStart.bind(player, race.id)));

      } else {
        menu = new Menu(DIALOG_TITLE, ['Race', 'Best time']);
        races.forEach(race =>
            menu.addItem(race.name, race.bestTime, this.__proto__.raceStart.bind(player, race.id)));
      }

      // Display the created menu to the player. Per-entry listeners will start a race if needed.
      menu.displayForPlayer(player);
    });
  }
};

exports = RaceCommands;
