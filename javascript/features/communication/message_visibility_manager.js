// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The message visibility manager is able to determine whether a particular message, sent by a
// particular player, should be visible. This considers their own settings, ignore lists, as well
// as general visibility guidelines between different Virtual Worlds.
export class MessageVisibilityManager {
    // Weak map from |player| to Set<|recipient|>, tracking the |player|'s ignore list.
    ignored_ = null;

    constructor() {
        this.ignored_ = new WeakMap();
    }

    // Selects either the |localMessage| or the |remoteMessage| if the message sent by |sender|
    // should be received by the given |recipient|, or NULL if they should not see it at all.
    selectMessageForPlayer(sender, senderVirtualWorld, recipient, { localMessage, remoteMessage }) {
        const ignoreList = this.ignored_.get(recipient);
        if (ignoreList && ignoreList.has(sender))
            return null;  // the |recipient| has ignored the |sender|

        const recipientVirtualWorld = recipient.virtualWorld;
        if (senderVirtualWorld === recipientVirtualWorld)
            return localMessage;  // the |recipient| and the |sender| are in the same world

        const senderInMainWorld = VirtualWorld.isMainWorldForCommunication(senderVirtualWorld);
        const recipientInMainWorld =
            VirtualWorld.isMainWorldForCommunication(recipientVirtualWorld);

        if (senderInMainWorld && recipientInMainWorld)
            return localMessage;  // the |recipient| and the |sender| are in the main world

        // TODO: Enable administrators to toggle cross-world visibility of messages again.
        if (recipient.isAdministrator())
            return remoteMessage;

        // The |recipient| and the |sender| are in different worlds.
        return null;
    }

    // Returns an array with the Player objects that |player| is ignoring.
    getIgnoredPlayers(player) { return Array.from(this.ignored_.get(player) || []); }

    // Adds the |subject| to the list of players that |player| is ignoring.
    addPlayerToIgnoreList(player, subject) {
        if (!this.ignored_.has(player))
            this.ignored_.set(player, new Set());
        
        this.ignored_.get(player).add(subject);
    }

    // Removes the |subject| from the list of players that |player| is ignoring.
    removePlayerFromIgnoreList(player, subject) {
        this.ignored_.get(player)?.delete(subject);
    }

    dispose() {}
}
