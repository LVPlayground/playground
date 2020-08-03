// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import InfoDialogCommand from 'features/commands/info_dialog_command.js';
import PositioningCommands from 'features/commands/positioning_commands.js';

// Feature that provides a series of commands not immediately affiliated with a particular feature.
// The Commands class provides the shared infrastructure, whereas groups of commands will be
// implemented separately based on their own requirements.
export default class Commands extends Feature {
    constructor() {
        super();

        server.commandManager.buildCommand('credits')
            .description('Tells you which amazing folks made LVP happen.')
            .build(InfoDialogCommand.create('data/commands/credits.json'));

        server.commandManager.buildCommand('guide')
            .description('Displays a useful guide for temporary administrators.')
            .build(InfoDialogCommand.create('data/commands/guide.json'));

        server.commandManager.buildCommand('help')
            .description('Displays information on how to get started on LVP.')
            .build(InfoDialogCommand.create('data/commands/help.json'));

        server.commandManager.buildCommand('irc')
            .description('Displays information on how to join our IRC channels.')
            .build(InfoDialogCommand.create('data/commands/irc.json'));

        server.commandManager.buildCommand('rules')
            .description('Displays Las Venturas Playground\'s rules.')
            .build(InfoDialogCommand.create('data/commands/rules.json'));

        server.commandManager.buildCommand('vip')
            .description('Displays benefits available to VIP players.')
            .build(InfoDialogCommand.create('data/commands/vip.json'));

        // Load the seperated positioning-related commands
        this.positioningCommands_ = new PositioningCommands();
    }

    dispose() {
        this.positioningCommands_.dispose();

        server.commandManager.removeCommand('credits');
        server.commandManager.removeCommand('guide');
        server.commandManager.removeCommand('help');
        server.commandManager.removeCommand('irc');
        server.commandManager.removeCommand('rules');
        server.commandManager.removeCommand('vip');
    }
};
