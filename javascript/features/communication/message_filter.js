// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Minimum message length before considering recapitalization.
const kRecapitalizeMinimumMessageLength = 10;

// Minimum uppercase-to-lowercase ratio before recapitalizing.
const kRecapitalizeMinimumCapitalRatio = .7;

// Common initialisms that we allow to be capitalized.
const kCommonInitialisms = new Set([
    /\b(FYI)\b/ig, /\b(GG)\b/ig, /\b(WTF)\b/ig,
]);

// The message filter is responsible for filtering the contents of messages. This could include
// censoring words, as well as replacing words with other words, or blocking messages in their
// entirety based on the severity of a word.
export class MessageFilter {
    // Filters the given |message|, as sent by the |player|. If the filter decides to block this
    // message, the |player| will be informed about this.
    filter(player, message) {

    }

    // Completely recapitalizes a message. Sentence case will be applied, a few common acronyms will
    // be allowed to be capitalized (but only when in a stand-alone word), excess exclamation and
    // question marks will be removed and player names will get proper capitalization.
    recapitalize(message) {
        let reformattedMessage = '';

        // (1) Remove excess exclamation and question marks and punctuation in general.
        message = message.replace(/([\?!`])\1+/g, '$1');
        message = message.replace(/(([\?!`]){2})([\?!`])*/g, '$1');
        message = message.replace(/[\.]{3,}/g, '...');

        // (2) Recapitalize the beginning of sentences.
        {
            const sentences = message.replace(/([.?!])\s*(?=[A-Z])/g, '$1Ω').split('Ω');
            for (let sentence of sentences) {
                sentence = sentence[0].toUpperCase() + sentence.substring(1).toLowerCase();

                // (3)) Uppercase common initialisms.
                for (const initialism of kCommonInitialisms)
                    sentence = sentence.replace(initialism, (_, word) => word.toUpperCase());

                reformattedMessage += sentence + ' ';
            }
        }

        // (4) Recapitalize player names when they appear in full or as a prefix.
        for (const player of server.playerManager) {
            const nameExpression =
                new RegExp('\\b' + player.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig');
            
            reformattedMessage = reformattedMessage.replace(nameExpression, player.name);
        }

        return reformattedMessage.trimRight();
    }
}
