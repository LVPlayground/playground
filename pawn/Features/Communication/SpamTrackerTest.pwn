// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#pragma testcase SpamTrackerTest

stock SpamTrackerTest() {
    new playerId = 42;

    // Make sure that the time system is initialized.
    Time->updateCurrentTimeCache();

    // Case: Players should be allowed to chat by default.
    assert_equals(SpamTracker->isSpamming(playerId), false, "Chat shouldn't be considered spam by default.");

    SpamTracker->record(playerId, "Hello, world!");
    assert_equals(SpamTracker->isSpamming(playerId), false, "Chat shouldn't be considered spam after a single message.");

    SpamTracker->reset();

    // Case: Empty messages will always be considered spam.
    SpamTracker->record(playerId, "");
    assert_equals(SpamTracker->isSpamming(playerId), true, "Empty messages should be considered as spam.");

    SpamTracker->reset();

    // Case: Messages longer than 255 characters will always be considered spam.
    SpamTracker->record(playerId,
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ...
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ...
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Very long messages should be considered as spam.");

    SpamTracker->reset();

    // Case: Recorded data will be reset when a new player connects to the server.
    SpamTracker->record(playerId, "");
    SpamTracker->resetPlayer(playerId);

    assert_equals(SpamTracker->isSpamming(playerId), false, "Connection events should reset recorded data.");

    SpamTracker->reset();

    // Case: Moderators and higher are exempt from the non-sanity spam policies.
    Player(playerId)->setLevel(ModeratorLevel);

    for (new i = 0; i < 5; i++)
        SpamTracker->record(playerId, "foobar");

    assert_equals(SpamTracker->isSpamming(playerId), false, "Crew should be exempt from spam policies.");

    Player(playerId)->onDisconnect();
    SpamTracker->reset();

    // Case: Messages will be considered spam when they are repeated more than once.
    SpamTracker->record(playerId, "Hello, world!");
    SpamTracker->record(playerId, "Hello, world!");

    assert_equals(SpamTracker->isSpamming(playerId), false, "Repeating a message once shouldn't be considered spam.");

    SpamTracker->record(playerId, "Hello, world!");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Repeating a message twice should be considered spam.");

    SpamTracker->reset();

    // Case: Messages repeated more than once will be considered spam regardless of their casing.
    SpamTracker->record(playerId, "HeLlO, WoRlD SpAm!");
    SpamTracker->record(playerId, "HELLO, WORLD SPAM!");
    SpamTracker->record(playerId, "hello, world spam!");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Repeated messages should be considered regardless of casing.");

    SpamTracker->reset();

    // Case: Messages may be repeated more than once if there's at least ten seconds between them.
    SpamTracker->record(playerId, "Hello, spam world!");
    SpamTracker->record(playerId, "Hello, spam world!");
    SpamTracker->record(playerId, "Hello, spam world!");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Repeating a message twice should be considered spam.");

    SpamTracker->onTenSecondTimerTick();
    SpamTracker->record(playerId, "Hello, spam world!");

    assert_equals(SpamTracker->isSpamming(playerId), false, "Repeated messages should be allowed given sufficient time between them.");

    SpamTracker->record(playerId, "Hello, spam world!");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Repeated messages should be considered spam again after saying them once.");

    SpamTracker->reset();

    // Case: Sending more than five messages in an instant is considered spam.
    SpamTracker->record(playerId, "Hello");
    SpamTracker->record(playerId, "world");
    SpamTracker->record(playerId, "how");
    SpamTracker->record(playerId, "are");
    SpamTracker->record(playerId, "you");

    assert_equals(SpamTracker->isSpamming(playerId), false, "Players can send five messages in any amount of time.");

    SpamTracker->record(playerId, "doing?");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Sending more than five messages is considered spam.");

    SpamTracker->reset();

    // Case: Sending more than five messages is spam when done within ten seconds, but is OK when
    // done over a longer amount of time.
    SpamTracker->record(playerId, "Hello");
    Time->setIncrementForTests(3);

    SpamTracker->record(playerId, "world");
    SpamTracker->record(playerId, "how");
    Time->setIncrementForTests(6);

    SpamTracker->record(playerId, "are");
    SpamTracker->record(playerId, "you");
    Time->setIncrementForTests(9);

    SpamTracker->record(playerId, "doing?");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Sending more than five messages is considered spam.");

    Time->setIncrementForTests(11);

    assert_equals(SpamTracker->isSpamming(playerId), false, "Timestamps in the history buffer should adhere to the maximum.");

    SpamTracker->record(playerId, "Yawn");

    assert_equals(SpamTracker->isSpamming(playerId), true, "Only a single history item expired: 'Hello'.");

    Time->setIncrementForTests(14);

    assert_equals(SpamTracker->isSpamming(playerId), false, "Timestamps in the history buffer should adhere to the maximum.");

    SpamTracker->record(playerId, "Table");

    assert_equals(SpamTracker->isSpamming(playerId), false, "Two history items expired: 'world' and 'how'.");

    Time->setIncrementForTests(0);
    SpamTracker->reset();
}
