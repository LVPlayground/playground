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
    DiveCommand,
    GiftHuntLargePrize,
    GiftHuntMediumPrize,
    GiftHuntSmallPrize,
    GrandTheftAutoRandomVehicleValue,
#if Feature::DisableKilltime == 0
    KilltimeVictory,
#endif
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
    ShipIdleMoney,
    ShowMessageCommand,
    SlapCommand,
    SpawnMoney,
    TaxiPerKilometer,
    TaxiRide,
    TaxiRideOwnerShare,
    TeleportWithVehicle,
    TeleportWithoutVehicle,
    TuneCommand,
    VehicleCrusherReward,
    VehicleExportReward,
    VehicleExportRewardOwnerShare,
    WantedLevelAward,
    WantedLevelOwnerShare
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
        case AirportCustomsTaxOwnersShare:      return customsTax / 2;
        case AirportFlight:                     return 750;
        case AlcoholicDrink:                    return 100 * inputValue /* units [1-8] */;
        case AlcoholicDrinkOwnerShare:          return 10 * inputValue /* units [1-8] */;
        case BitchSlapCommand:                  return 1000;
        case BombExplosionExtreme:              return 4500;
        case BombExplosionLarge:                return 3000;
        case BombExplosionMedium:               return 2000;
        case BombTypeCountdown:                 return 5000;
        case BombTypeCountdownOwnersShare:      return 1000;
        case BombTypeDetonator:                 return 5000;
        case BombTypeDetonatorOwnersShare:      return 1000;
        case BombTypeEngine:                    return 6000;
        case BombTypeEngineOwnersShare:         return 2300;
        case BonusExport:                       return 3000;
        case BonusKill:                         return 2500;
        case BonusMinigame:                     return 7500;
        case CarDiveCommand:                    return 1000;
        case ChaseEscaped:                      return 2500;
        case ChaseWinner:                       return 5000;
        case CustomizationShopOwnerShare:       return 150;
        case DeathDropMoneyPercentage:          return 50;
        case DeathmatchChampion:                return 25000;
        case DeliveryDistanceReward:            return 170 * inputValue /* distance in units */;
        case DeliveryTimeReward:                return 40 * inputValue /* seconds left */;
        case DiveCommand:                       return 500;
        case GiftHuntLargePrize:                return 50000;
        case GiftHuntMediumPrize:               return 25000;
        case GiftHuntSmallPrize:                return 10000;
        case GrandTheftAutoRandomVehicleValue:  return random(2542 /* max */ - 1351 /* min */) + 1356 /* min */;
#if Feature::DisableKilltime == 0
        case KilltimeVictory:                   return 5000;
#endif
        case MapZoneReward:                     return 2000 - 10 * inputValue /* time taken (seconds) */;
        case MapZoneSpeedBonus:                 return 2 * inputValue /* high-speed streak count */;
        case MinigameParticipation:             return 250;
        case MinigameVictory:                   return 2500 * (inputValue /* participant count */ + 1);
        case MoneyStatue:                       return 500 * inputValue /* statue kill count */;
        case NitroTwoShot:                      return 200;
        case NitroFiveShot:                     return 500;
        case NitroTenShot:                      return 1000;
        case NitroInfinite:                     return 5000;
        case ReactionTest:                      return 5000;
        case ShipIdleMoney:                     return 25 * inputValue /* VIP multiplier */;
        case ShowMessageCommand:                return 10000;
        case SlapCommand:                       return 500;
        case SpawnMoney:                        return 100;
        case TaxiPerKilometer:                  return 15;
        case TaxiRide:                          return GetEconomyValue(TaxiPerKilometer) * inputValue /* distance */;
        case TaxiRideOwnerShare:                return floatround(GetEconomyValue(TaxiPerKilometer) * inputValue /* distance */ * 0.1);
        case TeleportWithVehicle:               return 2500;
        case TeleportWithoutVehicle:            return 1000;
        case TuneCommand:                       return 1250;
        case VehicleCrusherReward:              return 2000;
        case VehicleExportReward:               return floatround(inputValue /* vehicle health [371-1000] */ * 15 * 1.216);
        case VehicleExportRewardOwnerShare:     return floatround(inputValue /* vehicle health [371-1000] */ * 15 * 1.216 * 0.1);
        case WantedLevelAward:                  return 1000 * inputValue /* wanted level stars */;
        case WantedLevelOwnerShare:             return 10 * inputValue /* wanted level stars */;
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
