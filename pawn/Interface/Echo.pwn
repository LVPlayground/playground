// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// When calling EchoMessage with a new tag, be sure to add it to //data/irc_messages.json. The
// |format| required in EchoMessage follows the following syntax:
//
//   d  - Integer
//   f  - Floating point (decimal) number
//   s  - Single word
//   z  - Multiple words
//
// This is orthogonal to the formatting syntax in //data/irc_messages.json, which follows the
// normal JavaScript syntax. Sorry :).

// Provided by the PlaygroundJS plugin.
native EchoMessage(tag[], format[], message[]);

// Provided by the Echo plugin.
native SendEchoMessage(destinationIp[], destinationPort, message[]);

// TODO: Deprecate the following entirely.
AddEcho(message[]) {
    if (strlen(message) > 480)
        return 0;

    SendEchoMessage(Configuration::EchoHostname, Configuration::EchoPort, message);
    return 1;
}

/**
 * What is the kind of IRC message that should be distributed? This is used to avoid having hard-
 * coded prefixes all around the source-code, which increases our flexibility.
 */
enum IrcMessageType {
    GangChatIrcMessage, // [playerId] [playerName] ![message]
    PrivateMessageIrcMessage, // [playerName] [playerId] [receiverName] [receiverId] [message]
    IrcPrivateMessageIrcMessage, // [playerId] [playerName] [receiverName] [message]
    VipChatIrcMessage, // [playerName] [playerId] [message]
    PhoneIrcMessage, // [playerName] [playerId] [calleeName] [calleeId] [message]
    DeathIrcMessage, // [playerName]
    KillIrcMessage, // [playerName] [playerId] [killerName] [killerId] [reason]
    NotConnectedIrcMessage, // [playerId]
    AddCommandIrcMessage, // [trigger] [paramTypes] [userRight] [params]
    PlayerStatusIrcMessage // [playerId] [playerName] [message]
};

/**
 * Las Venturas Playground has a significant footprint on IRC, which is short for Internet Relay
 * Chat. Through the Nuwani bots, people have the ability to communicate with the gamemode in real
 * time. This class manages communication to and from IRC. 
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class IRC {
    // A buffer which we use to format the IRC messages to.
    new m_messageBuffer[512];

    /**
     * Broadcast a message to IRC by specifying the message type and text associated to it. We'll
     * format the result in the class-scoped message buffer before echo'ing it out.
     *
     * @param type The type of message that should be distributed.
     * @param message Text of the message to send.
     */
    public broadcast(IrcMessageType: type, message[]) {
        switch (type) {
            case GangChatIrcMessage:
                m_messageBuffer = "[gang] ";
            case DeathIrcMessage:
                m_messageBuffer = "[death] ";
            case KillIrcMessage:
                m_messageBuffer = "[kill] ";
            case PrivateMessageIrcMessage:
                m_messageBuffer = "[pm] ";
            case IrcPrivateMessageIrcMessage:
                m_messageBuffer = "[ircpm] ";
            case VipChatIrcMessage:
                m_messageBuffer = "[vipchat] ";
            case PhoneIrcMessage:
                m_messageBuffer = "[phone] ";
            case NotConnectedIrcMessage:
                m_messageBuffer = "[notconnected] ";
            case AddCommandIrcMessage:
                m_messageBuffer = "[addcommand] ";
            case PlayerStatusIrcMessage:
                m_messageBuffer = "[me] ";
            default:
                m_messageBuffer = "[unknown] ";
        }

        strcat(m_messageBuffer, message, sizeof(m_messageBuffer));
        if (strlen(m_messageBuffer) >= 280) {
            // There is a buffer overflow in the plugin, so we can only show 480 characters..
            m_messageBuffer[277] = '.';
            m_messageBuffer[278] = '.';
            m_messageBuffer[279] = 0;
        }

        SendEchoMessage(Configuration::EchoHostname, Configuration::EchoPort, m_messageBuffer);
    }
};
