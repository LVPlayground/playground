// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// TODO(Russell): The economy should be driven from JavaScript, not Pawn. This will be moved over
// before too long, consider this as an intermediary step.

enum EconomyValueType {
    AirportCustomsTax,
    AirportCustomsTaxMax,
    AirportCustomsTaxMin,
    AirportCustomsTaxOwnersShare,
    BombExplosionExtreme,
    BombExplosionLarge,
    BombExplosionMedium,
    BombTypeCountdown,
    BombTypeCountdownOwnersShare,
    BombTypeDetonator,
    BombTypeDetonatorOwnersShare,
    BombTypeEngine,
    BombTypeEngineOwnersShare
};

new customsTax = 1500;

GetEconomyValue(EconomyValueType: type, inputValue = 0) {
    switch (type) {
        case AirportCustomsTax:                 return customsTax;
        case AirportCustomsTaxMax:              return 5000;
        case AirportCustomsTaxMin:              return 500;
        case AirportCustomsTaxOwnersShare:      return customsTax / 4;
        case BombExplosionExtreme:              return 400000;
        case BombExplosionLarge:                return 70000;
        case BombExplosionMedium:               return 25000;
        case BombTypeCountdown:                 return 2000000;
        case BombTypeCountdownOwnersShare:      return 2000000 / 40;
        case BombTypeDetonator:                 return 4000000;
        case BombTypeDetonatorOwnersShare:      return 4000000 / 40;
        case BombTypeEngine:                    return 1000000;
        case BombTypeEngineOwnersShare:         return 1000000 / 40;
    }

    return 0;
    #pragma unused inputValue
}

SetEconomyValue(EconomyValueType: type, value) {
    switch (type) {
        case AirportCustomsTax:
            customsTax = value;
        default:
            printf("WARNING: Tried to update immutable economy value %d to %d.", _: type, value);
    }
}

GiveRegulatedMoney(playerId, EconomyValueType: type) {
    new const amount = GetEconomyValue(type);
    if (amount)
        GivePlayerMoney(playerId, amount);
    else
        printf("WARNING: Unable to grant money to %d: invalid amount (type %d).", playerId, _: type);
}

TakeRegulatedMoney(playerId, EconomyValueType: type) {
    new const amount = GetEconomyValue(type);
    if (amount)
        GivePlayerMoney(playerId, -amount);
    else
        printf("WARNING: Unable to take money from %d: invalid amount (type %d).", playerId, _: type);
}
