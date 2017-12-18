// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MessageView from 'features/races/ui/message_view.js';

// Displays a message to a specific player that they have left their vehicle and therefore will be
// dropping out of the race. They will be frozen while the message is displaying.
class LeaveVehicleMessage {
    static displayForPlayer(players) {
        return MessageView.displayForPlayers([ players ], `You left your vehicle!`, 2000);
    }
}

export default LeaveVehicleMessage;
