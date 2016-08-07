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
    AlcoholicDrink,
    AlcoholicDrinkOwnerShare,
    BitchSlapCommand,
    BombExplosionExtreme,
    BombExplosionLarge,
    BombExplosionMedium,
    BombTypeCountdown,
    BombTypeCountdownOwnersShare,
    BombTypeDetonator,
    BombTypeDetonatorOwnersShare,
    BombTypeEngine,
    BombTypeEngineOwnersShare,
    BonusExport,
    BonusKill,
    BonusMinigame,
    CaptureBriefcaseParticipation,
    CaptureBriefcaseVictory,
    CarDiveCommand,
    ChaseEscaped,
    ChaseWinner,
    CustomizationShopOwnerShare,
    DeathDropMoneyPercentage,
    DeathmatchChampion,
    DeliveryDistanceReward,
    DeliveryTimeReward,
    DerbyParticipation,
    DerbyVictory,
    DiveCommand,
    FightClubParticipation,
    FightClubVictory,
    GiftHuntLargePrize,
    GiftHuntMediumPrize,
    GiftHuntSmallPrize,
    GrandTheftAutoRandomVehicleValue,
    HayParticipation,
    HideAndSeekSignUpCost,
    HideAndSeekPrize,
    IslandTeamDeathMatchPrize,
#if Feature::DisableKilltime == 0
    KilltimeVictory,
#endif
    LyseSignUpCost,
    MapZoneReward,
    MapZoneSpeedBonus,
    MinigameParticipation,
    MinigamePrize,
    MoneyStatue,
    NitroTwoShot,
    NitroFiveShot,
    NitroTenShot,
    NitroInfinite,
    ReactionTest,
    Ramping,
    RivershellParticipation,
    RobberyParticipation,
    RobberyVictory,
    RunWeaponsParticipation,
    ShipIdleMoney,
    ShowMessageCommand,
    SlapCommand,
    SpawnMoney,
    TaxiPerKilometer,
    TaxiRide,
    TaxiRideOwnerShare,
    TeleportWithVehicle,
    TeleportWithoutVehicle,
    TowCommand,
    TuneCommand,
    VehicleCrusherReward,
    VehicleExportReward,
    VehicleExportRewardOwnerShare,
    VipColourChange,
    WalkiesWeaponParticipation,
    WalkiesWeaponVictory,
    WantedLevelAward,
    WantedLevelOwnerShare,
    WaterFightParticipation
};

new customsTax = 1500;

// Features to manually update:
//   - Property pricing
//   - Weapons price (//data/ammunation.json)

GetEconomyValue(EconomyValueType: type, inputValue = 0) {
    switch (type) {
        case AirportCustomsTax:                 return customsTax;
        case AirportCustomsTaxMax:              return 5000;
        case AirportCustomsTaxMin:              return 500;
        case AirportCustomsTaxOwnersShare:      return customsTax / 4;
        case AirportFlight:                     return 250000;
        case AlcoholicDrink:                    return 1000 * inputValue /* units [1-8] */;
        case AlcoholicDrinkOwnerShare:          return 100 * inputValue /* units [1-8] */;
        case BitchSlapCommand:                  return 15000;
        case BombExplosionExtreme:              return 400000;
        case BombExplosionLarge:                return 70000;
        case BombExplosionMedium:               return 25000;
        case BombTypeCountdown:                 return 2000000;
        case BombTypeCountdownOwnersShare:      return 50000;
        case BombTypeDetonator:                 return 4000000;
        case BombTypeDetonatorOwnersShare:      return 100000;
        case BombTypeEngine:                    return 1000000;
        case BombTypeEngineOwnersShare:         return 25000;
        case BonusExport:                       return 30000;
        case BonusKill:                         return 15000;
        case BonusMinigame:                     return 20000;
        case CaptureBriefcaseParticipation:     return 100;
        case CaptureBriefcaseVictory:           return 2000000;
        case CarDiveCommand:                    return 10000;
        case ChaseEscaped:                      return 1000000;
        case ChaseWinner:                       return 2500000;
        case CustomizationShopOwnerShare:       return 1500;
        case DeathDropMoneyPercentage:          return 50;
        case DeathmatchChampion:                return 1000000;
        case DeliveryDistanceReward:            return 1700 * inputValue /* distance in units */;
        case DeliveryTimeReward:                return 400 * inputValue /* seconds left */;
        case DerbyParticipation:                return 250;
        case DerbyVictory:                      return 10000;
        case DiveCommand:                       return 7500;
        case FightClubParticipation:            return 2500;
        case FightClubVictory:                  return 5000;
        case GiftHuntLargePrize:                return 3000000;
        case GiftHuntMediumPrize:               return 1000000;
        case GiftHuntSmallPrize:                return 500000;
        case GrandTheftAutoRandomVehicleValue:  return random(2542193 /* max */ - 135611 /* min */) + 135611 /* min */;
        case HayParticipation:                  return 250;
        case HideAndSeekSignUpCost:             return 250;
        case HideAndSeekPrize:                  return 500000;
        case IslandTeamDeathMatchPrize:         return 10000;
#if Feature::DisableKilltime == 0
        case KilltimeVictory:                   return 2500000;
#endif
        case LyseSignUpCost:                    return 250;
        case MapZoneReward:                     return 20000 - 100 * inputValue /* time taken (seconds) */;
        case MapZoneSpeedBonus:                 return 10 * inputValue /* high-speed streak count */;
        case MinigameParticipation:             return 2500;
        case MinigamePrize:                     return 2500 * inputValue /* participant count */ * (2/3);
        case MoneyStatue:                       return 50000 * inputValue /* statue kill count */;
        case NitroTwoShot:                      return 2000;
        case NitroFiveShot:                     return 5000;
        case NitroTenShot:                      return 10000;
        case NitroInfinite:                     return 250000;
        case ReactionTest:                      return 10000;
        case Ramping:                           return 50000;
        case RivershellParticipation:           return 250;
        case RobberyParticipation:              return 250;
        case RobberyVictory:                    return 5000 * inputValue /* participant count */;
        case RunWeaponsParticipation:           return 250;
        case ShipIdleMoney:                     return 50 * inputValue /* VIP multiplier */;
        case ShowMessageCommand:                return 200000;
        case SlapCommand:                       return 5000;
        case SpawnMoney:                        return 175000;
        case TaxiPerKilometer:                  return 200;
        case TaxiRide:                          return GetEconomyValue(TaxiPerKilometer) * inputValue /* distance */;
        case TaxiRideOwnerShare:                return floatround(GetEconomyValue(TaxiPerKilometer) * inputValue /* distance */ * 0.1);
        case TeleportWithVehicle:               return 50000;
        case TeleportWithoutVehicle:            return 20000;
        case TowCommand:                        return 45000;
        case TuneCommand:                       return 10000;
        case VehicleCrusherReward:              return 4000;
        case VehicleExportReward:               return floatround(inputValue /* vehicle health [371-1000] */ * 75 * 1.216);
        case VehicleExportRewardOwnerShare:     return floatround(inputValue /* vehicle health [371-1000] */ * 75 * 1.216 * 0.1);
        case VipColourChange:                   return 10000000;
        case WalkiesWeaponParticipation:        return 250;
        case WalkiesWeaponVictory:              return 5000 * inputValue /* participant count */;
        case WantedLevelAward:                  return 10000 * inputValue /* wanted level stars */;
        case WantedLevelOwnerShare:             return 100 * inputValue /* wanted level stars */;
        case WaterFightParticipation:           return 2500;
    }

    return 0;
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
