// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MessageView = require('features/races/ui/message_view.js');

// Displays a message to all remaining participants that the race has expired, and that they will
// have to stop. The participant will be frozen while the message is being displayed.
class RaceExpiredMessage {
    static displayForPlayers(players) {
        return MessageView.displayForPlayers(players, `Time's up!`, 3000);
    }
}

exports = RaceExpiredMessage;
