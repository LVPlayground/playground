// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import GangChatManager from 'features/gang_chat/gang_chat_manager.js';

// Gangs can get a private-ish chat in which they can talk among each other when they prefix their
// messages with an exclamation mark. There is one catch, though: the owner of a certain property
// will be able to read their ramblings as well.
class GangChat extends Feature {
    constructor() {
        super();

        // The gangs feature contains the information necessary to distribute messages to the right
        // audience, i.e. the members of the gang they're part of.
        const gangs = this.defineDependency('gangs');

        // Gang chat has to be announced to administrators watching on IRC.
        const announce = this.defineDependency('announce');

        // Gang chat will register with the communication feature as a delegate.
        const communication = this.defineDependency('communication');

        this.manager_ = new GangChatManager(gangs, announce, communication);
    }

    // ---------------------------------------------------------------------------------------------
    // This feature does not define a public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.manager_.dispose();
    }
}

export default GangChat;
