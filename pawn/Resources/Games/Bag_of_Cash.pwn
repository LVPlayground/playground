// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#define 	MAX_MONEY_BAG_CASH      1000000
#define     MIN_MONEY_BAG_CASH      1000
#define     MONEY_BAG_PICKUP_TYPE   2
#define     MONEY_BAG_PICKUP_MODEL  1550
#define     RANDOM_MONEY_LOCATIONS  129

#define chrtoupper(%1) \
	(((%1) > 0x60 && (%1) <= 0x7A) ? ((%1) ^ 0x20) : (%1))

static  iMoneyBagCashPickup = -1;
static  iMoneyBagCash;
static  Text:moneyText = Text:INVALID_TEXT_DRAW;
static  szMoneyClue[128];
static  iCashAddTime[MAX_PLAYERS];

enum E_RAND_MONEY_BAG {
    Float:randPosX,
    Float:randPosY,
    Float:randPosZ,
	szRandClue[64]
}

new bool: g_bagOfCashTextDrawVisible[MAX_PLAYERS];

static RandPickupLoc[RANDOM_MONEY_LOCATIONS][E_RAND_MONEY_BAG] = {
	{1600.5999,-1569.6865,22.5681, "Below busy"}, // Below the big roadcrossings in LS
	{-1381.7249,-40.7204,6.0000, "Long term parking"}, // Parking lot under SF airport
	{-1998.6791,-1546.5223,128.3751, "Chilly trees"}, // A treeline at Chilliad
	{-1841.6744,-1711.9569,23.2031, "Smelly dump"}, // Scrapyard at bottom of Chilliad
	{245.8762,1862.8872,18.1826, "Need some fresh air?"}, // Airvent at Area 69
	{-2871.0164,2716.3093,276.2450, "High on the docks"}, // On top of the mountain at the SF dock (small town)
	{-1753.2175,884.8032,295.8750, "Top of the tower"}, // On top of the highest tower in SF
	{-1131.9114,857.3856,3.0703, "Under the tracks"}, // Below the SF bridge (train bridge)
	{-1509.8120,1371.5524,3.2100, "Flight 815 crashed here"}, // The small island near the cargoship @ SF
	{-61.5421,44.6032,3.1103,"FiXeR rapes Kase here"}, // In the big farm at 0.0
	{-2257.2952,-903.3429,20.8721, "Riverside mountain view"}, // Aside Chilliad, at the river
	{-1633.8578,-2236.5330,31.4766, "Bigfoot's home"}, // Small shack in the forest
	{2794.4917,-2424.0518,13.6320, "Weekend soldiers"}, // Military storage at LS
	{1651.8723,-2286.3965,-1.2108, "Taxfree shopping"}, // In front of a shop at LS airport
	{-171.2476,-265.1891,1.7146, "FleischBerg"}, // FleischBerg factory (near Chilliad)
	{741.9465,-1274.3163,13.5547, "Tennis"}, // Tennis court in LS
	{681.2980,-468.9259, 22.5705, "Dillimore pumping"}, // Gasstation in Dillimore
	{-1960.4081, -968.4620, 35.8909, "5 round towers"}, // The 5 round towers at the end of SF
	{-1831.6002, 41.4175, 49.2031, "Solarin Industries"}, // Solarin Industries in LS
	{1117.5919,-2036.8892,78.7500,"Watch the stars"}, // LS observatorium on the hill west of the airport
	{2607.5046,-1469.7021,16.7834,"End of the river"}, // LS dam
	{258.1269,2938.3491,1.7661,"A Beach in the desert"},// small beach north of the desert airstrip
	{1211.9374,-35.5115,1000.9531,"Hey, sexy lady"}, // LV stripclub
	{1461.2927,2787.3984,10.8203,"GB"}, // Gangbase
	{1382.6139,2184.4070,11.0234,"Homerun!"}, // homebase of the LV baseball statium
	{2144.2246,1639.8315,993.5761,"Oceans 11"}, // Caligulas vault
	{-1661.3188,1214.7531,21.1563,"OTTO's broken glass"}, // Car shop north SF
	{-8.2241,-10.1926,68.5060,"Keep climbing"}, // On the haystack
	{711.5510,1986.4100,3.4000,"Twenties in her panties!"}, // Behind the strip club, located near a gas station behind the abandoned airport
	{2102.4160,-104.2844,2.2747,"Wheelchair"}, // In a small town, just after crossing the export point.
	{389.3819,-2028.5193,34.4802,"Round she goes!"}, // Ferris Wheel in LS
	{654.6223,866.2914,-33.8961,"Explosive situation"}, // Hunter Quarry, near the Blackfield Chapel
	{-418.2117,1363.3513,12.6237,"The Cave"}, // Somewhere in Fort Carson.
	{-2888.0156,2435.5051,201.6494,"Golden Gate"}, // Gant Bridge, SF. The bag is located somewhere on top of the hill
	{-824.9183,532.8306,1357.0803,"Liberty City"}, // Liberty City
	{-1600.9792,-2666.6938,59.6395,"Fire extinguisher"}, // Whetstone, near Mt. Chilliad, where there's a gas station and a fire extinguisher pickup
	{-1621.3473,1405.9089,7.1824,"T-Bone Mendez died here"}, // Where you killed T-Bone (SF)
	{-2667.6270,1428.5239,906.4609,"eF.Jizzy?"}, // Inside Jizzy's club
	{-2145.4858,-253.9723,40.7195,"Jhon's coke factory"}, // Coke factory in SF
	{-2427.9800,-125.3447,35.3203,"Pastageddon"}, // Shop in SF
	{-856.1527,1525.7755,25.7377,"Kase without the pasta touch"}, // The smokin' beef Grill (cow on top)
	{-346.0133,1614.7961,108.6099,"The old ear"}, // Big sattelite in the desert
	{1627.7043,-2285.6919,94.1328,"Traffic control"}, // Traffic control tower in LS
	{1552.6565,2298.3240,11.4167,"Home of the Bandit's"}, // Baseball field, behind the sign
	{2006.0957,2312.3975,10.8203,"Boom boom pow"}, // LV bombshop
	{2578.5872,2382.0640,18.2813,"Guitar pool"}, // Pool at Vrock hotel
	{2065.4370,2154.3938,10.8203,"Dangerous motel"}, // Fight club motel
	{2022.7126,1007.4236,14.9789,"4 mythical creatures"}, // 4 dragons casino
	{288.0256,-59.3220,1001.5156,"Test your metal here!"}, // LV ammunation
	{2357.4731,1844.9216,55.9280,"Ronald McDonald's roof"}, // Roof of the first clown pocket
	{-2035.5417,-116.8417,1035.1719,"Learn to Drive"}, // SF Driving School
	{-2156.4529,-405.7347,38.7588,"Touchdown!"}, // SF Stadium
	{-1786.0725,-1644.2098,33.6572,"Massive dump"}, // Quarry/Dump near Chiliad
	{389.7458,-2028.4886,34.5692,"Round and round"}, // LS Ferris Wheel
	{343.7617,162.2469,1027.5610,"R* Model"}, // LV Mainbank
	{1909.1781,-1202.0383,19.9806,"First gangfight"}, // LS Glen park
	{1271.6725,295.1357,20.6563,"This is well hidden"}, // Hidden well in Montomery
	{2058.1829,2433.8503,165.6172,"Jewels in the air"}, // LV Emerald Isle
	{2169.0730,2159.9587,62.3551,"Yeeehaaaaw!"}, // LV Cowboy sign
	{2230.4048,1604.3352,1006.1860,"Fancy some blackjack?"}, // Between the 4 blackjack tables @ caligula's
	{2000.9528,1669.5031,23.0088,"Skullface"}, // Glowing skull @ pirates in mens pants
	{1477.4376,1714.5875,10.8125,"Runway 69"}, // Runway at LV airport
	{2163.2676,1900.4282,36.1094,"Fishing for the stars"}, // Starfish casino
	{2087.0808,1905.8810,12.8338,"Under the fall"}, // Under the "waterfall" at the Visage
	{2320.4902,2126.9048,46.1184,"Candy suxxx"}, // On top of Candy's head at the casino's
	{1210.68, -33.24, 1000.96,"Top heavy girls daily"}, // Inside the LV stripclub (near ammu)
	{1067.5168,1776.1780,10.8203,"Grinding gears"}, // Scrap yard LV
	{220.1056,1822.8801,7.5257,"Map of San Andreas"}, // Map in area 51
	{2.3492,1363.7041,9.1719,"Solar trailer park"}, // Trailer park near the ufo (has 3 solar panels)
	{-143.9738,1230.2303,33.3366,"King ring"}, // King ring donuts in Fort Carson
	{1544.6656,-1353.5833,329.4738,"A nine-pointed star"}, // Basejumping building
	{2695.7883,-1704.5995,11.8438,"Eight-track racing"}, // LR Stadium
	{2051.7954,-1694.6245,13.5547,"Smokey garage"}, // Big Smoke's garage
	{657.1237,-1866.7823,5.4609,"Beach workout"}, // Beach gym in LS
	{154.4798,-1951.7048,51.3438,"Lighthouse"}, // LS lighthouse
	{-39.4815,52.9360,3.1172,"Old McDonald had a farm"}, // Big farm with the haystacks
	{-549.4021,-188.6925,78.4063,"Pink slip"}, // Racingspot from singleplayer, with the logs around
	{-1110.6401,-1637.2672,76.3672,"Smoke weed every day!"}, // The Truths farm
	{-345.3311,2226.8450,41.7591,"CJ's grave"}, // Grave CJ digs in SP with Pulaski
	{-843.8922,2748.6284,48.6324,"Teepees"}, // Tee pee motel
	{-237.1111,2663.2607,73.7261,"Feeding and seeding"}, // Giant chicken, desert
	{2629.2583,-2107.9226,16.9531,"Fossil oil"}, // LS chemicals, near docks
	{2573.0200,-638.4540,136.0294,"North rock"}, // North Rock is a place on east LS
	{2601.9211,225.3947,59.7262,"Hankypanky point"}, // Hankypanky point in most northern part of LS, nearly LV
	{2331.3889,-15.5503,29.9844,"Fleischberg"}, // Fleischberg sign in palomino creek
	{245.5130,-53.8416,1.5776,"Phat Liquor"}, // Phat Liquor in Blueberry
	{-679.6076,934.9304,16.7917,"Toreno"}, // Toreno's ranch
	{-725.8640,1533.2802,40.1423,"Las Barrancas"}, // Las Barrancas, up in the small ruins
	{-1390.1111,2643.8674,55.9844,"El Quebrados Sherrif"}, // El Quebrados Sherrif, inside with the property
	{-1316.3190,2541.8250,87.7422,"Aldea Malvada"}, // Aldea Malvada 1
	{-2529.1306,-704.6950,141.7888,"Missionary hill"}, // Missionary hill
	{-2412.9446,-324.5760,61.1835,"Avispa country club"}, // Avispa country club 1
	{-2178.9343,715.4362,53.8906,"Safe triad garage"}, // Garage where you find dead triads in SP with Wuzi
	{-1829.8118,1004.9015,45.2309,"Financial garden"}, // Hidden "garden" in SF between buildings
	{2636.3540,2335.0212,27.8272,"Massive six string"}, // Big guitar at vrock hotel
	{44.0376,2236.2344,125.8684,"The Devil's Castle"}, // 'El Castello di Diablo' is the name of this area on the map.
	{200.0175,2621.0525,17.1099,"Scrapyard Mongrels"}, // 'Scrapyard Mongrels' is the name of the band that composed the outro music for GTA:2. 'Scrapyard Mongrels' in this context refers to the aircraft scrapyard.
	{-814.2324,1815.1835,7.0000,"Hooverdam Power Plant"}, // This dam depicts a real existing dam in Nevada named 'Hoover dam' The desert around this are depicts the Mojave desert.
	{1786.1646,-1305.1372,13.6168,"Los Santos Business Center"}, // LS Business center
	{2173.4187,-1996.9084,19.7871,"Tired?"}, // Referring to the tires
	{773.3044,3.6847,1000.7162,"Do you even Know lift?"}, // Ganton gym
	{2450.3057,2117.9614,20.5502,"Follow the Rainbow"}, // Under the rainbow colored arrow, LV around casino's
	{2522.9819,2814.9714,25.6570,"Sniper"}, // KACC 1
	{2819.0784,1296.0344,10.9609,"Linden's location"}, // In a bush at Linden station
	{2000.8297,1547.4469,39.9063,"The Flying Dutchman"}, // Highest spot on the pirate ship
	{2134.2373,1730.1266,20.3906,"Attackers hate me"}, // Hunter location for /robbery
	{2316.6846,2352.9016,17.7403,"PD fountain"}, // Fountain in front of the LVPD (small park)
	{2399.1047,1928.0796,76.3745,"Finally build"}, // On the crane at the FinalBuild construction site in LV
	{2268.1169,1647.5417,107.7930,"Back or front"}, // Roof of Caligula's
	{985.1489,2562.7410,10.7538,"Welcome"}, // Welcome to LV sign
	{1126.7863,2761.3123,10.1615,"Putting some holes"}, // LV golfcourse (gangbase)
	{1867.3710,2865.7578,10.8359,"Nadal is no match for me"}, // LV Tenniscourts
    {1778.379028, -1942.235839, 13.567399, "Follow the damn train, CJ!"},
    {-127.241584, 2258.672363, 28.366134, "Rest In Pieces"},// El Castillo del diablo 
    {885.105468, -1077.394653, 24.294555, "Big Devil, Little Devil"},
    {2503.900634, -1380.009033, 28.531250, "Cousin Mary"},
    {2776.443115, -2407.833007, 13.646309, "Weekend Soldiers"},
    {2490.601806, -1668.930419, 13.335947, "G-Spot"},// Grove Street
    {2173.313964, 1285.673950, 24.475412, "Dark Horse"},// The Camel's Toe 
    {-2431.113525, -1619.667114, 526.241149, "King's Last Speech"}, //Top Of Mount Chiliad
    {1124.901000, -1133.657958, 23.828125, "Fallen Stars"},
    {-2060.226562, 253.433715, 37.489437, "Seagulls and Heavy Machinery"},
    {-2203.042968, -2261.087646, 30.625000, "Tenpenny's Bong Hit"},
    {380.756652, -2020.669921, 10.250000, "Ferris Bueller's Day Off"},
    {1699.614257, 1450.929565, 10.790941, "Road to Liberty"},
    {2855.230957, 855.887573, 9.934514, "Export Memories"},
    {2098.905273, -1648.859252, 13.526919, "Tagging Up Turf"},//The First Spray you Have Spray In Offline [Not in Mulitiplayer]
    {1383.719604, 2184.903564, 11.023437, "My Babe's name is Ruth"},
    {1608.248535, 2778.006591, 12.531224, "Pandora's Box"}
	};

