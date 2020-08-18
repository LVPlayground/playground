// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    gangs_admin_color:
        `%{player.name}s (Id:%{player.id}d) updated %{gang}s gang's color to: %{color}s`,
    gangs_admin_goal:
        `%{player.name}s (Id:%{player.id}d) updated %{gang}s gang's goal to: %{goal}s`,
    gangs_admin_invitation:
        '%{player.name}s (Id:%{player.id}d) has invited %{target.name}s (Id:%{target.name}d) to join the %{gang}s gang.',
    gangs_admin_kicked:
        '%{player.name}s (Id:%{player.id}d) has kicked %{target}s from the %{gang}s gang.',
    gangs_admin_name:
        `%{player.name}s (Id:%{player.id}d) updated %{gang}s gang's name to: %{name}s`,
    gangs_admin_skin:
        `%{player.name}s (Id:%{player.id}d) updated %{gang}s gang's skin to: %{skin}s`,
    gangs_admin_tag:
        `%{player.name}s (Id:%{player.id}d) updated %{gang}s gang's tag to: %{tag}s`,

    gangs_announce_created: `%{player.name}s has founded the %{gang}s gang!`,
    gangs_announce_joined: `%{player.name}s has joined the %{gang}s gang!`,
    gangs_announce_left: `%{player.name}s has joined the %{gang}s gang!`,
});
