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

    it('should resolve the promise when the player answers', assert => {
        const promise = Question.ask(player, { question: 'Example question?' });

        player.respondToDialog({ inputtext: 'My answer!' });

        return promise.then(answer => assert.equal(answer, 'My answer!'));
    });

    it('should resolve with NULL when the player dismissed the dialog', assert => {
        const promise = Question.ask(player, { question: 'Example question?' });

        player.respondToDialog({ response: 0 });

        return promise.then(answer => assert.isNull(answer));
    });

    // TODO(Russell): Add tests for constraint validation.
    // TODO(Russell): Add tests for the retry logic.
    // TODO(Russell): Add tests for the information dialog.
});