BagCash__Disconnect(playerid) {
    g_bagOfCashTextDrawVisible[playerid] = false;
    TextDrawHideForPlayer(playerid, moneyText);
	iCashAddTime[playerid] = 0;
}

BagCash__Initialize() {
	moneyText = TextDrawCreate(498.0, 422.0, "~r~BAG OF CASH~w~ - $0~n~  Clue: ~y~LOADING CLUE...");
	TextDrawBackgroundColor(moneyText, 255);
	TextDrawFont(moneyText, 1);
	TextDrawLetterSize(moneyText, 0.22, 1.0);
	TextDrawColor(moneyText, -1);
	TextDrawSetOutline(moneyText, 1);
	TextDrawSetProportional(moneyText, 1);

	SetTimer("Promote_Cash", 10*1000*50, 1);
	SetTimer("RandomMoneyBagLocation", 10*1000, 0);
}

Check_Textdraw() {
    if (iMoneyBagCashPickup == -1)
		return;

    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); playerId++) {
        if (!Player(playerId)->isConnected())
            continue;  // npc?

        new const bool: shouldDisplay = IsPlayerInMainWorld(playerId) &&
                                        !IsPlayerInMinigame(playerId) &&
                                        !IsInterfaceBlockedByJavaScript(playerId);

        if (g_bagOfCashTextDrawVisible[playerId] == shouldDisplay)
            continue;  // visibility already is set accordingly for them

        g_bagOfCashTextDrawVisible[playerId] = shouldDisplay;

        if (shouldDisplay)
            TextDrawShowForPlayer(playerId, moneyText);
        else
            TextDrawHideForPlayer(playerId, moneyText);
    }
}

