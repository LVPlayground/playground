// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Different types of fights need different types of approaches.
enum FightClubMatchType {
    // Quick matches are 1-round fights with default weapons.
    QuickMatch,

    // Full matches offer setting up weaponsets and the amount of rounds.
    FullMatch,

    // Gang matches are supposed to support full gang vs gang matches around the gangbase.
    GangMatch
}

/**
 * Before a FightClub match is actually started, a lot has to be done. Setting up match settings,
 * sending out invitations, setting up the match environment, and last but not least: setting up the
 * fighting players.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class FightClubManager {
    // Define the price to setup a quick FightClub match.
    public const QuickMatchCosts = 250;

    // Define the price to setup a full FightClub match.
    public const FullMatchCosts = 2500;

    // @TODO: When supporting gang banks, introduce costs for gang matches.

    // An invalid FightClub match Id should be equal to -1.
    public const InvalidMatchId = -1;

    // Is this matchId free?
    new bool: m_matchBooked[MAX_FC_MATCHES];

    // The type of the match.
    new FightClubMatchType: m_matchType[MAX_FC_MATCHES];

    // The amount of rounds the match will last.
    new m_matchRounds[MAX_FC_MATCHES];

    // Each weaponslot can contain a weaponId to be used in the match.
    new m_matchWeapons[MAX_FC_MATCHES][3];

    /**
     * Setting up a match will save the necessary variables and return a free matchId. If all matches
     * are currently booked, InvalidMatchId will be returned.
     *
     * @param matchType Type of the match.
     * @param rounds Amount of rounds the fight should last, default is one.
     * @param firstWeapon Id of the first weapon, default is deagle (Id:24).
     * @param secondWeapon Id of the second weapon, default is sawn-off shotgun (Id:26).
     * @param thirdWeapon Id of the third weapon, default is UZI (Id:28).
     *
     * @return integer Id of the corresponding match, or InvalidMatchId.
     */
    public setUpMatch(FightClubMatchType: matchType, rounds = 1, firstWeapon = 24, secondWeapon = 26, thirdWeapon = 28) {
        for (new matchId = 0; matchId < MAX_FC_MATCHES; matchId++) {
            if (m_matchBooked[matchId] == false)
                continue;

            m_matchBooked[matchId] = true;
            m_matchType[matchId] = matchType;
            m_matchRounds[matchId] = rounds;

            m_matchWeapons[matchId][0] = firstWeapon;
            m_matchWeapons[matchId][1] = secondWeapon;
            m_matchWeapons[matchId][2] = thirdWeapon;

            return matchId;
        }

        return FightClubManager::InvalidMatchId;
    }
};
