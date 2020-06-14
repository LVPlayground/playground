// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Menu } from 'components/menu/menu.js';
import { MessageBox } from 'components/dialogs/message_box.js';

// Command driven by a JSON file that will display a dialog to the user to share information with
// them. This class should not be instantiated, instead, use the create() method.
//
// Two kinds of dialog types are supported: 'message', which will display a dialog listing the lines
// in the file's data section, and 'message-menu', which will display a multiple choice dialog with
// several sub-menus that can be presented to the player.
class InfoDialogCommand {
  static create(filename) {
    const commandData = JSON.parse(readFile(filename));
    if (typeof commandData !== 'object' || !commandData.hasOwnProperty('type'))
      throw new Error('Invalid format for the command file: ' + filename);

    let command = null;
    switch (commandData.type) {
      case 'message':
        command = new MessageCommand(commandData.data);
        break;
      case 'message-menu':
        command = new MessageMenuCommand(commandData.data, commandData.title);
        break;
      default:
        throw new Error('Invalid command type: ' + commandData.type);
    }

    return command.__proto__.show.bind(command);
  }
};

// Message commands will display a dialog box with one or more lines of information. The |message|
// given to a message command must either be a string, or an array of strings.
class MessageCommand {
  constructor(message) {
    if (Array.isArray(message))
      message = message.join('\n');

    this.message_ = new MessageBox(message);
  }

  // Displays the message to the |player|. The |parameters| are ignored.
  show(player, parameters) {
    this.message_.displayForPlayer(player);
  }
};

// Message menu commands will display a series of options, each of which will contain a message that
// will be showed when selected by the player.
class MessageMenuCommand {
  constructor(messages, title) {
    this.menu_ = new Menu(title);

    Object.keys(messages).forEach(subject => {
      const message = new MessageBox(messages[subject].join('\n'));

      this.menu_.addItem(subject, player => message.displayForPlayer(player));
    });
  }

  // Displays the menu to the |player|. The |parameters| are ignored.
  show(player, parameters) {
    this.menu_.displayForPlayer(player);
  }
};

export default InfoDialogCommand;
