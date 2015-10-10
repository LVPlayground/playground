// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

#pragma testcase PlayerManagerTestSuite

stock PlayerManagerTestSuite() {
    // Connect five random players to the server.
    PlayerManager->onPlayerConnect(0);
    Player(0)->onConnect();

    PlayerManager->onPlayerConnect(10);
    Player(10)->onConnect();

    PlayerManager->onPlayerConnect(20);
    Player(20)->onConnect();

    PlayerManager->onPlayerConnect(30);
    Player(30)->onConnect();

    PlayerManager->onPlayerConnect(40);
    Player(40)->onConnect();

    assert_equals(PlayerManager->connectedPlayerCount(), 5, "There should be five connected players.");
    assert_equals(PlayerManager->highestPlayerId(), 40, "The highest Player Id should be 40.");

    // Disconnect a player in the middle (in terms of their Id).
    PlayerManager->onPlayerDisconnect(30);
    Player(30)->onDisconnect();

    assert_equals(PlayerManager->connectedPlayerCount(), 4, "There should be four connected players.");
    assert_equals(PlayerManager->highestPlayerId(), 40, "The highest Player Id should still be 40.");

    // Connect the highest player Id, which should decrement it.
    PlayerManager->onPlayerDisconnect(40);
    Player(40)->onDisconnect();

    assert_equals(PlayerManager->highestPlayerId(), 20, "The highest Player Id should be 20.");

    // Disconnect all remaining players, as we want to start clean.
    PlayerManager->onPlayerDisconnect(20);
    Player(20)->onDisconnect();

    PlayerManager->onPlayerDisconnect(10);
    Player(10)->onDisconnect();

    PlayerManager->onPlayerDisconnect(0);
    Player(0)->onDisconnect();

    assert_equals(PlayerManager->connectedPlayerCount(), 0, "There should be no players connected.");
    assert_equals(PlayerManager->highestPlayerId(), 0, "The highest Player Id should be 0.");
}
