// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// MySQL query for loading replacements from the database.
const LOAD_REPLACEMENTS_QUERY = `
    SELECT
        replacements.id,
        replacements.user_id,
        users.username,
        replacements.replacement_before,
        replacements.replacement_after
    FROM
        replacements
    LEFT JOIN
        users ON users.user_id = replacements.user_id`;

// MySQL query for storing replacement information in the database.
const STORE_REPLACEMENT_QUERY = `
    INSERT INTO
        replacements
        (user_id, replacement_before, replacement_after)
    VALUES
        (?, ?, ?)`;

// MySQL query for removing a replacement query from the database, keyed by ID.
const REMOVE_REPLACEMENT_QUERY = `
    DELETE FROM
        replacements
    WHERE
        id = ?
    LIMIT
        1`;

// Maximum length of a message in main chat, in number of characters.
const kMaximumMessageLength = 122;

// Minimum message length before considering recapitalization.
const kRecapitalizeMinimumMessageLength = 10;

// Minimum uppercase-to-lowercase ratio before recapitalizing.
const kRecapitalizeMinimumCapitalRatio = .8;

// Common initialisms that we allow to be capitalized.
const kCommonInitialisms = new Set([
    /\b(FYI)\b/ig, /\b(GG)\b/ig, /\b(LVP)\b/ig, /\b(WTF)\b/ig,
]);

