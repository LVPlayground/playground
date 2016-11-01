// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// Delivery by theHolyCow

// Locations
enum TruckDeliveryLocationsEnum {
    Float:xpos,
    Float:ypos,
    Float:zpos
};

enum TruckDeliveryPlayerEnum {
    TimerID,
    Time,
    distn,
    TimeStart,
    CheckTime
}

new TruckDeliveryPlayer[MAX_PLAYERS][TruckDeliveryPlayerEnum];

new TruckDeliveryLocations[54][TruckDeliveryLocationsEnum] = {
    {2481.4021, 2755.6133,10.8203},
    {-2263.6575,2394.6021,4.9742},
    {-2025.8252,142.9146,28.8359},
    {61.9683,-241.5414,1.5781},
    {-76.6898,-1128.9066,1.0781},
    {-491.1092,-521.5325,25.5178},
    {-1038.5590,-607.8232,32.0078},
    {2763.4001,-2413.3281,13.6328},
    {1389.6781,1039.2485,11.8284},
    {1470.4674,1038.7430,11.3903},
    {1452.7476,974.3447,11.2961},
    {1641.4202,1068.3184,11.8384},
    {1715.9005,1055.7521,11.8333},
    {2855.4922,897.2054,11.2685},
    {2833.0500,979.2245,11.7743},
    {2609.8567,1432.7487,11.8430},
    {2869.8628,2573.7632,11.8408},
    {2795.3533,2575.0513,11.8440},
    {2766.9221,2633.4294,11.8379},
    {1695.1515,685.0518,11.8351},
    {1622.8644,745.4155,11.8525},
    {-2279.2598,2390.2241,5.9346},
    {-2432.9575,2273.9436,5.9900},
    {-1871.2062,1414.0574,8.2045},
    {-1733.0854,1515.7645,8.1940},
    {-1434.2042,380.5065,8.2134},
    {-1732.0144,171.5570,4.5708},
    {-1626.3013,104.3968,-10.2179},
    {-1699.2408,12.4273,4.5631},
    {-1692.3843,-33.6516,4.5751},
    {-1822.2152,18.7354,16.1301},
    {-1853.6118,-141.6966,12.9300},
    {-1819.1189,-155.0796,10.4290},
    {-2058.3005,13.7442,36.3458},
    {-981.6092,-709.7316,33.0262},
    {-557.2852,-500.9562,25.9966},
    {2010.1798,-2273.6133,14.5562},
    {2081.8030,-2020.5531,14.5634},
    {2209.5137,-2293.7173,15.8021},
    {2174.9243,-2266.7429,14.3993},
    {2390.5627,-2236.7449,14.5632},
    {2516.7605,-2244.7158,14.5663},
    {2422.5522,-2473.5381,14.6447},
    {2567.1941,-2417.0154,14.6469},
    {2715.8228,-2390.5537,14.6538},
    {2800.6294,-2378.1345,14.6638},
    {2779.4309,-2508.8784,14.6396},
    {2498.0168,-2618.2356,14.6624},
    {2261.8884,-2626.0027,14.6006},
    {2263.4141,-2536.5315,9.3305},
    {2282.6772,-2351.3608,14.5554},
    {2394.6694,-2076.4092,14.5267},
    {2507.1375,-2114.8638,14.5708},
    {2644.2620,-2138.6851,14.5626}
};

// Actual code
PrepareDelivery(playerid)
{
        new iVehID;
        new iRandLoc;
        new iVehMod;

        if(PlayerInfo[playerid][PlayerStatus] == STATUS_DELIVERY){
            SendClientMessage(playerid, Color::Red,"* You are already on a delivery!");
            return 1;
        }

        if(!IsPlayerInAnyVehicle(playerid)){
            SendClientMessage(playerid, Color::Red, "* You have to be in a truck!");
            return 1;
        }
        iVehID = GetPlayerVehicleID(playerid);
        iVehMod = GetVehicleModel(iVehID);
        if(!(iVehMod == 515 || iVehMod == 403 || iVehMod == 414)){
            SendClientMessage(playerid, Color::Red, "* You are NOT in a truck!");
            return 1;
        }
        if(GetPlayerState(playerid) == PLAYER_STATE_PASSENGER){
            SendClientMessage(playerid, Color::Red, "* You are not the driver!");
            return 1;
        }
        if(!IsTrailerAttachedToVehicle(iVehID)){
            SendClientMessage(playerid, Color::Red, "* You have to pick up a trailer first!");
            return 1;
        }

        PlayerInfo[playerid][PlayerStatus] = STATUS_DELIVERY;
        iRandLoc = random(53);

        // assign the position to an array
        new Float:TruckLocationX
           ,Float:TruckLocationY
           ,Float:TruckLocationZ
           ,Float:playerToDeliveryLocationDistance;
        TruckLocationX = TruckDeliveryLocations[iRandLoc][xpos];
        TruckLocationY = TruckDeliveryLocations[iRandLoc][ypos];
        TruckLocationZ = TruckDeliveryLocations[iRandLoc][zpos];
        // get the distance from the player to the delivery location
        playerToDeliveryLocationDistance = GetDistance(playerid, TruckLocationX, TruckLocationY, TruckLocationZ);

        TruckDeliveryPlayer[playerid][distn] = floatround(playerToDeliveryLocationDistance/50);
        TruckDeliveryPlayer[playerid][Time] = floatround(floatpower(TruckDeliveryPlayer[playerid][distn], 0.9)*4.5, floatround_round);
        TruckDeliveryPlayer[playerid][CheckTime] = TruckDeliveryPlayer[playerid][Time];
        TruckDeliveryPlayer[playerid][TimeStart] = Time->currentTime();


        DisablePlayerCheckpoint(playerid);
        SetPlayerCheckpoint(playerid, TruckLocationZ, TruckLocationY, TruckLocationZ, 5.0);
        GameTextForPlayer(playerid,"~w~Delivery",5000,1);
    //  new str[256];
    //  format(str,256,"%s (ID:%d) has started the delivery minigame.",PlayerName(playerid),playerid);
    //  Admin(str);
        new str[128];
        if (TruckDeliveryPlayer[playerid][Time] / 60 == 0) format(str, sizeof(str), "* Deliver the goods to the checkpoint within %d seconds!", TruckDeliveryPlayer[playerid][Time] % 60);
        else if (TruckDeliveryPlayer[playerid][Time] / 60 == 1) format(str, sizeof(str), "* Deliver the goods to the checkpoint within 1 minute and %d seconds!", TruckDeliveryPlayer[playerid][Time] % 60);
        else format(str, sizeof(str), "* Deliver the goods to the checkpoint within %d minutes and %d seconds!", TruckDeliveryPlayer[playerid][Time] / 60, TruckDeliveryPlayer[playerid][Time] % 60);
        SendClientMessage(playerid, COLOR_PINK, str);
        return 1;
}

