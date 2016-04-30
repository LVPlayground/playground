// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockServer = require('test/mock_server.js');
const Question = require('components/dialogs/question.js');

describe('Question', (it, beforeEach, afterEach) => {
    let player = null;

    MockServer.bindTo(beforeEach, afterEach, server => {
        player = server.playerManager.getById(0 /* Gunther */);
    });

    // Common question to use in tests where only the question matters.
    const simpleQuestion = { question: 'Example question?' };

    // Common question to use in tests where a constraint is significant.
    const constraintQuestion = {
        question: 'Example question?',
        constraints: {
            min: 5,
            explanation: 'Type at least five characters.',
            abort: 'Sorry, you did not enter a correct value.',
        }
    };

    it('should resolve the promise when the player answers', assert => {
        const promise = Question.ask(player, simpleQuestion);

        player.respondToDialog({ inputtext: 'My answer!' });

        return promise.then(answer => assert.equal(answer, 'My answer!'));
    });

    it('should resolve with NULL when the player dismissed the dialog', assert => {
        const promise = Question.ask(player, simpleQuestion);

        player.respondToDialog({ response: 0 });

        return promise.then(answer => assert.isNull(answer));
    });

    it('should resolve with NULL when constraint validation fails, then cancelled', assert => {
        const promise = Question.ask(player, constraintQuestion);

        player.respondToDialog({ inputtext: 'four' }).then(() =>
            player.respondToDialog({ response: 0 }));

        return promise.then(answer => assert.isNull(answer));
    });

    it('should resolve with the answer when constraint validation fails, then retries', assert => {
        const promise = Question.ask(player, constraintQuestion);

        player.respondToDialog({ inputtext: 'four' }).then(() =>
            player.respondToDialog({ response: 1 })).then(() =>
            player.respondToDialog({ inputtext: 'My answer!' }));

        return promise.then(answer => assert.equal(answer, 'My answer!'));
    });

    it('should resolve with NULL when the player failed three times', assert => {
        const promise = Question.ask(player, constraintQuestion);

        // Attempt 1.
        player.respondToDialog({ inputtext: 'four' }).then(() =>
            player.respondToDialog({ response: 1 })).then(() =>

            // Attempt 2.
            player.respondToDialog({ inputtext: 'four' })).then(() =>
            player.respondToDialog({ response: 1 })).then(() =>

            // Attempt 3.
            player.respondToDialog({ inputtext: 'two' })).then(() =>
            player.respondToDialog({ response: 1 /* deliberately 1-- there's only one button */ }));

        return promise.then(answer => assert.isNull(answer));
    });
});
