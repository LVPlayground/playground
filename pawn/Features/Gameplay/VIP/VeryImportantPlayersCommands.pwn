// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * As a simple thank you we offer our donating users various features and abilities regular players
 * have not. The appropriate commands to support these extras are holded by this class.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class VeryImportantPlayersCommands {
    /**
     * VIPs have the ability to chat with IRC users whilst playing ingame. For this, they use the 
     * /ircpm command, which works and looks just the same as the /pm command. To quickly reply
     * to a /ircpm received message, /r(eply) should do fine.
     * 
     * @param playerId Id of the player who executed this command.
     * @param user Username of the IRC user the message is send to.
     * @param message Message that needs to be send.
     * @command /ircpm [user] [message]
     */
    @command("ircpm")
    public onIrcpmCommand(playerId, params[]) {
        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) < 2) {
            SendClientMessage(playerId, Color::Information, "Usage: /ircpm [user] [message]");
            return 1;
        }

        new sender[25], receiver[25], parameterOffset = 0;
        format(sender, sizeof(sender), "%s", Player(playerId)->nicknameString());
        Command->stringParameter(params, 0, receiver, sizeof(receiver));
        parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0)
            + strlen(receiver) + 1);

        PrivateMessagingManager->sendPrivateIrcMessage(playerId, sender[0], receiver[0],
            params[parameterOffset]);

        return 1;
    }

    /**
     * This command can be used by VIPs to list all their features and extras, allowing them to quickly
     * see what they have earned for donating.
     * 
     * @param playerId Id of the player who executed this command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /vip
     */
    @command("vip")
    public onVipCommand(playerId, params[]) {
        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        SendClientMessage(playerId, Color::Success, "Las Venturas Playground offers you the following extra features:");
        SendClientMessage(playerId, Color::Information, "  - {40CCFF}Change player color/weather/teleportation settings, spawn armor");
        SendClientMessage(playerId, Color::Information, "  - {40CCFF}Various IRC extras like IRC <-> ingame PM'ing and VIP channel");
        SendClientMessage(playerId, Color::Information, "  - {40CCFF}VIP status on site and forum, access to ingame VIP room");
        SendClientMessage(playerId, Color::Information, "And much more! Check http://donate.sa-mp.nl!");

        return 1;
        #pragma unused params
    }

    /**
     * VIP players ingame have the possibility to send messages to other ingame VIPs with #. From
     * the #LVP.vip IRC channel, VIPs can use !vip to chat along with ingame VIPs.
     * 
     * @param playerId Id of the player who executed this command.
     * @param message Message that needs to be send to ingame VIPs.
     * @command #[message]
     */
    public onVipChatCommand(playerId, message[]) {
        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        // Send message to all ingame VIPs and (undercover)admins.
        new notice[256];
        format(notice, sizeof(notice), "[VIP] [%d] %s: %s", playerId, Player(playerId)->nicknameString(),
            message[1]);

        for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
            if (Player(player)->isConnected() == false || (Player(player)->isVip() == false
                && Player(player)->isAdministrator() == false))
                continue; /* either not connected or not VIP/crew */

            if (LegacyIsPlayerIgnored(player, playerId) == true)
                continue; /* the player is ignoring this VIP */

            SendClientMessage(player, Color::VipChat, notice);
        }

        format(notice, sizeof(notice), "%s %d %s", Player(playerId)->nicknameString(), playerId, message[1]);
        IRC->broadcast(VipChatIrcMessage, notice);

        return 1;
    }

    /**
     * Having a little influence on your own environment can really help out in some situations. Hence
     * Las Venturas Playground offers its VIPs to change their own weather at free will. We've also
     * added a funny weathertype called 'drugs'.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param weatherType Type of weather.
     * @command /my weather [day/evening/hot/storm/foggy/drugs]
     */
    @switch(PlayerCommand, "weather")
    public onPlayerWeatherCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their weather for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my weather [day/evening/hot/storm/foggy/drugs]");
            return 1;
        }

        if (VeryImportantPlayersManager->changeVipWeather(playerId, params[0]))
            SendClientMessage(playerId, Color::Success, "The weather has been changed for you!");

        return 1;
    }

    /**
     * Like weather, VIPs are also allowed to change their in-game time. We allow them to do this
     * on a per-hour granularity, i.e. values [0, 23]. The given time will be reset when they either
     * change the weather, or when they respawn.
     *
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @command /my time [off | 0-23]
     */
    @switch(PlayerCommand, "time")
    public onPlayerTimeCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their time for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my time [off | 0-23]");
            return 1;
        }

        new argument[32];
        Command->stringParameter(params, 0, argument, sizeof(argument));

        if (strcmp(argument, "off", true) == 0) {
            TimeController->releasePlayerDefaultTime(playerId);
            SendClientMessage(playerId, Color::Success, "The time has been released for you!");
            return 1;
        }

        new hour = Command->integerParameter(params, 0);
        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my time [off | 0-23]");
            return 1;
        }

        TimeController->setPlayerDefaultTime(playerId, hour, 0);

        SendClientMessage(playerId, Color::Success, "The time has been changed for you!");

        return 1;
    }

    /**
     * Ingame player colours can be persistently changed by VIPs. Alias for /my colour.
     * 
     * @param playerId Id of the player who is changing their colour.
     * @param subjectId Id of the player who this command should be applied to.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /my color
     */
    @switch(PlayerCommand, "color")
    public onPlayerColorCommand(playerId, subjectId, params[]) {
        this->onPlayerColourCommand(playerId, subjectId, params);

        return 1;
    }

    /**
     * Ingame player colours can be persistently changed by VIPs.
     * 
     * @param playerId Id of the player who is changing their colour.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /my colour
     */
    @switch(PlayerCommand, "colour")
    public onPlayerColourCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their color for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        new const price = GetEconomyValue(VipColourChange);

        // We charge VIPs 10 mil on every player color change, except for crew.
        if (Player(playerId)->isAdministrator() == false && GetPlayerMoney(playerId) < price) {
            new message[128];
            format(message, sizeof(message), "You need {40CCFF}$%s{FFFFFF} to change your colour.", formatPrice(price));

            SendClientMessage(playerId, Color::Information, message);
            return 1;
        }

        // The color changing itself is done within the ColorPicker class.
        ColorPicker->showColorPicker(playerId, PlayerColor);

        return 1;
        #pragma unused params
    }

    /**
     * VIPs can apply a few looks to themselves which will make them look more funny. Every look
     * comes with its own weapon, which will give the look an extra touch. The look is lost on respawn.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param lookType Type of look.
     * @command /my look [assassin/maniac/punk/riot]
     */
    @switch(PlayerCommand, "look")
    public onPlayerLookCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId)
            return 0; /* VIPs don't need admins to change their looks for them */

        if (Player(playerId)->isVip() == false && Player(playerId)->isAdministrator() == false) {
            SendClientMessage(playerId, Color::Error, "This is a VIP only command. For more information, check out \"/donate\"!");
            return 1;
        }

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /my look {DC143C}[reset] {FFFFFF}[assassin/bastard/maniac/ninja/punk/riot]");
            return 1;
        }

        if (IsPlayerInAnyVehicle(playerId)) {
            SendClientMessage(playerId, Color::Error,
                "To prevent abuse, you should exit any vehicle and stand still to use this command.");
            return 1;
        }

        if (DamageManager(playerId)->isPlayerFighting() == true) {
            SendClientMessage(playerId, Color::Error, "You can't change your look while fighting.");
            return 1;
        }

        if (ShipManager->isPlayerWalkingOnShip(playerId)) {
            SendClientMessage(playerId, Color::Error, "You can't change your look while on the ship.");
            return 1;
        }

        VeryImportantPlayersManager->changeVipLook(playerId, params[0]);

        return 1;
    }

    /**
     * IRC PM'ing is one of our top VIP features. Players who've donated can request +voice in
     * #LVP.echo, to have ability to the !pm command. With !pm it's possible to send private messages
     * to ingame players via IRC.
     *
     * If the message was sent to an ingame VIP player, he/she can use /r to simply answer the IRC
     * message. Non-VIPs don't have the ability to send PMs to IRC at all.
     *
     * @param playerId Id of the player ingame where the message needs to be send to.
     * @param message Message that needs to be send.
     * @remotecommand !pm [playerId] [message]
     */
    @switch(RemoteCommand, "pm")
    public onRemotePrivateMessageCommand(params[]) {
        new notice[256], message[256], sender[25];

        // Store IRC sender, receiverId and messageOffset in variables.
        Command->stringParameter(params, 0, sender, sizeof(sender));
        new receiverId = Command->integerParameter(params, 1);

        new messageOffset = Command->startingIndexForParameter(params, 2);
        if (messageOffset == -1)
            return 1; /* invalid parameters given by the sender */
        strncpy(message, params[messageOffset], sizeof(message));

        // Check if the receiverId is connected, else, inform the IRC user.
        if (Player(receiverId)->isConnected() == false) {
            format(notice, sizeof(notice), "%d", receiverId);
            IRC->broadcast(NotConnectedIrcMessage, notice);
            return 1;
        }

        // Format appropriate variables to let the receiver use /r(eply) to reply to this IRC message.
        PrivateMessagingManager->setLastPrivateMessageSenderName(receiverId, sender);
        PrivateMessagingManager->lastPrivateMessageSenderId(receiverId) = Player::InvalidId;

        // Time to send out the message and notify admins ingame and on IRC.
        format(notice, sizeof(notice), "**  PM: %s (IRC) to %s (Id:%d): %s", sender,
            Player(receiverId)->nicknameString(), receiverId, message);

        for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
            if (Player(player)->isConnected() == false || Player(player)->isAdministrator() == false)
                continue; /* either not connected or not an administrator */

            if (player == receiverId)
                continue; /* let's not spam the receiver twice */

            if (MessageLevelsManager->getPlayerMessageLevel(player) < 1)
                continue; /* the administrator does not wish to see this message */

            SendClientMessage(player, Color::PlayerStatistics, notice);
        }

        // Send the actual message the to receiver.
        format(notice, sizeof(notice), "PM from [IRC] %s: {FFFFFF}%s", sender, message);
        SendClientMessage(receiverId, Color::PrivateMessageReceived, notice);

        // Only show the /r or /reply message to people who haven't played on LVP a lot yet.
        if (Player(receiverId)->isRegular() == false)
            SendClientMessage(receiverId, Color::ConnectionMessage, "* Use {A9C4E4}/r or /reply {CCCCCC}to quickly reply to the message.");

        // Broadcast the message on IRC.
        format(notice, sizeof(notice), "%s 255 %s %d %s", sender, Player(receiverId)->nicknameString(),
            receiverId, message);
        IRC->broadcast(PrivateMessageIrcMessage, notice);

        return 1;
    }

    /**
     * Ingame VIPs have their chat which they can reach with the '#' character. All messages sent to
     * this special chat are also redirected to the IRC VIP channel: #lvp.vip. If an IRC user wants
     * participate in the ingame VIP chat, he/she can simply use !vip to do that.
     *
     * @param message Message that needs to be send to ingame VIP chat.
     * @remotecommand !vip [message]
     */
    @switch(RemoteCommand, "vipm")
    public onRemoteVipCommand(params[]) {
        new notice[256], message[256], sender[25];

        // Store IRC sender and message in variables.
        Command->stringParameter(params, 0, sender, sizeof(sender));

        new messageOffset = Command->startingIndexForParameter(params, 1);
        if (messageOffset == -1)
            return 1; /* invalid parameters given by the sender */
        strncpy(message, params[messageOffset], sizeof(message));

        // Send message to all ingame VIPs and (undercover)admins.
        format(notice, sizeof(notice), "[VIP] [IRC] %s: %s", sender, message);

        for (new player = 0; player <= PlayerManager->highestPlayerId(); ++player) {
            if (Player(player)->isConnected() == false || (Player(player)->isVip() == false
                && Player(player)->isAdministrator() == false))
                continue; /* either not connected or not VIP/crew */

            SendClientMessage(player, Color::VipChat, notice);
        }

        // Broadcast message on IRC.
        format(notice, sizeof(notice), "%s 255 %s", sender, message);
        IRC->broadcast(VipChatIrcMessage, notice);

        return 1;
    }
};
