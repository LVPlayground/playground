// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The default weapon range (from weapon.dat), imported from Oscar Broman's server-sided damage.
new const Float: kWeaponRange[] = {
	0.0, // 0 - Fist
	0.0, // 1 - Brass knuckles
	0.0, // 2 - Golf club
	0.0, // 3 - Nitestick
	0.0, // 4 - Knife
	0.0, // 5 - Bat
	0.0, // 6 - Shovel
	0.0, // 7 - Pool cue
	0.0, // 8 - Katana
	0.0, // 9 - Chainsaw
	0.0, // 10 - Dildo
	0.0, // 11 - Dildo 2
	0.0, // 12 - Vibrator
	0.0, // 13 - Vibrator 2
	0.0, // 14 - Flowers
	0.0, // 15 - Cane
	0.0, // 16 - Grenade
	0.0, // 17 - Teargas
	0.0, // 18 - Molotov
	90.0, // 19 - Vehicle M4 (custom)
	75.0, // 20 - Vehicle minigun (custom)
	0.0, // 21
	35.0, // 22 - Colt 45
	35.0, // 23 - Silenced
	35.0, // 24 - Deagle
	40.0, // 25 - Shotgun
	35.0, // 26 - Sawed-off
	40.0, // 27 - Spas
	35.0, // 28 - UZI
	45.0, // 29 - MP5
	70.0, // 30 - AK47
	90.0, // 31 - M4
	35.0, // 32 - Tec9
	100.0, // 33 - Cuntgun
	320.0, // 34 - Sniper
	0.0, // 35 - Rocket launcher
	0.0, // 36 - Heatseeker
	0.0, // 37 - Flamethrower
	75.0  // 38 - Minigun
};

// Returns whether the given |weaponId| is a weapon that fires bullets.
bool: IsBulletWeapon(weaponId) {
	return (WEAPON_COLT45 <= weaponId <= WEAPON_SNIPER) || weaponId == WEAPON_MINIGUN;
}

// Returns whether the last shot fired by the |playerId| was out of range. All this information is
// reported by the |playerId|, so there is no need to compensate for their ping here.
bool: IsLastShotOutOfRange(playerId, weaponId, hitType) {
    if (hitType != BULLET_HIT_TYPE_PLAYER)
        return false;  // only process this for hits on players

    if (!IsBulletWeapon(weaponId))
        return false;  // only process this for weapons which have bullets

    new Float: origin[3];
    new Float: target[3];

    GetPlayerLastShotVectors(
        playerId, origin[0], origin[1], origin[2], target[0], target[1], target[2]);

    new const Float: distance = VectorSize(
        origin[0] - target[0], origin[1] - target[1], origin[2] - target[2]);

    return kWeaponRange[weaponId] < distance;
}
