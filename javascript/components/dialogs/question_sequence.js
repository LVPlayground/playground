// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Question from 'components/dialogs/question.js';

// Private symbol ensuring that the QuestionSequence constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// Asks a certain player a sequence of questions. A single promise will be returned that will be
// resolved once all questions have been answered and verified given their constraints.
class QuestionSequence {
    // Asks the |questions| to |player|. A promise will be returned that will be resolved with an
    // array  of the answers if all of them were valid, or NULL otherwise.
    static ask(player, questions) {
        const sequenceInstance =
            new QuestionSequence(PrivateSymbol, player, questions);

        // Immediately ask the question to the user.
        sequenceInstance.askPlayer();

        return sequenceInstance.finished;
    }

    constructor(privateSymbol, player, questions) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.player_ = player;

        this.questions_ = questions;
        this.answers_ = [];

        this.resolve_ = null;
        this.reject_ = null;

        this.finished_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;
        });
    }

    // Returns the promise that is to be resolved or rejected when the questions have completed.
    get finished() { return this.finished_; }

    // Asks the top-most question to the player. This method will be invoked once for each question
    // in the sequence. Will abort the chain if a question was dismissed by the player instead.
    askPlayer() {
        // Bail out with the answers if there are no questions left to ask.
        if (!this.questions_.length) {
            this.resolve_(this.answers_);
            return;
        }

        // Otherwise ask the top-most question in the list.
        Question.ask(this.player_, this.questions_.shift()).then(answer => {
            // Abort the sequence if the player chose to not answer.
            if (!answer) {
                this.resolve_(null);
                return;
            }

            // Otherwise store the answer and ask the next question.
            this.answers_.push(answer);
            this.askPlayer();
        });
    }
}

export default QuestionSequence;
