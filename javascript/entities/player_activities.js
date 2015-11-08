// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Install the player activity constants on |object|.
//
// DO NOT ADD NEW VALUES TO THIS ENUMERATION WITHOUT ALSO ADDING THEM TO PAWN.
//     //pawn/Entities/Players/PlayerActivity.pwn
exports = (object) => {
  object.PLAYER_ACTIVITY_NONE = 0;
  object.PLAYER_ACTIVITY_JS_RACE = 1;
};