forward Promote_Cash();
public Promote_Cash() {
    if (iMoneyBagCashPickup == -1)
		return;

    new szPromo[128];
    format(szPromo, 128, "{FF0000}* Find the Bag of Cash: {FFFFFF}Type /bagmoney [amount] to add money to the bag!");
	SendClientMessageToAllEx(-1, szPromo);
}

forward RandomMoneyBagLocation();
public RandomMoneyBagLocation() {
	new iRand = random(RANDOM_MONEY_LOCATIONS);
	CreateMoneyBagPickup(RandPickupLoc[iRand][randPosX], RandPickupLoc[iRand][randPosY], RandPickupLoc[iRand][randPosZ], strtoupper(RandPickupLoc[iRand][szRandClue]), MIN_MONEY_BAG_CASH + random(MIN_MONEY_BAG_CASH));
}

CreateMoneyBagPickup(Float:fPosX, Float:fPosY, Float:fPosZ, szClue[], amount) {
	if (iMoneyBagCashPickup != -1) {
	    DestroyPickup(iMoneyBagCashPickup);
	    iMoneyBagCashPickup = -1;
	    iMoneyBagCash = 0;
	}

	iMoneyBagCashPickup = CreatePickup(MONEY_BAG_PICKUP_MODEL, MONEY_BAG_PICKUP_TYPE, fPosX, fPosY, fPosZ, -1);
	iMoneyBagCash = amount;

	new szClueText[128];
	format(szClueText, 128, "~r~BAG OF CASH~w~ - $%s~n~  Clue: ~y~%s", formatPrice(amount), szClue);
	TextDrawSetString(moneyText, szClueText);

	format(szMoneyClue, 128, "%s", strtoupper(szClue));

	SendClientMessageToAllEx(0x00E1E1FF, "-----------------------------");
	format(szClueText, 128, "A Bag of Cash has been dropped with $%s in it!", formatPrice(amount));
	SendClientMessageToAllEx(0x00E1E1FF, szClueText);
	format(szClueText, 128, "The clue is: %s. Want to add more money? Type /bagmoney [amount]!", szClue);
	SendClientMessageToAllEx(0x00E1E1FF, szClueText);
	SendClientMessageToAllEx(0x00E1E1FF, "-----------------------------");
}

