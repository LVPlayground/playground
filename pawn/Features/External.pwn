// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Parts of the gamemode can send announcements to IRC, which this class curates.
#include "Features/External/IRC.pwn"

// The player tracker keeps track of the in-game players in the "online" MySQL table. It will be
// updated once per second for each player.
#include "Features/External/PlayerTracker.pwn"

// External sources (IRC, the website, elsewhere) are able to issue commands to the server to chat,
// manipulate players and do maintenance actions on the server.
#include "Features/External/RemoteCommand.pwn"
