// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    abuse_admin_detected:
        '%{player.name}s (Id:%{player.id}d) has been found to be using %{detector}s, incident: {FFECB3}%{rid}s',
    abuse_admin_monitor:
        '%{player.name}s (Id:%{player.id}d) might be using %{detector}s, please keep an eye out; incident: {FFECB3}%{rid}s',
    abuse_admin_suspected:
        '%{player.name}s (Id:%{player.id}d) has been suspected of using %{detector}s, incident: {FFECB3}%{rid}s',
});
