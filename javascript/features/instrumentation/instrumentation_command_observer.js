// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandObserver } from 'components/commands/command_observer.js';

// Set of custom commands that should be ignored, as they're provided by the Pawn side of our
// system. This is significant to not artificially inflate these statistics.
const kIgnoredUnknownCommands = new Set([
    // @command("foo")
    '/ban',
    '/bounties',
    '/buy',
    '/carteleport',
    '/cruise',
    '/ctp',
    '/fix',
    '/fixservices',
    '/flip',
    '/getid',
    '/getstats',
    '/gotogtamv',
    '/hitman',
    '/jail',
    '/jailed',
    '/kick',
    '/modlogin',
    '/nos',
    '/properties',
    '/property',
    '/reconnect',
    '/sell',
    '/sfix',
    '/stopwatch',
    '/stp',
    '/tefhint',
    '/teleport',
    '/tp',
    '/unjail',
    '/vr',
    '/watch',
    '/weapons',

    // lvp_command(foo, ...)
    '/cd',
    '/chase',
    '/cmds',
    '/commands',
    '/countdown',
    '/fetch',
    '/fight',
    '/find',
    '/fixminigames',
    '/has',
    '/hasfix',
    '/hs',
    '/interest',
    '/jump',
    '/locate',
    '/lyse',
    '/minigames',
    '/minigaming',
    '/resetfc',
    '/resetmatch',
    '/robbery',
    '/rwtw',
    '/set',
    '/settings',
    '/stats',
    '/stopchase',
    '/t',
    '/taxi',
    '/teles',
    '/tow',
    '/tune',
    '/world',
    '/wwtw',

    // Arbitrary commands in OnPlayerCommandText
    '/admins',
    '/back',
    '/bagmoney',
    '/bitchslap',
    '/borrow',
    '/brief',
    '/cardive',
    '/customtax',
    '/deliver',
    '/dive',
    '/dm',
    '/donate',
    '/export',
    '/islanddm',
    '/kill',
    '/knockout',
    '/locations',
    '/massacre',
    '/payoff',
    '/ramping',
    '/random',
    '/rconadmin',
    '/rivershell',
    '/shiptdm',
    '/spankme',
    '/wanted',
    '/waterfight',
    '/ww',
]);

// Observes the command manager with the intention of storing all command executions on the server,
// through the instrumentation database. Will register and unregister itself gracefully.
export class InstrumentationCommandObserver extends CommandObserver {
    #database_ = null;

    constructor(database) {
        super();

        this.#database_ = database;

        // Observe events issued by the command manager.
        server.commandManager.addObserver(this);
    }

    // ---------------------------------------------------------------------------------------------
    // CommandObserver implementation:
    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has executed the |command|. The |result| is a boolean that indicates
    // whether execution of the command was successful, which could fail if parameter parsing fails.
    onCommandExecuted(player, command, result) {
        this.#database_.recordCommand(player, command.command, result);
    }

    // Called when the |player| has executed the |commandName|, which does not exist on the server.
    // We record these to understand which commands players might expect, that we don't provide.
    onUnknownCommandExecuted(player, commandName) {
        if (kIgnoredUnknownCommands.has(commandName))
            return;

        this.#database_.recordCommand(player, commandName, /* commandSuccess= */ false);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeObserver(this);
    }
}
