// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to give consistent replies to various actions, rather than manually sending messages to
 * each player manually, features should use the Responses class to unify handling. This class has
 * various methods which unify replies the gamemode can give to players.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Responses {
    // A class-global buffer in which we can format messages.
    new m_formatBuffer[256];

    /**
     * Responses to a player when they signed up for a minigame. It gives them the name of the
     * minigame, together with the information that they can type "/leave" to leave the minigame
     * again. It will be consistently colored with other minigame information.
     *
     * @param playerId Id of the player to whom the response should be send.
     * @param type The type of minigame which they've signed up for.
     * @param name Name of the minigame which the player signed up for.
     * @param waitPeriod How many seconds before the minigame will start (optional).
     */
    public respondMinigameSignedUp(playerId, MinigameType: type, name[], waitPeriod = 0) {
        new colorBuffer[2][Color::TextualColorLength], typeString[12];
        Color->toString(Color::MinigameAnnouncement, colorBuffer[0], sizeof(colorBuffer[]));
        Color->toString(Color::MinigameAnnouncementHighlight, colorBuffer[1], sizeof(colorBuffer[]));

        MinigameTypeToString(type, typeString, sizeof(typeString));

        format(m_formatBuffer, sizeof(m_formatBuffer), "You signed up for the {%s}%s %s{%s}! Type {%s}/leave{%s} if you changed your mind.",
            colorBuffer[1], name, typeString, colorBuffer[0], colorBuffer[1], colorBuffer[0]);

        SendClientMessage(playerId, Color::MinigameAnnouncement, m_formatBuffer);

        if (waitPeriod == 0)
            return; // they weren't the first to sign up.

        format(m_formatBuffer, sizeof(m_formatBuffer), "Please allow up to {%s}%d seconds{%s} for the %s to start.",
            colorBuffer[1], waitPeriod, colorBuffer[0], typeString);

        SendClientMessage(playerId, Color::MinigameAnnouncement, m_formatBuffer);
    }

    /**
     * Responses to the player when they leave a minigame. The reason why they've left will be
     * included in the sentence itself, but needs to be one of the constants defined in the
     * MinigameExitReason enumeration.
     *
     * @param playerId Id of the player who has left a minigame.
     * @param type Type of minigame which they have left.
     * @param name Name of the minigame which they were participating in.
     * @param reason The reason explaining why the player has left the minigame.
     */
    public respondMinigameDropout(playerId, MinigameType: type, name[], MinigameDropoutReason: reason) {
        new colorBuffer[2][Color::TextualColorLength], typeString[12], reasonText[64];
        Color->toString(Color::MinigameAnnouncement, colorBuffer[0], sizeof(colorBuffer[]));
        Color->toString(Color::MinigameAnnouncementHighlight, colorBuffer[1], sizeof(colorBuffer[]));

        MinigameTypeToString(type, typeString, sizeof(typeString));
        switch (reason) {
            case LeaveCommandDropoutReason:             strcat(reasonText, " because you entered the /leave command.");
            case RemovedByAdministratorDropoutReason:   strcat(reasonText, " by the command of an administrator.");
            default:                                    strcat(reasonText, ".");
        }

        format(m_formatBuffer, sizeof(m_formatBuffer), "You dropped out of the {%s}%s %s{%s}%s",
            colorBuffer[1], name, typeString, colorBuffer[0], reasonText);

        SendClientMessage(playerId, Color::MinigameAnnouncement, m_formatBuffer);
    }
};
