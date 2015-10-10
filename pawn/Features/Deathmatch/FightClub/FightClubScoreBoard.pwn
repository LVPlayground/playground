// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Describe the "why" of this class here.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class FightClubScoreBoard {
    /**
     * bla
     */
    @list(OnGameModeInit)
    public initializeScoreBoard() {
        new test = CreateObject(19479, 2107.049804, 2191.735107, 12.184035, 0.000000, 0.000000, 0.000000); 
        SetObjectMaterialText(test, "FightClub Score Board", 0, 120, "Arial", 30, 1, -1, 0, 1);
    }
};
