// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { globalMessages } from 'components/i18n/messages.js';

export const messages = globalMessages.extend({
    reaction_tests_announce_calculate:
        '{FFFF00}The first one who calculates "%{calculation}s" wins %{prize}$!',
    reaction_tests_announce_remember:
        `{FFFF00}You've been asked to remember the number %{value}d...`,
    reaction_tests_announce_remember_2:
        `{FFFF00}The first one to repeat the number you had to remember wins %{prize}$!`,
    reaction_tests_announce_repeat:
        '{FFFF00}The first one who repeats "%{sequence}s" wins %{prize}$!',
    reaction_tests_announce_unscramble:
        `{FFD100}The first one who unscrambles "%{scrambled}s" wins %{prize}$!`,

    reaction_tests_announce_winner_first:
        `{FFFF00}%{player.name}s has won the reaction test in %{time}.2f seconds. This is their first win!`,
    reaction_tests_announce_winner_second:
        `{FFFF00}%{player.name}s has won the reaction test in %{time}.2f seconds. They've won once before.`,
    reaction_tests_announce_winner:
        `{FFFF00}%{player.name}s has won the reaction test in %{time}.2f seconds. They've won %{wins}d times before.`,

    reaction_tests_too_late:
        '{DC143C}Too late! %{winner}s beat you to the right answer, and were %{difference}.2f seconds faster.',
    reaction_tests_won:
        '{33AA33}Congratulations! You have been awarded %{prize}$.',
});
