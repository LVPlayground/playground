// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase PlayerManagerTestSuite

ConnectFakePlayerForTests(id, const nickname[], bool: npc) {
    PlayerManager->onPlayerConnect(id);
    Player(id)->onConnect();

    format(Player(id)->nicknameString(), 24, "%s", nickname);

    if (npc)
        Player(id)->enableFlagForTests(IsNonPlayerCharacterFlag);
    else
        Player(id)->disableFlagForTests(IsNonPlayerCharacterFlag);
}

DisconnectFakePlayerForTests(id) {
    Player(id)->onDisconnect();
    PlayerManager->onPlayerDisconnect(id);
}

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

    // Tests the different clauses of PlayerManager::findPlayerByIdOrPartialName(), which powers
    // many of the commands available on Las Venturas Playground.

    new playerId;

    // (1) Connect four fake players, one of which is a non-player character.
    ConnectFakePlayerForTests(0, "Foo", false);
    ConnectFakePlayerForTests(1, "1HiBar1", false);
    ConnectFakePlayerForTests(42, "FooBot", true);
    ConnectFakePlayerForTests(100, "2HiBar2", false);

    // (2) Confirm that the player manager indeed agrees that there are four connected players.
    assert_equals(PlayerManager->connectedPlayerCount(), 4, "There should be four players connected.");

    // (3) Get each player by their ID, when given as a string.
    assert_equals(PlayerManager->findPlayerByIdOrPartialName("0", playerId), PlayerFound, "Player #0 should be findable by id.");
    assert_equals(playerId, 0, "The id result should map to player #0.");

    assert_equals(PlayerManager->findPlayerByIdOrPartialName("1", playerId), PlayerFound, "Player #1 should be findable by id.");
    assert_equals(playerId, 1, "The id result should map to player #1.");

    assert_equals(PlayerManager->findPlayerByIdOrPartialName("42", playerId), PlayerFound, "Player #42 should be findable by id.");
    assert_equals(playerId, 42, "The id result should map to player #42.");

    assert_equals(PlayerManager->findPlayerByIdOrPartialName("100", playerId), PlayerFound, "Player #100 should be findable by id.");
    assert_equals(playerId, 100, "The id result should map to player #100.");

    // (4) Get each player by their nickname, when given as a string.
    assert_equals(PlayerManager->findPlayerByIdOrPartialName("Foo", playerId), PlayerFound, "Player #0 should be findable by name.");
    assert_equals(playerId, 0, "The name result should map to player #0.");

    assert_equals(PlayerManager->findPlayerByIdOrPartialName("1HiBar1", playerId), PlayerFound, "Player #1 should be findable by name.");
    assert_equals(playerId, 1, "The name result should map to player #1.");

    assert_equals(PlayerManager->findPlayerByIdOrPartialName("2HiBar2", playerId), PlayerFound, "Player #100 should be findable by name.");
    assert_equals(playerId, 100, "The name result should map to player #100.");

    // (5) Can't get NPCs by their name.
    assert_equals(PlayerManager->findPlayerByIdOrPartialName("FooBot", playerId), PlayerNameNotFound, "NPCs should not be findable by name.");
    assert_equals(playerId, Player::InvalidId, "The name result should not map to player #42.");

    // (6) Ambiguous results will return multiple results.
    assert_equals(PlayerManager->findPlayerByIdOrPartialName("HiBar", playerId), PlayerNameAmbiguous, "Multiple names should be returned as ambiguous.");
    assert_equals(playerId, Player::InvalidId, "The first result should not map to any player id.");
    assert_equals(PlayerManager->foundPlayerIdResult(0), 1, "The first stored result should map to the lowest player id.");
    assert_equals(PlayerManager->foundPlayerIdResult(1), 100, "The second stored result should map to the second lowest player id.");
    assert_equals(PlayerManager->foundPlayerIdResult(2), Player::InvalidId, "There should only be two stored results.");

    // (7) Disconnect the fake players again.
    DisconnectFakePlayerForTests(0);
    DisconnectFakePlayerForTests(1);
    DisconnectFakePlayerForTests(42);
    DisconnectFakePlayerForTests(100);
}
