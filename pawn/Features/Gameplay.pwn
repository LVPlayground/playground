// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// After their first connection to the server, the first thing visible to players is the class
// selection screen. This basically provides the first impression players get from Las Venturas
// Playground, and, as such, we have to take good care in handling this.
#include "Features/Gameplay/ClassManager.pwn"
#include "Features/Gameplay/SpawnManager.pwn"

// Each player has got a nickname color, which might change throughout the game session. The
// Color Manager's duty is to set the right nickname colors and to keep track of previous ones.
// The Color Picker is available for VIPs to change their nickname color and preserve this.
#include "Features/Gameplay/Colors/ColorManager.pwn"
#include "Features/Gameplay/Colors/ColorPicker.pwn"

// Enable the new nitro-system to have it more isolated. This feature handles everything with nitro:
// whetether the vehicle is applicable and attaching nitro to a vehicle.
#include "Features/Gameplay/Vehicles/NitroHandler.pwn"

// Sending a player to jail is a way of punishment, as we severely limit their in-game experience
// for a certain amount of time. The jail once again is located on an island.
#include "Features/Gameplay/Jail/JailController.pwn"
#include "Features/Gameplay/Jail/JailCommands.pwn"

// Spammers, advertisers and insulters should be punished for their poor choice of words, and
// therefore we offer staff the ability to mute these players.
#include "Features/Gameplay/Commands/Mute/MuteManager.pwn"
#include "Features/Gameplay/Commands/Mute/MuteCommands.pwn"

// Players of Las Venturas Playground have the ability to sent private messages to each other,
// or phone up another player.
#include "Features/Gameplay/Communication/PrivateMessagingManager.pwn"
#include "Features/Gameplay/Communication/PrivateMessagingCommands.pwn"
#include "Features/Gameplay/Communication/CallManager.pwn"
#include "Features/Gameplay/Communication/CallCommands.pwn"

// We have various features intended to enhance the experience available to our more regular players
// and those who donated to Las Venturas Playground. The VIP classes together manage the features,
// discounts and possibilities offered to them.
#include "Features/Gameplay/VIP/VeryImportantPlayersManager.pwn"
#include "Features/Gameplay/VIP/VeryImportantPlayersCommands.pwn"

// A Cruise is a great way to spend time exploring the San Andreas map. A player is appointed to 
// lead the cruise and all parcitipants are supposed to follow that person driving arround the map
#include "Features/Gameplay/Vehicles/Cruise/CruiseController.pwn"
#include "Features/Gameplay/Vehicles/Cruise/CruiseCommands.pwn"

// Las Venturas Playground has a plethora of commands related to teleporting to another location.
#include "Features/Gameplay/Teleportation/TeleportationCommands.pwn"
#include "Features/Gameplay/Teleportation/TeleportationManager.pwn"

// Grand Theft Auto is a game all about driving about in all sorts of vehicles. Since nobody is
// perfect stuff tends to happen to those vehicles which could eventually lead to it exploding or
// worse. Commands are needed to get a vehicle out of a troublesome situation.
#include "Features/Gameplay/Vehicles/VehicleGameplayCommands.pwn"

// The ship is an important part of LVP. People can idle and take a rest over there, therefore it is
// important that those things are strictly taken aware of. This file takes care of it so people can
// use the ship safely and well.
#include "Features/Gameplay/ShipManager.pwn"

// Handle the access of admin vehicles for VIPs.
#include "Features/Gameplay/Vehicles/AdminVehicleAccessManager.pwn"

// Achievements provide a way of recognizing the player's achievements, such as paying certain sums
// in tax, killing a certain amount of people or being in-game for a decent amount of time.
#include "Features/Gameplay/Achievements.pwn"

// Announcing certain events to players is generalized in the Announcements class, whereas we
// generalize responses to certain actions in the Responses class.
#include "Features/Gameplay/Communication/Announcements.pwn"
#include "Features/Gameplay/Communication/Responses.pwn"

// Spectating can be a handy tool for LVP crew to catch hackers/cheaters.
#include "Features/Gameplay/Commands/PlayerSpectateHandler.pwn"

// Using commands players are able to show/hide informative textdraws showing each player's FPS,
// ping and packetloss percentage while roaming.
#include "Features/Gameplay/Commands/PlayerInfoHandler.pwn"

// If ever needed, crew should be able to fix a player.
#include "Features/Gameplay/Commands/FixPlayerCommands.pwn"

// Add the (in)famous /report-command to report players.
#include "Features/Gameplay/Commands/ReportHandler.pwn"

// Add the script responsible for statistic gathering during LVP 10.
#include "Features/Gameplay/AnniversaryStatistics.pwn"