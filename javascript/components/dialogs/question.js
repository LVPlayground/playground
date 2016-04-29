// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');

// Private symbol ensuring that the Question constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// A question is an input dialog box that must be answered according to specific constraints. When
// an answer does not meet the constraints, they will be prompted to ask again.
class Question {
    // Asks |question| to |player|, optionally constrained by the |constraints|. Returns a promise
    // that will be resolved with the answer when available or NULL when no answer has been entered.
    static ask(player, { question, message = null, leftButton = 'Next', constraints = {} } = {}) {
        const checkedConstraints = {
            min: constraints.min || null,
            max: constraints.max || null
        };

        const questionInstance =
            new Question(PrivateSymbol, player, question, message, leftButton, checkedConstraints);

        // Immediately ask the question to the user.
        questionInstance.askPlayer();

        return questionInstance.finished;
    }

    constructor(privateSymbol, player, question, message, leftButton, constraints) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.player_ = player;
        this.question_ = question;
        this.leftButton_ = leftButton;
        this.constraints_ = constraints;

        this.message_ = this.compileMessage(message);

        this.attempts_ = 3;  // maximum number of attempts a player can do

        this.resolve_ = null;
        this.reject_ = null;

        this.finished_ = new Promise((resolve, reject) => {
            this.resolve_ = resolve;
            this.reject_ = reject;
        });
    }

    // Returns the promise that is to be resolved or rejected when the question has completed.
    get finished() { return this.finished_; }

    // Asks the question to the stored player. This method may be called several times if the player
    // either enters an empty answer, or an answer that does not adhere to the constraints.
    askPlayer() {
        const dialogOptions = {
            caption: this.question_,
            message: this.message_,
            leftButton: this.leftButton_,
            rightButton: 'Cancel',
            isPrivate: false
        };

        Dialog.displayInput(this.player_, dialogOptions).then(result => {
            // Resolve the promise with NULL if the player cancelled the dialog.
            if (!result.response) {
                this.resolve_(null);
                return;
            }

            // Resolve the promise with the value when all constraints have been met.
            if (this.verifyConstraints(result.text)) {
                this.resolve_(result.text);
                return;
            }

            // TODO(Russell): Implement retry and information-box logic.

            this.resolve_(result.text);
        });
    }

    // Compiles the message for the question, which will include a textual description of the
    // constraints that should be applied.
    compileMessage(message) {
        message = message || '';

        let constraints = [];

        // Length constraints
        if (this.constraints_.min !== null && this.constraints_.max !== null)
            constraints.push(this.constraints_.min + '-' + this.constraints_.max + ' characters');
        else if (this.constraints_.max !== null)
            constraints.push('no more than ' + this.constraints_.max + ' characters');
        else if (this.constraints_.min !== null)
            constraints.push('at least ' + this.constraints_.min + ' characters');

        if (constraints.length)
            return message + ' (' + constraints.join(', ') + ')';

        return message;
    }

    // Verifies that the constraints of this question have been met for |input|, and returns true
    // or false depending on that.
    verifyConstraints(input) {
        if (this.constraints_.min !== null && input.length < this.constraints_.min)
            return false;  // too short

        if (this.constraints_.max !== null && input.length > this.constraints_.max)
            return false;  // too long

        return true;
    }
}

exports = Question;
