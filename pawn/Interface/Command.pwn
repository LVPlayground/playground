// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * There are various possible outcomes of PlayerManager::findPlayerByIdOrPartialName, and we'd want
 * callers to be able to handle all properly. This enum represents the results.
 *
 * @note This should be defined in Entities/Players/PlayerManager.pwn, but can't because of the
 *     compilation order of files in Las Venturas Playground.
 */
enum FindPlayerResult {
    PlayerIdNotConnected,
    PlayerNameTooShort,
    PlayerNameAmbiguous,
    PlayerNameNotFound,
    PlayerFound
};

/**
 * The Command class provides utility functions for implementing commands in the LVP gamemode, by
 * making parameter parsing easier. It also provides the Pawn implementation of Paul Hsieh's
 * SuperFastHash algorithm, which is used by the PreCompiler to hash strings.
 *
 * Determining the parameters in a command may be done using a number of convenience methods, all
 * of which are implemented in this class. As a quick reference, they are as follows:
 *
 * - Command::parameterCount(params[])
 * - Command::stringParameter(params[], paramIndex, buffer, bufferSize);
 * - Command::booleanParameter(params[], paramIndex)
 * - Command::integerParameter(params[], paramIndex)
 * - Command::floatParameter(params[], paramIndex)
 * - Command::playerParameter(params[], paramIndex, commandPlayerId = -1)
 *
 * Please do note that Command::playerParameter will send error messages to the player when the
 * commandPlayerId argument has been set to a valid player Id and no valid player could be derived
 * from the text as entered in the command. This is recommended behavior.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Command {
    /**
     * This method may be used to count the number of parameters that has been passed on to a
     * command. A parameter here is a synonym to a word. As such, the count will be equal to the
     * number of spaces in the string plus one, unless the string is empty.
     * We start counting at the second character, as we already know that the string is at least a
     * single character in length. Also note that subsequent spaces will be treated a single.
     *
     * @param params The parameter string to count parameters in.
     * @return integer The number of parameters in this string.
     */
    public parameterCount(params[]) {
        if (params[0] == 0)
            return 0; // an empty string, so return zero.

        new index = 0, count = 1;
        while(params[index] == ' ')
            ++index; // strip leading spaces.

        if (params[index] == 0)
            return 0; // the string only contains spaces.

        while (params[++index] != 0) {
            if (params[index] != ' ')
                continue;

            ++count;
            while (params[index + 1] == ' ')
                ++index;
        }

        return count;
    }

    /**
     * This utility method may be used to find the starting index in the parameter string for a
     * parameter at a certain index. This will be done regardless of spacing.
     *
     * @param params The parameter string to determine the starting index in.
     * @param paramIndex Index of the parameter to find the starting index of.
     */
    public startingIndexForParameter(params[], paramIndex) {
        if (params[0] == 0 || paramIndex < 0)
            return -1; // an empty string, or an invalid parameter index.

        new index = 0, count = 1;
        while(params[index] == ' ')
            ++index; // strip leading spaces.

        if (params[index] == 0)
            return -1; // the string only contains spaces.

        if (paramIndex == 0)
            return index; // get the index of the first parameter.

        while (params[++index] != 0) {
            if (params[index] != ' ')
                continue;

            ++count;
            while (params[index + 1] == ' ')
                ++index;

            if ((count - 1) == paramIndex)
                return index + 1; // we've found the parameter.
        }

        return -1; // unable to find the parameter.
    }

    /**
     * Reads the parameter in the parameter string at the given index and stores it as a string
     * in the buffer, with a maximum length of the size of the buffer.
     *
     * @param params String containing the parameters passed to the command.
     * @param paramIndex Index of the parameter to retrieve as a string.
     * @param buffer Buffer to store the found string in.
     * @param bufferSize Maximum size (in cells) of the buffer.
     * @return integer Length of the string that has been returned.
     */
    public stringParameter(params[], paramIndex, buffer[], bufferSize) {
        new startingIndex = this->startingIndexForParameter(params, paramIndex);
        if (startingIndex == -1) { // could not locate this parameter.
            buffer[0] = 0;
            return -1;
        }

        new length = 0;
        while (params[startingIndex] != ' ' && params[startingIndex] != 0 && length < bufferSize)
            buffer[length++] = params[startingIndex++];

        buffer[min(length, bufferSize - 1)] = 0;
        return length;
    }

    /**
     * Reads the parameter at the given index and tries to interpret it as a boolean value. Valid
     * values for true are "1", "yes", "on" and "true", case insensitive. Everything else is false.
     *
     * @param params String containing the parameters passed to the command.
     * @param paramIndex Index of the parameter to retrieve as a boolean.
     * @return boolean Whether the value of this parameter was true.
     */
    public bool: booleanParameter(params[], paramIndex) {
        new buffer[12]; // buffer to store the parameter's text in.
        if (this->stringParameter(params, paramIndex, buffer, sizeof(buffer)) == -1)
            return false;

        new length = strlen(buffer);
        if ((length == 1 && buffer[0] == '1') ||
            (length == 2 && strcmp(buffer, "on", true, 2) == 0) ||
            (length == 3 && strcmp(buffer, "yes", true, 3) == 0) ||
            (length == 4 && strcmp(buffer, "true", true, 4) == 0))
            return true;

        return false;
    }

    /**
     * Reads the parameter in the parameter string at a given index as an integer.
     *
     * @param params String containing the parameters passed to the command.
     * @param paramIndex Index of the parameter to retrieve as an integer.
     * @return integer Integral value of the text as given in the command, or -1 if the string
     *     cannot be parsed correctly as an integer.
     */
    public integerParameter(params[], paramIndex) {
        new buffer[12]; // buffer to store the parameter's text in.
        if (this->stringParameter(params, paramIndex, buffer, sizeof(buffer)) == -1)
            return -1;

        if ((buffer[0] < '0' || buffer[0] > '9') && buffer[0] != '-' && buffer[0] != '+')
            return -1; // require the first character to be in [0-9+\-]

        return strval(buffer);
    }

    /**
     * Reads the parameter in the parameter string at a given index as a float.
     *
     * @param params String containing the parameters passed to the command.
     * @param paramIndex Index of the parameter to retrieve as a float.
     * @return Float Floating point value of the text as given in the command, or -1.0 if the string
     *     cannot be parsed correctly as a floating point value.
     */
    public Float: floatParameter(params[], paramIndex) {
        new buffer[8]; // buffer to store the parameter's text in.
        if (this->stringParameter(params, paramIndex, buffer, sizeof(buffer)) == -1)
            return -1.0;

        return floatstr(buffer);
    }

    /**
     * Reads the parameter in the parameter string at a given index as either a string or an
     * integer (which takes precedence) and tries to interpret it as a player Id. The player must
     * be online, or Player::InvalidId will be returned.
     *
     * @param params String containing the parameters passed to the command.
     * @param paramIndex Index of the parameter to retrieve as a player Id.
     * @param commandPlayerId Id of the player who typed this command. When a non-default value has
     *     been set, error messages will be send to the user when no valid player could be found.
     * @return integer Player Id of the player that could be resolved, or Player::InvalidId if the
     *     given text cannot be interpret as an online player.
     */
    public playerParameter(params[], paramIndex, commandPlayerId = INVALID_PLAYER_ID) {
        new buffer[MAX_PLAYER_NAME + 1];
        if (this->stringParameter(params, paramIndex, buffer, sizeof(buffer)) == -1) {
            if (commandPlayerId != INVALID_PLAYER_ID)
                SendClientMessage(commandPlayerId, Color::Error, "Unable to determine the player Id because of an error in the command.");

            return INVALID_PLAYER_ID;
        }

        new playerId = INVALID_PLAYER_ID;
        switch (PlayerManager->findPlayerByIdOrPartialName(buffer, playerId)) {
            case PlayerIdNotConnected: {
                if (commandPlayerId != INVALID_PLAYER_ID)
                    SendClientMessage(commandPlayerId, Color::Error, "The player with the given Id is not connected to the server.");
            }
            case PlayerNameTooShort: {
                if (commandPlayerId != INVALID_PLAYER_ID)
                    SendClientMessage(commandPlayerId, Color::Error, "Searching for a player requires at least three characters of their name.");
            }
            case PlayerNameAmbiguous: {
                if (commandPlayerId == INVALID_PLAYER_ID)
                    return playerId;

                new errorMessage[128], nickname[24], resultPlayerId;
                SendClientMessage(commandPlayerId, Color::Error, "Multiple players were found using your query, please be more specific.");
                format(errorMessage, sizeof(errorMessage), "   "); // three spaces

                for (new resultIndex = 0; resultIndex < 5; ++resultIndex) {
                    resultPlayerId = PlayerManager->foundPlayerIdResult(resultIndex);
                    if (resultPlayerId == INVALID_PLAYER_ID)
                        break;

                    Player(resultPlayerId)->nickname(nickname, sizeof(nickname));
                    format(errorMessage, sizeof(errorMessage), "%s%s(%d)  ", errorMessage, nickname, resultPlayerId);
                }

                SendClientMessage(commandPlayerId, Color::Error, errorMessage);
            }
            case PlayerNameNotFound: {
                if (commandPlayerId == INVALID_PLAYER_ID)
                    return playerId;

                new errorMessage[128];
                format(errorMessage, sizeof(errorMessage), "No players are online with a nickname similar to \"%s\".", buffer);
                SendClientMessage(commandPlayerId, Color::Error, errorMessage);
            }
        }

        return playerId;
    }

    /**
     * Combine two chars (0x00 - 0xFF, unsigned) to a single "short" value, which
     * can hold 0x0000 - 0xFFFF. This is a helper method for the hash() method.
     *
     * @param left The first 8-bit character which should make up the short.
     * @param right The second 8-bit character which should make up the short.
     * @return integer Value of the two variables combined, as if they were a short.
     */
    private inline combineTwoCharactersToSingleValue(left, right) {
        return ((right << 8) + left);
    }

    /**
     * Computing a hash based on a given input string may be done by this method,
     * which will generate a unique value based on the characters. This code is
     * an implementation of Paul Hsieh' SuperFastHash algorithm. Our implementation
     * is different in the fact that we're unable to use unsigned integers.
     *
     * This method can run about 475,000 times per second, which means that it
     * takes about 2.1 microseconds per iteration to complete (on modern hardware).
     *
     * @param string The string to generate a hash from.
     * @return integer A hash approximately unique to the given string.
     */
    @hasher()
    public hash(string[]) {
        new length = strlen(string);
        new offset = 0,
            hash = length;

        new remainder = length & 3;
        if (length == 0)
            return 0;

        length >>= 2;
        for (; length > 0; --length) {
            hash += this -> combineTwoCharactersToSingleValue(string[offset], string[offset + 1]);
            hash  = (hash << 16) ^ ((this -> combineTwoCharactersToSingleValue (string[offset + 2], string[offset + 3]) << 11) ^ hash);
            hash += hash >> 11;
            offset += 4;
        }

        switch (remainder) {
            case 3: {
                hash += this -> combineTwoCharactersToSingleValue(string[offset], string[offset + 1]);
                hash ^= hash << 16;
                hash ^= string[offset + 2] << 18;
                hash += hash >> 11;
            }
            case 2: {
                hash += this -> combineTwoCharactersToSingleValue(string[offset], string[offset + 1]);
                hash ^= hash << 11;
                hash += hash >> 17;
            }
            case 1: {
                hash += string[offset];
                hash ^= hash << 10;
                hash += hash >> 1;
            }
        }

        hash ^= hash << 3;
        hash += hash >> 5;
        hash ^= hash << 4;
        hash += hash >> 17;
        hash ^= hash << 25;
        hash += hash >> 6;
        return hash;
    }
};

// Include the test-suite for the Command class.
#include "Interface/Command.tests.pwn"
