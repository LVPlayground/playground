// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    playground_announce_command_granted:
        `%{player.name}s has made the command "%{command}s" available to all players.`,
    playground_announce_command_revoked:
        `%{player.name}s has removed the "%{command}s" command from players.`,
});