DeliveryPlayerExitTruck(playerid)
{
    if(PlayerInfo[playerid][PlayerStatus] == STATUS_DELIVERY)
    {
        DeliveryResetStuff(playerid);
        SendClientMessage(playerid, Color::White, "* You left your vehicle. Delivery over!");
        PlayerInfo[playerid][PlayerStatus] = STATUS_NONE;
        GameTextForPlayer(playerid,"~r~Delivery over!",5000,0);
        DisablePlayerCheckpoint(playerid);
    }
    return 1;
}

forward DeliveryPlayerTimeOver(playerid);
public DeliveryPlayerTimeOver(playerid)
{
    if(PlayerInfo[playerid][PlayerStatus] == STATUS_DELIVERY)
    {
        DeliveryResetStuff(playerid);
        SendClientMessage(playerid, Color::White, "* You are out of time. Delivery over!");
        PlayerInfo[playerid][PlayerStatus] = STATUS_NONE;
        GameTextForPlayer(playerid,"~r~Delivery over!", 5000, 0);
        DisablePlayerCheckpoint(playerid);
    }
}

DeliveryComplete(playerid)
{
    if(!IsPlayerInAnyVehicle(playerid)){
        PlayerInfo[playerid][PlayerStatus] = STATUS_NONE; // Not needed, just a backup.
        DisablePlayerCheckpoint(playerid);
        return 1;
    }
    new iVehID = GetPlayerVehicleID(playerid);
    if(!IsTrailerAttachedToVehicle(iVehID)){
        SendClientMessage(playerid, Color::Red, "* What are you trying to pull? Bring me the trailer!");
        return 1;
    }
    DisablePlayerCheckpoint(playerid);

    new const timeTaken = Time->currentTime() - TruckDeliveryPlayer[playerid][TimeStart];
    new const timeLeft = TruckDeliveryPlayer[playerid][Time] - timeTaken;

    new const timeReward = GetEconomyValue(DeliveryTimeReward, timeLeft);
    new const distanceReward = GetEconomyValue(DeliveryDistanceReward, TruckDeliveryPlayer[playerid][distn]);

    new const reward = timeReward + distanceReward;

    new str[128];
    format(str, sizeof(str), "* You delivered the goods on time. You have received $%s!", formatPrice(reward));
    SendClientMessage(playerid, COLOR_YELLOW, str);
    GivePlayerMoney(playerid, reward);  // economy: DeliveryDistanceReward / DeliveryTimeReward
    SetVehicleToRespawn(GetVehicleTrailer(iVehID));
    PlayerInfo[playerid][PlayerStatus] = STATUS_NONE;
    PlayerInfo[playerid][playerInCheckpoint] = 0;
    new tstr[128];
    format(tstr, sizeof(tstr), "~y~Delivery Complete!~n~~g~$%s!", formatPrice(reward));
    GameTextForPlayer(playerid, tstr, 5000, 0);
    DeliveryResetStuff(playerid);
    return 1;
}

DeliveryResetStuff(playerid)
{
    KillTimer(TruckDeliveryPlayer[playerid][TimerID]);
    TruckDeliveryPlayer[playerid][TimerID] = 0;
    TruckDeliveryPlayer[playerid][Time] = 0;
    TruckDeliveryPlayer[playerid][distn] = 0;
    TruckDeliveryPlayer[playerid][TimeStart] = 0;
    TruckDeliveryPlayer[playerid][TimeStart] = 0;
}
