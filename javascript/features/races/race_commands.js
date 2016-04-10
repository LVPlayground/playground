// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let CommandBuilder = require('components/command_manager/command_builder.js'),
    Menu = require('components/menu/menu.js');

// Title of the dialog that displays the available races.
const DIALOG_TITLE = 'Racing on Las Venturas Playground';

// Text to display when no time (either personal or global) can be dispalyed.
const NO_TIME_AVAILABLE = '---';

// The race commands class provides the interface between players' ability to execute commands, and
// the ability to start or control races. It uses the command manager to do so.
class RaceCommands {
  constructor(commandManager, raceManager) {
    this.raceManager_ = raceManager;

    // Register the /race command, currently limited to administrators because it's experimental.
    commandManager.buildCommand('race')
        // /race [id]
        .sub(CommandBuilder.NUMBER_PARAMETER)
            .build(this.__proto__.raceStart.bind(this))

        // /race
        .build(this.__proto__.raceOverview.bind(this));

    // TODO: Remove this.
    global.addEventListener('playercommandtext', this.__proto__.onPlayerCommandText.bind(this));
  }

  // Either starts or joins the race with |id|, depending on whether an instance of the race is
  // currently accepting sign-ups. If not, a new sign-up round will be started.
  raceStart(player, id) {
    if (player.activity != Player.PLAYER_ACTIVITY_NONE)
      return player.sendMessage(Message.RACE_ERROR_ALREADY_ENGAGED);

    if (!this.raceManager_.isValid(id))
      return player.sendMessage(Message.RACE_ERROR_INVALID_RACE_ID);

    // TODO: Withdraw the price of playing a race from the player's account.

    // Skip the sign-up phase if the player is the only person in-game.
    let skipSignup = Player.count() == 1;

    this.raceManager_.startRace(player, id, skipSignup);
  }

  // Creates a dialog that provides an overview of the available races, together with their all-time
  // best times, and personalized best times if the player has logged in to their account. This
  // command is asynchronous because the personalized times may have to be read from the database.
  raceOverview(player) {
    this.raceManager_.listRacesForPlayer(player).then(races => {
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
        if (race.bestRace !== null)
          columnValues.push(Message.formatTime(race.bestRace.time) + ' (' + race.bestRace.name + ')');
        else
          columnValues.push(NO_TIME_AVAILABLE);

        // If the user has logged in, append their personal best to the values.
        if (displayPersonalBest) {
          if (race.personalBestTime !== null)
            columnValues.push(Message.formatTime(race.personalBestTime));
          else
            columnValues.push(NO_TIME_AVAILABLE);
        }

        // Append the item, with a per-row listener to start the selected race.
        menu.addItem(...columnValues, this.__proto__.raceStart.bind(this, player, race.id));
      });

      // Display the created menu to the player. Per-entry listeners will start a race if needed.
      menu.displayForPlayer(player);
    });
  }

  // TODO: This is a hack because races exist here, while everything else for /leave exists in
  // Pawn. We still need to be able to remove a player from a race though.
  onPlayerCommandText(event) {
    let player = Player.get(event.playerid);
    if (!player)
      return;

    if (!event.cmdtext.startsWith('/leave'))
      return;

    if (this.raceManager_.leaveRace(player))
      event.preventDefault();
  }
};

exports = RaceCommands;
