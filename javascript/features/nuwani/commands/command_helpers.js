// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Message } from 'features/nuwani/runtime/message.js';

// Asynchronously issues the given |command| on the |commandManager|. The function will return the
// messages that have been written to the socket since, with styling information stripped.
export async function issueCommand(bot, commandManager, { target, command, source } = {}) {
    if (!command)
        throw new Error('The |command| is required when issuing a command.');

    target = target ?? '#echo';
    source = source ?? 'Randomer!user@hostname';

    const currentMessageCount = bot.messagesForTesting.length;
    const message = new Message(`:${source} PRIVMSG ${target} :${command}`);

    await commandManager.onBotMessage(bot, message);

    // Gets all the new messages and strips colour information from them.
    return bot.messagesForTesting.slice(currentMessageCount).map(message => {
        return message.replace(/[\x02\x0F\x16\x1D\x1F]|\x03(\d\d?(,\d\d?)?)?/g, '');
    });
}