UpdateMoneyAmount(iNewAmount, playerid) {
	if (iMoneyBagCash + iNewAmount > MAX_MONEY_BAG_CASH || iMoneyBagCash + iNewAmount < 0)
	    return 0;

	iMoneyBagCash += iNewAmount;

	new szClueText[128];
	format(szClueText, 128, "~r~BAG OF CASH~w~ - $%s~n~  Clue: ~y~%s", formatPrice(iMoneyBagCash), szMoneyClue);
	TextDrawSetString(moneyText, szClueText);

	SendClientMessageToAllEx(0x00E1E1FF, "-----------------------------");
	format(szClueText, 128, "{FF0000}%s{FFFFFF} has added $%s to the Bag of Cash!",
        Player(playerid)->nicknameString(), formatPrice(iNewAmount));
	SendClientMessageToAllEx(0x00E1E1FF, szClueText);
	format(szClueText, 128, "The bag now holds $%s. Want to add more money? Type /bagmoney [amount]!", formatPrice(iMoneyBagCash));
	SendClientMessageToAllEx(0x00E1E1FF, szClueText);
	SendClientMessageToAllEx(0x00E1E1FF, "-----------------------------");

	return 1;
}

OnPlayerFindMoneyBag(playerid) {
	new cash = iMoneyBagCash;
	if (cash < MIN_MONEY_BAG_CASH)
	    cash = MIN_MONEY_BAG_CASH;
	else if (cash > MAX_MONEY_BAG_CASH)
	    cash = MAX_MONEY_BAG_CASH;

    GivePlayerMoney(playerid, cash);  // OK: Bag of Cash

    new szClueText[128];
    SendClientMessageToAllEx(0x00E1E1FF, "-----------------------------");
	format(szClueText, 128, "{FFFFFF}%s{FF0000} has found the Bag of Cash ({00FF00}$%s{FF0000})!",
        Player(playerid)->nicknameString(), formatPrice(cash));
	SendClientMessageToAllEx(0x00E1E1FF, szClueText);
	SendClientMessageToAllEx(0x00E1E1FF, "-----------------------------");

    TextDrawHideForAll(moneyText);
    for (new i = 0; i < MAX_PLAYERS; ++i)
        g_bagOfCashTextDrawVisible[i] = false;

    SetTimer("RandomMoneyBagLocation", 40*1000, 0);

}

BagCash__CheckPickup(playerid, pickupid) {
	if (iMoneyBagCashPickup == -1)
	    return 0;

	if (pickupid == iMoneyBagCashPickup) {
		OnPlayerFindMoneyBag(playerid);
		DestroyPickup(iMoneyBagCashPickup);
		iMoneyBagCashPickup = -1;
        return 0;
	}

	return 0;
}

strtoupper(string[]) {
	new
		retStr[256],
		i,
		j;
	while ((j = string[i])) retStr[i++] = chrtoupper(j);
	retStr[i] = '\0';
	return retStr;
}
