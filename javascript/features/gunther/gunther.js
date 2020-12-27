// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Authenticator } from 'features/gunther/api/authentication/authenticator.js';
import { Dialogflow } from 'features/gunther/api/dialogflow/dialogflow.js';
import { Feature } from 'components/feature_manager/feature.js';
import { GuntherResponder } from 'features/gunther/gunther_responder.js';

// Regular expression used to match messages that should be considered by Gunther.
const kMessageMatcher = /^Gunther,\s+(.+)$/i;

// Feature that adds some intelligence and tools to Gunther. He's not just a guy walking around the
// Pirate Ship - the internet's helping him to be so much more.
export default class Gunther extends Feature {
    authenticator_ = null;
    communication_ = null;
    dialogflow_ = null;
    responder_ = null;

    // Exposes a promise which tests can wait for in order for a response to be complete.
    responsePromiseForTesting_ = null;

    constructor() {
        super();

        // Depend on the Communication feature to be able to intercept messages.
        this.communication_ = this.defineDependency('communication');
        this.communication_.addReloadObserver(this, () => this.initializeCommunicationDelegate());

        // Create the Authenticator, which is necessary in order to be able to issue requests to the
        // network service that powers Gunther's intelligence.
        this.authenticator_ = new Authenticator([
            'https://www.googleapis.com/auth/dialogflow',
        ]);

        // The Dialogflow API enables interaction with the Google AI Dialogflow product, which can
        // be seen at https://cloud.google.com/dialogflow/. We use the beta version of the v2 API.
        this.dialogflow_ = new Dialogflow(this.authenticator_);

        // The Responder is responsible for responding to received messages. It also groups together
        // the ability to deal with rich responses, which need additional input.
        this.responder_ = new GuntherResponder(this.dialogflow_);

        // Start listening to communication on the server, to be able to react.
        this.initializeCommunicationDelegate();
    }

    // Registers ourselves with the Communication feature to be made aware of messages.
    initializeCommunicationDelegate() {
        this.communication_().addDelegate(this);
    }

    // Called when the given |player| has sent the given |message|. If this begins with the defined
    // prefix, we'll consider it for Gunther's intelligence system.
    onPlayerText(player, message) {
        const matches = message.match(kMessageMatcher);
        if (!matches)
            return;

        // Asynchronously start the response flow. No need to wait for it, because Gunther will send
        // his response whenever it's available, if a response will be available at all.
        this.responsePromiseForTesting_ =
            this.responder_.respondTo(player, matches[1], GuntherResponder.kPublicMessage);
    }

    dispose() {
        this.communication_().removeDelegate(this);

        this.communication_.removeReloadObserver(this);
        this.communication_ = null;

        this.dialogflow_.dispose();
        this.dialogflow_ = null;

        this.authenticator_ = null;
    }
}
