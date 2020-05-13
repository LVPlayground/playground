// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Executes the Pawn functions that drive the gang zone system. Operations are slightly higher level
// than the individual functions, because the details are insignificant to our JavaScript logic.
export class ZoneNatives {
    createZone(area, color) {
        const zoneId =
            pawnInvoke('GangZoneCreate', 'ffff', area.minX, area.minY, area.maxX, area.maxY);

        pawnInvoke('GangZoneShowForAll', 'ii', zoneId, color.toNumberRGBA());
        return zoneId;
    }

    showZoneForPlayer(player, zoneId, color) {
        pawnInvoke('GangZoneShowForPlayer', 'iii', player.id, zoneId, color.toNumberRGBA());
    }

    deleteZone(zoneId) {
        pawnInvoke('GangZoneDestroy', 'i', zoneId);
    }
}
