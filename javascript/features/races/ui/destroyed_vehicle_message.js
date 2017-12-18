// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MessageView from 'features/races/ui/message_view.js';

// Displays a message to a specific player that they destroyed their vehicle, and therefore won't
// be able to finish the rest of the game.
class DestroyedVehicleMessage {
    static displayForPlayer(players) {
        return MessageView.displayForPlayers([ players ], `You destroyed your vehicle!`, 2000);
    }
}

export default DestroyedVehicleMessage;
