// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * What is the kind of IRC message that should be distributed? This is used to avoid having hard-
 * coded prefixes all around the source-code, which increases our flexibility.
 */
enum IrcMessageType {
    DeveloperIrcMessage, // [message]
    BuyPropertyIrcMessage, // [propertyPrice] [playerName] [propertyName]
    GangChatIrcMessage, // [playerId] [playerName] ![message]
    GuestLoginIrcMessage, // [playerId] [playerName]
    LoginIrcMessage, // [playerId] [playerName]
    SellPropertyIrcMessage, // [propertyPrice] [playerName] [propertyName]
    SellAllPropertiesIrcMessage, // [playerId] [playerName] [earnings]
    PrivateMessageIrcMessage, // [playerName] [playerId] [receiverName] [receiverId] [message]
    IrcPrivateMessageIrcMessage, // [playerId] [playerName] [receiverName] [message]
    VipChatIrcMessage, // [playerName] [playerId] [message]
    PhoneIrcMessage, // [playerName] [playerId] [calleeName] [calleeId] [message]
    RegularIrcMessage, // [playerName] [playerId] [message]
    JoinIrcMessage, // [playerId] [playerName]
    JoinIpIrcMessage, // playerId] [playerIp] [playerName]
    LeaveIrcMessage, // [playerId] [playerName] [reason]
    DeathIrcMessage, // [playerName]
    KillIrcMessage, // [playerName] [playerId] [killerName] [killerId] [reason]
    NotConnectedIrcMessage, // [playerId]
    AddCommandIrcMessage // [trigger] [paramTypes] [userRight] [params] 
};

/**
 * There are several reasons which can lead to a player leaving their minigame. This enumeration
 * contains a key for each of them, allowing us to properly give consistent replies to the player.
 */
enum MinigameDropoutReason {
    // When a player leaves a minigame because they typed the /leave command.
    LeaveCommandDropoutReason,

    // When not enough players have signed up to participate in a minigame.
    NotEnoughPlayersDropoutReason,

    // Administrators have the ability to force players out of minigames.
    RemovedByAdministratorDropoutReason
};

/**
 * There are various casino's in Las Venturas, each of which can be indicated with their own name.
 * I actually wouldn't know the name of the small private casino. This enumeration is used by the
 * CasinoArea class, defined in Features/Environment/Area/CasinoArea.pwn.
 */
enum Casino {
   // The Four Dragons casino, which is located at the south side of The Strip.
   FourDragonsCasino,

   // The Caligula's, the famous big casino just to the north of the Pirate Ship.
   CaligulasCasino,

   // The small private casino, which we also use for the VIP room.
   PrivateCasino,

   // Indicates that there is no active casino right now.
   NoCasino
};

/**
 * Which feature should have it's color changed? The ColorPicker can be used in several occasions
 * around the gamemode, here we keep track of those.
 */
enum ColorPickerResultTarget {
    GangColor,
    PlayerColor
};