// Escapes the |text| for safe usage in regular expressions.
function escape(text) {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// The message filter is responsible for filtering the contents of messages. This could include
// censoring words, as well as replacing words with other words, or blocking messages in their
// entirety based on the severity of a word.
export class MessageFilter {
    replacements_ = null;

    constructor() {
        this.replacements_ = new Set();
        this.loadReplacementsFromDatabase();
    }

    // ---------------------------------------------------------------------------------------------

    // Gets access to all the replacements that exist in the message filter.
    get replacements() { return this.replacements_; };

    // Adds the given replacement, changing |before| into |after|, as introduced by |player|. If
    // |after| is the empty string, then the word will be blocked instead.
    async addReplacement(player, before, after = '') {
        const replacement = {
            id: await this.addReplacementToDatabase(player, before, after),
            userId: player.account.userId,
            nickname: player.name,
            before, after,
            expression: new RegExp('(' + escape(before) + ')', 'i'),
        };

        this.replacements_.add(replacement);
    }

    // Removes the replacement identified by the given |before|.
    async removeReplacement(before) {
        for (const replacement of this.replacements_) {
            if (replacement.before !== before)
                continue;
            
            await this.removeReplacementFromDatabase(replacement.id);

            this.replacements_.delete(replacement);
            return;
        }
    }

    // ---------------------------------------------------------------------------------------------
    
    // Filters the given |message|, as sent by the |player|. If the filter decides to block this
    // message, the |player| will be informed about this.
    filter(player, message) {
        // (1) Force-recapitalize the sentence if it's longer than a certain length, and the ratio
        // between lower-case and upper-case characters exceeds a defined threshold.
        if (message.length > kRecapitalizeMinimumMessageLength &&
                this.determineCaseRatio(message) > kRecapitalizeMinimumCapitalRatio) {
            message = this.recapitalize(message);
        }

        // (2a) Experimental: run a number of permutations of the |message| which are intended to
        // detect players trying to avoid the block. We don't block these messages yet.
        const permutations = [
            [ 'no-spaces', message.replaceAll(' ', '') ],
            [ 'numbers-3', message.replaceAll('3', 'e') ],
            [ 'numbers-3-spaces', message.replaceAll('3', 'e').replaceAll(' ', '') ],
            [ 'numbers-4', message.replaceAll('4', 'a') ],
            [ 'numbers-4-spaces', message.replaceAll('4', 'a').replaceAll(' ', '') ],
            [ 'numbers-34', message.replaceAll('3', 'e').replaceAll('4', 'a') ],
            [ 'numbers-34-spaces', message.replaceAll('3', 'e').replaceAll('4', 'a').replaceAll(' ', '') ],
        ];

        for (const replacement of this.replacements_) {
            if (replacement.expression.test(message))
                continue;  // they'd be caught

            for (const [ experiment, modifiedMessage ] of permutations) {
                if (!replacement.expression.test(modifiedMessage))
                    continue;  // they'd be caught

                console.log(`[filterpp][${experiment}] ${player.name}: ${message}`);
            }
        }

        // (2b) Apply each of the replacements to the |message|, to remove any bad words that may be
        // included in it with alternatives. Replacements will maintain case.
        for (const replacement of this.replacements_) {
            if (!replacement.expression.test(message))
                continue;
            
            if (!replacement.after.length) {
                player.sendMessage(Message.COMMUNICATION_FILTER_BLOCKED);
                return null;
            }

            message = this.applyReplacement(message, replacement);
        }

        // (3) Cap the length of a message to a determined maximum, as messages otherwise would
        // disappear into the void with no information given to the sending player at all.
        const maximumLength = kMaximumMessageLength - player.name.length;
        if (message.length > maximumLength)
            message = this.trimMessage(message, maximumLength);

        return message;
    }

    // Determines the ratio of upper-case characters in the full sentence. Punctuation signs,
    // numbers and other non-A-Z characters will be ignored.
    determineCaseRatio(message) {
        let lowercaseCount = 0;
        let uppercaseCount = 0;
        
        for (let i = 0; i < message.length; ++i) {
            const charCode = message.charCodeAt(i);
            if (charCode >= 65 /* A */ && charCode <= 90 /* Z */)
                ++uppercaseCount;
            else if (charCode >= 97 /* a */ && charCode <= 122 /* z */)
                ++lowercaseCount;
        }

        const totalCount = lowercaseCount + uppercaseCount;
        return totalCount > 0 ? uppercaseCount / totalCount
                              : 0;
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
                sentence = sentence.replace(/\bi\b/ig, 'I');

                // (3)) Uppercase common initialisms, as well as "I".
                for (const initialism of kCommonInitialisms)
                    sentence = sentence.replace(initialism, (_, word) => word.toUpperCase());

                reformattedMessage += sentence + ' ';
            }
        }

        // (4) Recapitalize player names when they appear in full or as a prefix.
        for (const player of server.playerManager) {
            const nameExpression =
                new RegExp('\\b' + escape(player.name), 'ig');
            
            reformattedMessage = reformattedMessage.replace(nameExpression, player.name);
        }

        reformattedMessage = reformattedMessage.trimRight();

        // (5) Make sure that their sentence ends with a punctuation mark.
        if (!/[.?!]$/.test(reformattedMessage)) {
            const firstWords = reformattedMessage.match(/(?:^|(?:[\.\?!]\s))(\w+)/g);
            if (firstWords && firstWords.length > 0) {
                const finalStart = firstWords.pop().toLowerCase();
                for (const questionIndicator of ['what', 'why', 'how', 'is']) {
                    if (finalStart.endsWith(questionIndicator))
                        return reformattedMessage + '?';
                }
            }

            reformattedMessage += '.';
        }

        return reformattedMessage;
    }

    // Applies the given |replacement| to the |message|. Case has to be maintained. The text can
    // exist multiple times in the |message|, which all need to be replaced.
    applyReplacement(message, replacement) {
        return message.replace(replacement.expression, match => {
            let casedReplacement = '';
            let casedLength = Math.min(replacement.before.length, replacement.after.length);

            for (let i = 0; i < casedLength; ++i) {
                if (match.charCodeAt(i) >= 65 /* A */ && match.charCodeAt(i) <= 90 /* Z */)
                    casedReplacement += replacement.after[i].toUpperCase();
                else
                    casedReplacement += replacement.after[i].toLowerCase();
            }

            return casedReplacement + replacement.after.substring(casedLength);
        });
    }

    // Trims the given |message| to the given |maximumLength|. We'll find the closest word from
    // that position and break there when it's close enough, otherwise apply a hard break.
    trimMessage(message, maximumLength) {
        const kCutoffText = '...';

        // Determines exactly where the |message| should be cut.
        const messageCutoffIndex = maximumLength - kCutoffText.length;
        const messageCutoffWhitespace = message.lastIndexOf(' ', messageCutoffIndex);

        // If the last whitespace character is within 8 characters of the message length limit, cut
        // there. Otherwise cut the |message| exactly at the limit.
        if (messageCutoffIndex - messageCutoffWhitespace <= 8)
            return message.substring(0, messageCutoffWhitespace) + kCutoffText;
        else
            return message.substring(0, messageCutoffIndex) + kCutoffText;
    }

    // ---------------------------------------------------------------------------------------------

    // Loads the replacements from the database, once a connection has been established. Mocked out
    // for testing purposes, because we don't want tests accessing the database.
    async loadReplacementsFromDatabase() {
        let replacements = [
            {
                id: 1,
                user_id: 116118,
                username: 'Russell',
                replacement_before: 'george',
                replacement_after: 'geroge',
            },
            {
                id: 2,
                user_id: 116118,
                username: 'Russell',
                replacement_before: '/quit',
                replacement_after: '',
            }
        ];

        if (!server.isTest()) {
            const results = await server.database.query(LOAD_REPLACEMENTS_QUERY);
            if (!results)
                return;  // an error occurred while running this query
            
            replacements = results.rows;
        }

        // For each of the replacements, add them to the local cache.
        for (const replacement of replacements) {
            this.replacements_.add({
                id: replacement.id,
                userId: replacement.user_id,
                nickname: replacement.username,
                before: replacement.replacement_before,
                after: replacement.replacement_after,
                expression: new RegExp('(' + escape(replacement.replacement_before) + ')', 'i'),
            });
        }
    }

    // Writes the replacement with the given information to the database, and returns the ID.
    async addReplacementToDatabase(player, before, after) {
        if (server.isTest())
            return Math.floor(Math.random() * 100000);
        
        const results = await server.database.query(
            STORE_REPLACEMENT_QUERY, player.account.userId, before, after);

        return results ? results.insertId
                       : null;
    }

    // Removes the replacement identified by the |replacementId| from the database.
    async removeReplacementFromDatabase(replacementId) {
        if (server.isTest())
            return;
        
        await server.database.query(REMOVE_REPLACEMENT_QUERY, replacementId);
    }
}
