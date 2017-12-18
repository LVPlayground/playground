// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import QuestionSequence from 'components/dialogs/question_sequence.js';

describe('QuestionSequence', (it, beforeEach, afterEach) => {
    let player = null;

    beforeEach(() => player = server.playerManager.getById(0 /* Gunther */));

    // Common sequence of simple questions used by the sequence.
    const questionSequence = [
        { question: 'First question' },
        { question: 'Second question',
          constraints: { validation: /^(.){5,}$/, explanation: 'Five?!1' } },
        { question: 'Third question' }
    ];

    it('should bail out on the first canceled answer', assert => {
        const promise = QuestionSequence.ask(player, Object.values(questionSequence));

        player.respondToDialog({ response: 0 });

        return promise.then(answer => assert.isNull(answer));
    });

    it('should return all answers when the sequence is completed', assert => {
        const promise = QuestionSequence.ask(player, Object.values(questionSequence));

        player.respondToDialog({ inputtext: 'First answer' }).then(() =>
            player.respondToDialog({ inputtext: 'Second answer' })).then(() =>
            player.respondToDialog({ inputtext: 'Third answer'}));

        return promise.then(answers =>
            assert.deepEqual(answers, ['First answer', 'Second answer', 'Third answer']));
    });

    it('should respect the retry logic of Question', assert => {
        const promise = QuestionSequence.ask(player, Object.values(questionSequence));

        player.respondToDialog({ inputtext: 'First answer' }).then(() =>

            // This answer is too short - minimum is five characters
            player.respondToDialog({ inputtext: 'foo' })).then(() =>
            player.respondToDialog({ response: 1 })).then(() =>

            // Try again with a proper value, and a random third answer.
            player.respondToDialog({ inputtext: 'Correct answer' })).then(() =>
            player.respondToDialog({ inputtext: 'Third answer'}));

        return promise.then(answers =>
            assert.deepEqual(answers, ['First answer', 'Correct answer', 'Third answer']));
    });
});
