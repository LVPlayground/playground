// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The AccountData class encapsulates all immutable data available for a player's profile. While
 * some of these settings can be overridden by administrators on a per-session basis, persistently
 * changing the values requires Management action on IRC or the website.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class AccountData <playerId (MAX_PLAYERS)> {
    // What is the level this player has on Las Venturas Playground? While temporary rights are
    // able to override this, the immutable value needs to be available.
    new PlayerAccessLevel: m_level;

    // Is this player a Very Important Player on LVP?
    new bool: m_vip;

    // Is this player part of the development team?
    new bool: m_developer;

    /**
     * Returns the set player access level. For most people this will be Player, but Administrators
     * and Management members have their own levels to. For history's sake the level Moderator is
     * included, but it will equal the rights of normal players.
     *
     * @return PlayerAccessLevel The level this player has on Las Venturas Playground.
     */
    public inline PlayerAccessLevel: level() {
        return (m_level);
    }

    /**
     * Determine whether the account belongs to a Very Important Player. This value is immutable
     * from the gamemode, and has to be changed by a Management member on IRC.
     *
     * @return boolean Is this player a Very Important Player?
     */
    public inline bool: isVip() {
        return m_vip;
    }

    /**
     * Determine whether this account belongs to a Developer; someone who participates in the
     * development of Las Venturas Playground. Certain debugging features may be made available.
     *
     * @return boolean Is this player a developer of Las Venturas Playground?
     */
    public inline bool: isDeveloper() {
        return m_developer;
    }

    /**
     * Reset the values in the AccountData and all other Account*Data classes to their initial
     * value. This will be called when a user joins or leaves the server.
     */
    public reset() {
        m_level = PlayerLevel;
        m_vip = false;
        m_developer = false;
    }

    /**
     * Translates an access string to the associated PlayerAccessLevel used in the gamemode.
     *
     * @param level The string containing the access level.
     * @return PlayerAccessLevel The level associated with this string.
     */
    public static PlayerAccessLevel: stringToPlayerLevel(level[]) {
        if (!strcmp(level, "Moderator"))
            return PlayerLevel;  // DEPRECATED, must no longer be used. Deliberately bug it.
        else if (!strcmp(level, "Administrator"))
            return AdministratorLevel;
        else if (!strcmp(level, "Management"))
            return ManagementLevel;
        return PlayerLevel;
    }

    /**
     * Translates a gang role string to the associated GangRole enumeration we use in the gamemode.
     *
     * @param role The string containing the gang role.
     * @return GangRole The GangRole enumeration value associated with the text.
     */
    public static GangRole: stringToGangRole(role[]) {
        if (!strcmp(role, "Leader"))
            return GangLeaderRole;
        else if (!strcmp(role, "Manager"))
            return GangManagerRole;

        return GangMemberRole;
    }

    /**
     * When data is available from the database, this method will be invoked giving us the chance
     * to apply it to the data members in this class.
     *
     * @param resultId Id of the database result containing the values.
     */
    public onDataAvailable(resultId) {
        m_vip = !!DatabaseResult(resultId)->readInteger("is_vip");
        Player(playerId)->setIsVip(m_vip);

        m_developer = !!DatabaseResult(resultId)->readInteger("is_developer");
        Player(playerId)->setIsDeveloper(m_developer);

        // The player's level is stored as an enumeration in the database.
        new level[16];
        DatabaseResult(resultId)->readString("level", level);
        m_level = AccountData->stringToPlayerLevel(level);

        // Synchronize this data with other classes in the code, to make sure they're up to date.
        Player(playerId)->setLevel(m_level);

        new remainingJailTime = DatabaseResult(resultId)->readInteger("jailed");
        if (remainingJailTime > 0) {
            if (Player(playerId)->isInClassSelection() ||
                GetPlayerState(playerId) == PLAYER_STATE_NONE ||
                GetPlayerState(playerId) == PLAYER_STATE_WASTED) {
                JailController->markPlayerAsBeingInJail(playerId, remainingJailTime);
            } else
                JailController->jailPlayer(playerId, remainingJailTime);
        }

        // Mutable information will be stored by the respective sub-systems, which will be handled
        // by a separate (private) method in this class.
        this->applyMutableData(resultId);
    }

    /**
     * After the immutable player information has been stored and applied, the mutable information
     * will be stored with the respective handlers. This is done to ensure that we don't have to
     * duplicate storage of the information.
     *
     * @param resultId Id of the database result containing the values.
     */
    private applyMutableData(resultId) {
        // mutable: custom_color
        new customColor = DatabaseResult(resultId)->readInteger("custom_color");
        if (customColor != 0 && Player(playerId)->isVip())
            ColorManager->setPlayerCustomColor(playerId, customColor);

        // mutable: money_bank_type
        new bankAccountTypeBuffer[24],
            BankAccountType: bankAccountType = NormalBankAccount;

        DatabaseResult(resultId)->readString("money_bank_type", bankAccountTypeBuffer);
        if (strcmp("Premier", bankAccountTypeBuffer, false, 7)== 0)
            bankAccountType = PremierBankAccount;

        BankAccount(playerId)->setBankAccountType(bankAccountType);

        // mutable: money_bank
        BankAccount(playerId)->setBalance(DatabaseResult(resultId)->readInteger("money_bank"));

        // mutable: money_bounty
        HitmanTracker(playerId)->setBounty(DatabaseResult(resultId)->readInteger("money_bounty"));

        // Apply the player's settings to the gamemode.
        PlayerSettings(playerId)->restore(DatabaseResult(resultId)->readInteger("settings"));

        LegacyAccountBridge->Apply(playerId, resultId);
    }

    /**
     * Changes the player level to a different value. This should only be used when loading the
     * account's data or when the player logs in as an undercover administrator.
     *
     * @param level The level this player should be logged in to.
     */
    public applyPlayerLevel(PlayerAccessLevel: level) {
        m_level = level;

        Player(playerId)->setLevel(m_level);
    }

    /**
     * Saving an account's data requires us to manually build the query because there are too many
     * parameters to deal with given QueryBuilder's limitations. To not break the 80/20 rule, we'll
     * be doing a lot of this work manually.
     *
     * After the query has been created, we'll ask the MySQL plugin to execute it, and the player's
     * account should be up to date again. We don't deal with statistics in here.
     */
    public save() {
        new query[2048];

        /// @todo Once all systems moved over to more sane places move it here.
        LegacyAccountBridge->CreateQuery(playerId, query, sizeof(query));
        Database->query(query, "", 0);
    }
};
