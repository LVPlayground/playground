// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    killtime_announce_leader:
        `{DC143C}Killtime{FFFFFF}: Leading: %{leader}s. Hurry up and get more to win the prize of %{prize}$ or more!`,
    killtime_announce_started:
        `{DC143C}Killtime{FFFFFF}: The following %{duration}d minutes is killing for a prize! Are you the one with the most kills?`,
    killtime_announce_stopped:
        `{DC143C}Killtime{FFFFFF}: Time is up! The prize will be given out shortly.`,
    killtime_announce_winner:
        `{DC143C}Killtime{FFFFFF}: The winner is: %{winner}s. %{prize}s`,
});
