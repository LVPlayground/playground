// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MessageView from 'features/races/ui/message_view.js';

// Displays a message to a specific player that they have finished the race. This is not very
// insightful, but they can look at the scoreboard to the right to figure out how they did.
class FinishedMessage {
    static displayForPlayer(players) {
        return MessageView.displayForPlayers([ players ], `Congratulations`, 2000);
    }
}

export default FinishedMessage;
