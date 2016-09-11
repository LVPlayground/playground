// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

native EchoMessage(message[]);
native SetEchoDestination(ip[], port);

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
            case DeveloperIrcMessage:
                m_messageBuffer = "[dev] ";
            case BuyPropertyIrcMessage:
                m_messageBuffer = "[buy] ";
            case GangChatIrcMessage:
                m_messageBuffer = "[gang] ";
            case DeathIrcMessage:
                m_messageBuffer = "[death] ";
            case KillIrcMessage:
                m_messageBuffer = "[kill] ";
            case JoinIrcMessage:
                m_messageBuffer = "[join] ";
            case LeaveIrcMessage:
                m_messageBuffer = "[leave] ";
            case GuestLoginIrcMessage:
                m_messageBuffer = "[guestlogin] ";
            case LoginIrcMessage:
                m_messageBuffer = "[login] ";
            case SellPropertyIrcMessage:
                m_messageBuffer = "[sold] ";
            case SellAllPropertiesIrcMessage:
                m_messageBuffer = "[soldall] ";
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

        SetEchoDestination(Configuration::EchoHostname, Configuration::EchoPort);
        EchoMessage(m_messageBuffer);
    }
};
