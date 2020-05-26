// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Interface for collectable types that's called by the CollectableManager when there's a change in
// available data for a particular player, for example when they log in.
export class CollectableDelegate {
    // Called when the collectables have to be initialized.
    initialize() {}

    // Called when the collectables for the |player| have to be refreshed because (a) they've joined
    // the server as a guest, (b) they've identified to their account, or (c) they've started a new
    // round of collectables and want to collect everything again.
    refreshCollectablesForPlayer(player, collected) {}

    // Called when the map icons for the collectable should either be shown (when |display| is set)
    // or hidden. This is a configuration setting available to Management members.
    refreshCollectableMapIcons(display) {}
}
