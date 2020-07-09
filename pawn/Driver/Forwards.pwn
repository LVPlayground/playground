// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Various callbacks have to be listened to in Pawn in order to be interceptable by JavaScript. This
// file defines empty public methods for that purpose.

public OnPlayerText(playerid, text[]) {}
public OnPlayerEditDynamicObject(playerid, STREAMER_TAG_OBJECT:objectid, response, Float:x, Float:y, Float:z, Float:rx, Float:ry, Float:rz) {}
public OnPlayerPickUpDynamicPickup(playerid, STREAMER_TAG_PICKUP:pickupid) {}
public OnPlayerSelectDynamicObject(playerid, STREAMER_TAG_OBJECT:objectid, modelid, Float:x, Float:y, Float:z) {}
public OnPlayerShootDynamicObject(playerid, weaponid, STREAMER_TAG_OBJECT:objectid, Float:x, Float:y, Float:z) {}

forward CAC_OnCheatDetect(player_id, cheat_id, opt1, opt2);
public CAC_OnCheatDetect(player_id, cheat_id, opt1, opt2) {}

forward CAC_OnPlayerKick(player_id, reason_id);
public CAC_OnPlayerKick(player_id, reason_id) {}

forward CAC_OnMemoryRead(player_id, address, size, const content[]);
public CAC_OnMemoryRead(player_id, address, size, const content[]) {}

forward CAC_OnGameResourceMismatch(player_id, model_id, component_type, checksum);
public CAC_OnGameResourceMismatch(player_id, model_id, component_type, checksum) {}

forward CAC_OnScreenshotTaken(player_id);
public CAC_OnScreenshotTaken(player_id) {}

forward OnPlayerChecksumAvailable(playerid, address, checksum);
public OnPlayerChecksumAvailable(playerid, address, checksum) {}
