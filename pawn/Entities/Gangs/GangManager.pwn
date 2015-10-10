// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Callback which will be invoked by the database plugin once information about a persistent gang
 * has been read from the database. The call will be forwarded to the GangManager.
 *
 * @param resultId Id of the result set which contains all information.
 * @param playerId Id of the player who will be joining this gang.
 */
public OnGangInformationAvailable(resultId, playerId);
public OnGangInformationAvailable(resultId, playerId) {
    GangManager->onGangInformationAvailable(resultId, playerId);
    DatabaseResult(resultId)->free();
}

/**
 * In order to properly manage the created gangs, names and Ids, the Gang Manager keeps track and
 * controls the individual gangs which have been created on Las Venturas Playground. The Manager is
 * also responsible for sharing a persistent gang's information with the database.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class GangManager {
    // The statement used for retrieving a bank's information from the database.
    new m_loadGangStatement;

    /**
     * Prepares the prepared statements which will be used by the gang manager to read and write
     * a gang's information from and to the database.
     */
    public __construct() {
        m_loadGangStatement = Database->prepare(
            "SELECT gang_id, gang_name, gang_color FROM gangs WHERE gang_id = ?", "i");
    }

    /**
     * The gang manager will find the first available gang Id and will use it to create the new
     * gang. When no Ids are available anymore, an invalid gang Id will be returned.
     *
     * @param playerId Id of the player who created this gang, they will lead it.
     * @param name Name of the gang, used as an alternative identifier.
     * @return integer Id of the gang that has been created, or Gang::InvalidId.
     */
    public create(playerId, name[]) {
        new gangId = this->firstAvailableGangId();
        if (gangId != Gang::InvalidId)
            Gang(gangId)->onCreateTemporaryGang(playerId, name);

        return gangId;
    }

    /**
     * When a registered player joins the server who happens to be member of a gang, we need to make
     * sure that the gang's information is available on Las Venturas Playground. If the gang already
     * exists, make the player join it, otherwise load information from the database.
     *
     * @param playerId Id of the player who is a member of this gang.
     * @param persistentGangId Id of the gang which they are a member of.
     * @param role Role the player has in said gang.
     */
    public onGangMemberJoined(playerId, persistentGangId, GangRole: role) {
        new gangId = this->findGangByPersistentId(persistentGangId);
        if (gangId != Gang::InvalidId) {
            Gang(gangId)->onPlayerJoin(playerId, role);
            return;
        }

        GangPlayer(playerId)->setGangRole(role);

        Database->execute(m_loadGangStatement, "OnGangInformationAvailable", playerId, persistentGangId);
    }

    /**
     * When a gang's information has been read from the database, we need to fetch the column values
     * from the result row and properly set up the gang. The player Id is passed because this player
     * needs to be moved to this very gang.
     *
     * @param resultId Id of the result set which contains the information.
     * @param playerId Id of the player who has to join this gang.
     */
    public onGangInformationAvailable(resultId, playerId) {
        new persistentGangId = DatabaseResult(resultId)->readInteger("gang_id"),
            color = DatabaseResult(resultId)->readInteger("gang_color"),
            name[Gang::MaximumNameLength + 1];

        DatabaseResult(resultId)->readString("gang_name", name);

        // Now we need to create the gang and move the player to it. There is a race condition which
        // could occur here, namely that several players joining at once request information about
        // the same gang at the same time, which issues this code path twice. We therefore need to
        // check whether this gang already exists first.
        new gangId = this->findGangByPersistentId(persistentGangId);
        if (gangId == Gang::InvalidId) {
            gangId = this->firstAvailableGangId();
            if (gangId == Gang::InvalidId) {
                printf("[GangManager] Unable to load information for a gang: no more slots available.");
                return;
            }

            Gang(gangId)->onCreatePersistentGang(persistentGangId, name, color);
        }

        // Make the player for whom we executed the information request join the gang.
        Gang(gangId)->onPlayerJoin(playerId, GangPlayer(playerId)->gangRole());
    }

    /**
     * Iterate through all created gangs to find one with the name as specified, and return the Id.
     *
     * @param name Name of the gang to find the Id for.
     * @return integer Id of the gang when found, otherwise Gang::InvalidId.
     */
    public findGangByName(name[]) {
        for (new gangId = 0; gangId < MAX_GANGS; ++gangId) {
            if (Gang(gangId)->isAvailable() == true || strcmp(Gang(gangId)->nameString(), name, true))
                continue;

            return gangId;
        }

        return Gang::InvalidId;
    }

    /**
     * Finds any allocated gang based on its persistent gang Id. This iterates over all the gangs
     * and therefore has a complexity of O(n), whereas n equals MAX_GANGS.
     *
     * @param persistentGangId Id of the persistent gang to search the gangs for.
     * @return integer Id of the gang which handles this, or Gang::InvalidId.
     */
    public findGangByPersistentId(persistentGangId) {
        for (new gangId = 0; gangId < MAX_GANGS; ++gangId) {
            if (Gang(gangId)->isAvailable() == true || Gang(gangId)->persistentGangId() != persistentGangId)
                continue;

            return gangId;
        }

        return Gang::InvalidId;
    }

    /**
     * Finds the first available Id to create a gang in. If there aren't any available slots available
     * right now, the Gang::InvalidId constant will be returned.
     *
     * @return integer Id of the first gang which is still available.
     */
    private firstAvailableGangId() {
        for (new gangId = 0; gangId < MAX_GANGS; ++gangId) {
            if (Gang(gangId)->isAvailable() == true)
                return gangId;
        }

        return Gang::InvalidId;
    }
};
