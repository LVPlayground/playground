// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Dialog from 'components/dialogs/dialog.js';

// Private symbol ensuring that the Question constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// A question is an input dialog box that must be answered according to specific constraints. When
// an answer does not meet the constraints, they will be prompted to ask again.
//
// The semantics of questions are as follows:
//     - The player is asked a question, optionally having a message.
//     - They can try to answer the question up to three times. The answer may have constraints,
//       which will automatically be included in the message.
//     - When constraint validation fails, a dialog can be shown explaining what they are expected
//       to enter. They can then choose to try again, up to three times.
//     - The answer will be returned in the promise, or NULL when they aborted.
//
// Sequences of questions can be asked to a player by using QuestionSequence instead.
class Question {
    // Asks |question| to |player|, optionally constrained by the |constraints|. Returns a promise
    // that will be resolved with the answer when available or NULL when no answer has been entered.
    static ask(player, { question, message = null, leftButton = 'Next', isPrivate = false,
                         constraints = {} } = {}) {
        const checkedConstraints = {
            validation: constraints.validation || null,
            explanation: constraints.explanation || null,
            abort: constraints.abort || null
        };

        const questionInstance =
            new Question(PrivateSymbol, player, question, message, leftButton, isPrivate,
                         checkedConstraints);

        // Immediately ask the question to the user.
        questionInstance.askPlayer();

        return questionInstance.finished;
    }

    // Creates a default validation regular expression for an answer in range of the lengths.
    static defaultValidation(minimumLength, maximumLength) {
        return new RegExp('^[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌ' +
                          'ÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð!\\?\\s,\\.\'\\-~_]{' + minimumLength +
                          ',' + maximumLength + '}$', 'u');
    }

    constructor(privateSymbol, player, question, message, leftButton, isPrivate, constraints) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.player_ = player;
        this.question_ = question;
        this.leftButton_ = leftButton;
        this.isPrivate_ = isPrivate;

        this.constraints_ = constraints;        

        this.message_ = message;

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
            isPrivate: this.isPrivate_
        };

        Dialog.displayInput(this.player_, dialogOptions).then(async (result) => {
            // Resolve the promise with NULL if the player cancelled the dialog.
            if (!result.response) {
                this.resolve_(null);
                return;
            }

            // Resolve the promise with the value when all constraints have been met.
            if (await this.verifyConstraints(result.text)) {
                this.resolve_(result.text);
                return;
            }

            this.attempts_--;

            // If the player is able to make another attempt and an explanation message was given,
            // display that in a dialog box and allow them to try again unless they cancel.
            if (this.attempts_ > 0 && this.constraints_.explanation !== null) {
                let explanation = this.constraints_.explanation;
                if (typeof explanation === 'function')
                    explanation = explanation();

                Dialog.displayMessage(this.player_, this.question_, explanation,
                                      'Try again', 'Cancel').then(result => {
                    // Bail out if the player clicked on "Cancel".
                    if (!result.response) {
                        this.resolve_(null);
                        return;
                    }

                    // Ask the player once more if they clicked on "try again".
                    this.askPlayer();
                    return;
                });

                return;
            }

            // If the player has no more attempts left and an abort message was given, display that
            // in a dialog instead and give them a single "Close" button.
            if (this.attempts_ === 0 && this.constraints_.abort !== null) {
                Dialog.displayMessage(
                    this.player_, this.question_, this.constraints_.abort, 'Close', '').then(() =>
                        this.resolve_(null));
                return;
            }

            // The player either ran out of attempts, or no explanation was given for this question.
            this.resolve_(null);
        });
    }

    // Verifies that the constraints of this question have been met for |input|, and returns true
    // or false depending on that.
    verifyConstraints(input) {
        if (!this.constraints_.validation)
            return true;
        
        if (typeof this.constraints_.validation === 'function')
            return this.constraints_.validation(input);
        
        return this.constraints_.validation.test(input);
    }
}

export default Question;
