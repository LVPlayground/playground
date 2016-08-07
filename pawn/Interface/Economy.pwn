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
    MinigameVictory,
    MoneyStatue,
    NitroTwoShot,
    NitroFiveShot,
    NitroTenShot,
    NitroInfinite,
    ReactionTest,
    Ramping,
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

new customsTax = 150;

// Features to manually update:
//   - Property pricing
//   - Weapons price (//data/ammunation.json)

GetEconomyValue(EconomyValueType: type, inputValue = 0) {
    switch (type) {
        case AirportCustomsTax:                 return customsTax;
        case AirportCustomsTaxMax:              return 500;
        case AirportCustomsTaxMin:              return 50;
        case AirportCustomsTaxOwnersShare:      return customsTax / 4;
        case AirportFlight:                     return 25000;
        case AlcoholicDrink:                    return 100 * inputValue /* units [1-8] */;
        case AlcoholicDrinkOwnerShare:          return 10 * inputValue /* units [1-8] */;
        case BitchSlapCommand:                  return 1500;
        case BombExplosionExtreme:              return 40000;
        case BombExplosionLarge:                return 7000;
        case BombExplosionMedium:               return 2500;
        case BombTypeCountdown:                 return 200000;
        case BombTypeCountdownOwnersShare:      return 5000;
        case BombTypeDetonator:                 return 400000;
        case BombTypeDetonatorOwnersShare:      return 10000;
        case BombTypeEngine:                    return 100000;
        case BombTypeEngineOwnersShare:         return 2500;
        case BonusExport:                       return 3000;
        case BonusKill:                         return 1500;
        case BonusMinigame:                     return 2000;
        case CarDiveCommand:                    return 1000;
        case ChaseEscaped:                      return 100000;
        case ChaseWinner:                       return 250000;
        case CustomizationShopOwnerShare:       return 150;
        case DeathDropMoneyPercentage:          return 50;
        case DeathmatchChampion:                return 100000;
        case DeliveryDistanceReward:            return 170 * inputValue /* distance in units */;
        case DeliveryTimeReward:                return 40 * inputValue /* seconds left */;
        case DerbyParticipation:                return 25;
        case DerbyVictory:                      return 1000;
        case DiveCommand:                       return 750;
        case GiftHuntLargePrize:                return 300000;
        case GiftHuntMediumPrize:               return 100000;
        case GiftHuntSmallPrize:                return 50000;
        case GrandTheftAutoRandomVehicleValue:  return random(254219 /* max */ - 13561 /* min */) + 13561 /* min */;
        case HayParticipation:                  return 25;
        case HideAndSeekSignUpCost:             return 25;
        case HideAndSeekPrize:                  return 50000;
        case IslandTeamDeathMatchPrize:         return 1000;
#if Feature::DisableKilltime == 0
        case KilltimeVictory:                   return 250000;
#endif
        case LyseSignUpCost:                    return 25;
        case MapZoneReward:                     return 2000 - 10 * inputValue /* time taken (seconds) */;
        case MapZoneSpeedBonus:                 return 1 * inputValue /* high-speed streak count */;
        case MinigameParticipation:             return 250;
        case MinigameVictory:                   return 250 * inputValue /* participant count */;
        case MoneyStatue:                       return 5000 * inputValue /* statue kill count */;
        case NitroTwoShot:                      return 200;
        case NitroFiveShot:                     return 500;
        case NitroTenShot:                      return 1000;
        case NitroInfinite:                     return 25000;
        case ReactionTest:                      return 1000;
        case Ramping:                           return 5000;
        case RunWeaponsParticipation:           return 25;
        case ShipIdleMoney:                     return 5 * inputValue /* VIP multiplier */;
        case ShowMessageCommand:                return 20000;
        case SlapCommand:                       return 500;
        case SpawnMoney:                        return 17500;
        case TaxiPerKilometer:                  return 20;
        case TaxiRide:                          return GetEconomyValue(TaxiPerKilometer) * inputValue /* distance */;
        case TaxiRideOwnerShare:                return floatround(GetEconomyValue(TaxiPerKilometer) * inputValue /* distance */ * 0.1);
        case TeleportWithVehicle:               return 5000;
        case TeleportWithoutVehicle:            return 2000;
        case TowCommand:                        return 4500;
        case TuneCommand:                       return 1000;
        case VehicleCrusherReward:              return 400;
        case VehicleExportReward:               return floatround(inputValue /* vehicle health [371-1000] */ * 7.5 * 1.216);
        case VehicleExportRewardOwnerShare:     return floatround(inputValue /* vehicle health [371-1000] */ * 7.5 * 1.216 * 0.1);
        case VipColourChange:                   return 1000000;
        case WalkiesWeaponParticipation:        return 25;
        case WalkiesWeaponVictory:              return 500 * inputValue /* participant count */;
        case WantedLevelAward:                  return 1000 * inputValue /* wanted level stars */;
        case WantedLevelOwnerShare:             return 10 * inputValue /* wanted level stars */;
        case WaterFightParticipation:           return 250;
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
