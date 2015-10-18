// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * In order to properly manage the created gangs, names and Ids, the Gang Manager keeps track and
 * controls the individual gangs which have been created on Las Venturas Playground. The Manager is
 * also responsible for sharing a persistent gang's information with the database.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class GangManager {
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
