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
            expression: new RegExp('(' + escape(before) + ')', 'gi'),
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

        // (2) Apply each of the replacements to the |message|, to remove any bad words that may be
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

                // (3)) Uppercase common initialisms.
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

    // ---------------------------------------------------------------------------------------------

    // Loads the replacements from the database, once a connection has been established. Mocked out
    // for testing purposes, because we don't want tests accessing the database.
    async loadReplacementsFromDatabase() {
        let replacements = [
            {
                id: 1,
                user_id: 116118,
                username: 'Russell',
                replacement_before: 'George',
                replacement_after: 'Geroge',
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
                expression: new RegExp('(' + escape(replacement.replacement_before) + ')', 'gi'),
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
