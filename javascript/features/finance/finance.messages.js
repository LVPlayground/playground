// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    finance_give_cash_admin_donation:
        `%{player.name}s (Id:%{player.id}d) has donated %{amount}$ to %{fund}s.`,
    finance_give_cash_admin_transfer:
        `%{player.name}s (Id:%{player.id}d) has sent %{amount}$ to %{target.name}s (Id:%{target.id}d).`,
    finance_give_cash_insufficient_funds:
        `@error You can't transfer %{amount}$ when you're only carrying %{cash}$.`,
    finance_give_cash_insufficient_wallet:
        `@error %{target.name}$ already carries a lot of money, and can only accept up to %{limit}$ right now.`,
    finance_give_cash_invalid_amount:
        `@error The transfer's amount must be between $1 and %{maximum}$.`,
    finance_give_cash_npc_donation_amount:
        '{FFEB3B}They are very happy with your donation of {FF9800}%{amount}${FFEB3B}. It keeps them going.',
    finance_give_cash_npc_donation_target:
        `{FFEB3B}%{target.name}s is not able to take your money, and have nominated the {FF9800}%{fund}s{FFEB3B} fund!`,
    finance_give_cash_received:
        `@fyi You have received %{amount}$ from %{player.name}s (Id:%{player.id}d).`,
    finance_give_cash_sent:
        `@success You have sent %{amount}$ to %{target.name}s (Id:%{target.id}d).`,
});
