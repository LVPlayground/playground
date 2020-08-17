// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    communication_slap_muted: '@error Sorry, communication has been muted by an administrator.',
    communication_slap_no_funds: '@error Sorry, but you need %{price}$ to slap another player.',
    communication_slap_no_history: `@error Sorry, but you haven't been slapped before!`,
    communication_slap_no_target: `@error Sorry, but %{target}s is not connected anymore.`,
    communication_slap_npc: `@error Sorry, but you can't slap our lovely bots, silly!`,
    communication_slap_self: `@error Sorry, but you can't slap yourself, silly!`,
    communication_slap_wait: '@error Sorry, but you can only slap someone once per %{cooldown}s.',
    communication_slapped:
        `{B1FC17}* %{player.name}s slaps %{target.name}s around a bit with a large %{reason}s.`,
});
