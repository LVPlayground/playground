// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    animations_admin_notice:
        '%{player.name}s (Id:%{player.id}d) has started the /%{command}s animation for ' +
        '%{target.name}s (Id:%{target.id}d).',
    animations_dance_usage_admin: '@usage /dance [1-4] [player]?',
    animations_dance_usage: '@usage /dance [1-4]',
    animations_executed_fyi:
        '{E0E0E0}* %{player.name}s (Id:%{player.id}d) has started the /%{command}s animation ' +
        'for you.',
    animations_executed:
        '@success The /%{command}s animation has started for %{player.name}s (Id:%{player.id}d).',
    animations_not_idle: '@error Unable to start an animation, because %{reason}s.',
    animations_not_on_foot:
        '@error Unable to start an animation, because you\'re not currently on foot.',
});
