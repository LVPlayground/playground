// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Each player has got a nickname color, which might change throughout the game session. The
 * Color Manager's duty is to set the right nickname colors and to keep track of previous ones.
 *
 * The default color of a certain player is set upon joining; this color is determined based on
 * their Id, and it may be subject to change. The Color Manager follows this hierarchy to decide 
 * which nickname color should any given player have (least important to most important):
 *
 * - Default player color, based on his Id;
 * - Custom player color (e.g. VIP's nickname color);
 * - Gang color;
 * - Override colors (e.g. the chase in main world);
 * - Minigame color (e.g. to distinguish two different teams).
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ColorManager {
    /**
     * Toggles whether the player's marker on the minimap should be hidden for all other players.
     * This is mostly useful for minigames. Don't forget to reset this!
     *
     * @param playerId The player for whom to hide their marker on the map.
     * @param hidden Whether the player's marker should be hidden.
     */
    public setPlayerMarkerHidden(playerId, bool: hidden) {}
};
