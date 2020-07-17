// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { murmur3hash } from 'base/murmur3hash.js';

// Number of seconds to timeout when a request couldn't successfully be put through.
const kErrorTimeoutSec = 300;

// The Gunther responder is responsible for responding to messages. It does this by sending the
// received question to the Dialogflow API and interpreting the response.
export class GuntherResponder {
    // Defines the sort of message that Gunther should send.
    static kPublicMessage = 0;
    static kPrivateMessage = 1;

    #dialogflow_ = null;
    #sessions_ = null;
    #suspended_ = null;

    constructor(dialogflow) {
        this.#dialogflow_ = dialogflow;
        this.#sessions_ = new WeakMap();
    }

    // Responds to the |player|, who has sent the given |message| to Gunther. When a response is
    // available, Gunther will respond in an appropriate forum depending on the given |type|.
    async respondTo(player, message, type) {
        const gunther = server.playerManager.getByName('Gunther');

        if (this.isSuspended() || !gunther)
            return false;  // the service has self-suspended, don't issue requests now

        if (!this.#sessions_.has(player))
            this.createSessionForPlayer(player);

        // (1) Issue the request through the Dialogflow API.
        const response = await this.#dialogflow_.detectIntent({
            sessionId: this.#sessions_.get(player),
            languageCode: 'en',
            text: message,
        });

        // (2) If the request was unsuccessful, suspend the responder for some amount of time.
        if (!response || !response.queryResult)
            return this.suspend(), false;

        // (3) Have Gunther respond with the fulfillment text. We do this by dispatching an event
        // that mimics Gunther sending a message. The spam filters should be lenient.
        const responseText = this.processResponse(player, response.queryResult);
        if (!responseText)
            return false;  // processing decided to drop the message

        // TODO: Consider the |response.queryResult.action| for richer responses.
        // TODO: Consider |type| and issue a private message if the message was sourced that way.
        dispatchEvent('playertext', {
            playerid: gunther.id,
            text: responseText,
        });

        return true;
    }

    // Processes the |queryResult| for the given |player|. This helps personalise a few things,
    // particularly inclusion of their nickname in the message.
    processResponse(player, queryResult) {
        console.log(queryResult);

        let responseText = queryResult.fulfillmentText;

        // (1) Replace placeholders in the |fulfillmentText| with their intended values.
        responseText = responseText.replaceAll('{nickname}', player.name);

        // And finally, return the |responseText| to the caller.
        return responseText;
    }

    // Creates a new session for the given |player|. Sessions are stable, which means that Gunther
    // will retain some memory of the conversation the player has with them.
    createSessionForPlayer(player) {
        if (player.account.isIdentified())
            this.#sessions_.set(player, player.account.userId);
        else
            this.#sessions_.set(player, murmur3hash(player.name));
    }

    // Returns whether the responder is currently suspended, which is determined by the member being
    // set to a time in the future. We'll automatically clean up the state when a suspension expired
    isSuspended() {
        if (!this.#suspended_)
            return false;
        
        if (this.#suspended_ > server.clock.monotonicallyIncreasingTime())
            return true;
        
        this.#suspended_ = null;
        return false;
    }

    // Suspends the responder for |kErrorTimeoutSec| seconds. This should be done in response to
    // networking issues, or error responses from Google, to avoid hammering the service.
    suspend() {
        this.#suspended_ = server.clock.monotonicallyIncreasingTime() + kErrorTimeoutSec * 1000;
    }

    dispose() {
        this.#dialogflow_ = null;

        this.#sessions_.clear();
        this.#sessions_ = null;
    }
}
