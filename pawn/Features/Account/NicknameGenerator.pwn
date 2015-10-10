// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

#define NicknameGeneratorNameSets 23

/**
 * An array of the first names which will be used by the nickname generator. Considering the maximum
 * length of a nickname is 24 characters, we'll limit this to ten characters per first name. This
 * array is defined outside of the NicknameGenerator class as we don't need this to show up in docs.
 */
new g_nicknameGeneratorFirstNames[NicknameGeneratorNameSets][11] = {
    "Carl", // CJ
    "Sean", // Sweet
    "Kendl", // Yo Yo
    "Melvin", // Big Smoke
    "Big", // Big Smoke
    "Lance", // Ryder
    "Ryder", // Ryder
    "Jeffrey", // OG Loc
    "OG", // OG Loc
    "Barry", // Big Bear
    "Big", // Big Bear
    "Madd", // Madd Dogg
    "Cesar", // Cesar Vialpando
    "Frank", // Frank Tenpenny
    "Eddie", // Eddie Pulaski
    "T_Bone", // T-Bone Mendez
    "Mike", // Mike Toreno
    "Su_Xi", // Su Xi Mu
    "Ran_Fa", // Ran Fa Li
    "Kent", // Kent Paul
    "Ken", // Ken Rosenberg
    "Salvatore", // Salvatore Leone
    "Maria" // Maria Latore
};

/**
 * The last names which add up to the earlier defined first names. Again, these are limited to ten
 * characters in length, considering that will help us to nicely stay within the limits.
 */
new g_nicknameGeneratorLastNames[NicknameGeneratorNameSets][11] = {
    "Johnson", // CJ
    "Johnson", // Sweet
    "", // Yo Yo
    "Harris", // Big Smoke
    "Smoke", // Big Smoke
    "Wilson", // Ryder
    "", // Ryder
    "Cross", // OG Loc
    "Loc", // OG Loc,
    "Thorne", // Big Bear
    "Bear", // Big Bear
    "Dogg", // Mad Dogg
    "Vialpando", // Cesar Vialpando
    "Tenpenny", // Frank Tenpenny
    "Pulaski", // Eddie Pulaski
    "Mendez", // T-Bone Mendez
    "Toreno", // Mike Toreno
    "Mu", // Su Xi Mu
    "Li", // Ran Fa Li
    "Paul", // Kent Paul
    "Rosenberg", // Ken Rosenberg
    "Leone", // Salvatore Leone
    "Latore" // Maria Latore
};

/**
 * When a player chooses to play as a guest, which usually will be the case because they're using
 * a nickname that has been registered by another player, we'll assign a random nickname to them.
 * Previously this would be something like "LVP_123", but it's obviously much nicer to generate a
 * nickname using a first and last name, into something readible.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class NicknameGenerator {
    // How much cells of entropy should be used for random names? 
    const RandomSeedEntropy = 8;

    /**
     * Generate a nickname for the given player. We'll use their nickname and IP address as the seed
     * so we can ensure that they'll have the same nickname during future playing sessions.
     *
     * @param playerId Id of the player to generate a pseudo-random nickname for.
     * @param nickname Array to store the generated nickname in.
     * @param nicknameLength Maximum length of this buffer.
     * @return integer Length of the generated nickname.
     */
    public generateForPlayerId(playerId, nickname[], nicknameLength) {
        new seedBuffer[16 + MAX_PLAYER_NAME + 1]; // maximum length of IP + nickname, plus one
        new currentNickname[MAX_PLAYER_NAME];

        GetPlayerName(playerId, currentNickname, sizeof(currentNickname));
        format(seedBuffer, sizeof(seedBuffer), "%s", Player(playerId)->ipAddressString());
        strcat(seedBuffer, currentNickname, sizeof(seedBuffer));

        return this->generate(seedBuffer, nickname, nicknameLength);
    }

    /**
     * Create a random seed which will be used for generating the nickname, ensuring that we'll end
     * up with a new nickname upon every invocation. This is good when you need temporary names for,
     * for example, a minigame.
     *
     * @param nickname Array to store the generated nickname in.
     * @param nicknameLength Maximum length of this buffer.
     * @return integer Length of the generated nickname.
     */
    public generateRandom(nickname[], nicknameLength) {
        new seedBuffer[RandomSeedEntropy + 1];
        for (new index = 0; index < RandomSeedEntropy; ++index)
            seedBuffer[index] = random(0, 0xFF);

        return this->generate(seedBuffer, nickname, nicknameLength);
    }

    /**
     * The ugly guts for the nickname generator. Based on the given seed, it will select a random
     * first and last name, put them together and return them through the nickname parameter.
     *
     * Despite Las Venturas Playground being a deathmatch server, the names are probably much more
     * aimed towards role play, as it's hard to generate good DM names. They're the first and last
     * names of characters which appear in Grand Theft Auto: San Andreas.
     *
     * @param seed Seed to use when generating the nickname.
     * @param nickname Array to store the generated nickname in.
     * @param nicknameLength Maximum length of this buffer.
     * @return integer Length of the generated nickname.
     */
    public generate(seed[], nickname[], nicknameLength) {
        new hash = adler32(seed),
            firstNameIndex = hash % NicknameGeneratorNameSets,
            lastNameIndex = (hash * hash) % NicknameGeneratorNameSets;

        format(nickname, nicknameLength, "%s", g_nicknameGeneratorFirstNames[firstNameIndex]);
        if (g_nicknameGeneratorLastNames[lastNameIndex][0] != 0) {
            new additionalLength = strlen(g_nicknameGeneratorLastNames[lastNameIndex]) + 1;
            if ((strlen(nickname) + additionalLength) < nicknameLength) {
                strcat(nickname, "_", nicknameLength);
                strcat(nickname, g_nicknameGeneratorLastNames[lastNameIndex], nicknameLength);
            }
        }

        return strlen(nickname);
    }

    /**
     * The random nickname generator is based on the first and last names of characters which appear
     * in Grand Theft Auto, which are stored in order. Therefore, by providing an index, we can get
     * the full name of any of the characters we support.
     *
     * @param index Index of the nickname to retrieve the name for.
     * @param nickname Array to store the generated nickname in.
     * @param nicknameLength Maximum length of this buffer.
     * @return integer Length of the generated nickname.
     */
    public getNicknameByIndex(index, nickname[], nicknameLength) {
        if (index < 0 || index >= NicknameGeneratorNameSets)
            return 0;

        format(nickname, nicknameLength, "%s_%s", g_nicknameGeneratorFirstNames[index], g_nicknameGeneratorLastNames[index]);
        return strlen(nickname);
    }
};
