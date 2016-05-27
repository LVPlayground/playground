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
    AirportFlight,
    BombExplosionExtreme,
    BombExplosionLarge,
    BombExplosionMedium,
    BombTypeCountdown,
    BombTypeCountdownOwnersShare,
    BombTypeDetonator,
    BombTypeDetonatorOwnersShare,
    BombTypeEngine,
    BombTypeEngineOwnersShare,
    CaptureBriefcaseParticipation,
    CaptureBriefcaseVictory,
    ChaseEscaped,
    ChaseWinner,
    DerbyParticipation,
    DerbyVictory,
    FightClubParticipation,
    FightClubVictory,
    GiftHuntLargePrize,
    GiftHuntMediumPrize,
    GiftHuntSmallPrize,
    HayParticipation,
    HideAndSeekSignUpCost,
    HideAndSeekPrize,
    IslandTeamDeathMatchPrize,
    KilltimeVictory,
    LyseSignUpCost,
    NitroTwoShot,
    NitroFiveShot,
    NitroTenShot,
    NitroInfinite,
    RivershellParticipation,
    RobberyParticipation,
    RobberyVictory,
    RunWeaponsParticipation,
    ShowMessageCommand,
    SlapCommand,
    SpawnMoney,
    TowCommand,
    TuneCommand,
    VipColourChange,
    WalkiesWeaponParticipation,
    WalkiesWeaponVictory,
    WaterFightParticipation
};

new customsTax = 1500;

GetEconomyValue(EconomyValueType: type, inputValue = 0) {
    switch (type) {
        case AirportCustomsTax:                 return customsTax;
        case AirportCustomsTaxMax:              return 5000;
        case AirportCustomsTaxMin:              return 500;
        case AirportCustomsTaxOwnersShare:      return customsTax / 4;
        case AirportFlight:                     return 250000;
        case BombExplosionExtreme:              return 400000;
        case BombExplosionLarge:                return 70000;
        case BombExplosionMedium:               return 25000;
        case BombTypeCountdown:                 return 2000000;
        case BombTypeCountdownOwnersShare:      return 50000;
        case BombTypeDetonator:                 return 4000000;
        case BombTypeDetonatorOwnersShare:      return 100000;
        case BombTypeEngine:                    return 1000000;
        case BombTypeEngineOwnersShare:         return 25000;
        case CaptureBriefcaseParticipation:     return 100;
        case CaptureBriefcaseVictory:           return 2000000;
        case ChaseEscaped:                      return 1000000;
        case ChaseWinner:                       return 2500000;
        case DerbyParticipation:                return 250;
        case DerbyVictory:                      return 10000;
        case FightClubParticipation:            return 2500;
        case FightClubVictory:                  return 5000;
        case GiftHuntLargePrize:                return 3000000;
        case GiftHuntMediumPrize:               return 1000000;
        case GiftHuntSmallPrize:                return 500000;
        case HayParticipation:                  return 250;
        case HideAndSeekSignUpCost:             return 250;
        case HideAndSeekPrize:                  return 500000;
        case IslandTeamDeathMatchPrize:         return 10000;
        case KilltimeVictory:                   return 2500000;
        case LyseSignUpCost:                    return 250;
        case NitroTwoShot:                      return 2000;
        case NitroFiveShot:                     return 5000;
        case NitroTenShot:                      return 10000;
        case NitroInfinite:                     return 250000;
        case RivershellParticipation:           return 250;
        case RobberyParticipation:              return 250;
        case RobberyVictory:                    return 5000 * inputValue /* participant count */;
        case RunWeaponsParticipation:           return 250;
        case ShowMessageCommand:                return 200000;
        case SlapCommand:                       return 5000;
        case SpawnMoney:                        return 175000;
        case TowCommand:                        return 45000;
        case TuneCommand:                       return 10000;
        case VipColourChange:                   return 10000000;
        case WalkiesWeaponParticipation:        return 250;
        case WalkiesWeaponVictory:              return 5000 * inputValue /* participant count */;
        case WaterFightParticipation:           return 2500;
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

GiveRegulatedMoney(playerId, EconomyValueType: type, inputValue = 0) {
    new const amount = GetEconomyValue(type, inputValue);
    if (amount)
        GivePlayerMoney(playerId, amount);
    else
        printf("WARNING: Unable to grant money to %d: invalid amount (type %d).", playerId, _: type);
}

TakeRegulatedMoney(playerId, EconomyValueType: type, inputValue = 0) {
    new const amount = GetEconomyValue(type, inputValue);
    if (amount)
        GivePlayerMoney(playerId, -amount);
    else
        printf("WARNING: Unable to take money from %d: invalid amount (type %d).", playerId, _: type);
}
