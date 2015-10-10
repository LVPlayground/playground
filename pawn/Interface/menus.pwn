// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

    // Todo: they all need to be converted to dialogs (DIALOG_STYLE_LIST)



    Taxi = CreateMenu("~y~Kaufman Cabs:", 1, 0.0, 200.0, 270.0, 250.0);
    SetMenuColumnHeader(Taxi,0,"~p~Choose a destination");
    AddMenuItem(Taxi,0,"Pirate Ship");
    AddMenuItem(Taxi,0,"LV Police department");
    AddMenuItem(Taxi,0,"LV Airport");
    AddMenuItem(Taxi,0,"Mount Chilliad");
    AddMenuItem(Taxi,0,"Ammunation");
    AddMenuItem(Taxi,0,"Area 69");
    AddMenuItem(Taxi,0,"Airstrip");
    AddMenuItem(Taxi,0,"Basejumping");

    // Menus for the Drinks handler - commented out until build time
    CDrink__BuildMenus();

    // LV AIRPORT:
    AirportMenu[0] = CreateMenu("LV Airport:", 2, 0.0, 200.0, 120.0, 250.0);

    SetMenuColumnHeader(AirportMenu[0],0,"Destination");
    AddMenuItem(AirportMenu[0],0,"San fierro");
    AddMenuItem(AirportMenu[0],0,"Los Santos");
    AddMenuItem(AirportMenu[0],0,"Liberty City");

    SetMenuColumnHeader(AirportMenu[0],1,"Price");
    AddMenuItem(AirportMenu[0],1,"250.000");
    AddMenuItem(AirportMenu[0],1,"250.000");
    AddMenuItem(AirportMenu[0],1,"250.000");

    // SF AIRPORT:

    AirportMenu[1] = CreateMenu("SF Airport:", 2, 0.0, 200.0, 120.0, 250.0);

    SetMenuColumnHeader(AirportMenu[1],0,"Destination");
    AddMenuItem(AirportMenu[1],0,"Las Venturas");
    AddMenuItem(AirportMenu[1],0,"Los Santos");
    AddMenuItem(AirportMenu[1],0,"Liberty City");

    SetMenuColumnHeader(AirportMenu[0],1,"Price");
    AddMenuItem(AirportMenu[1],1,"250.000");
    AddMenuItem(AirportMenu[1],1,"250.000");
    AddMenuItem(AirportMenu[1],1,"250.000");

    // LS AIRPORT:

    AirportMenu[2] = CreateMenu("LS Airport:", 2, 0.0, 200.0, 120.0, 250.0);

    SetMenuColumnHeader(AirportMenu[2],0,"Destination");
    AddMenuItem(AirportMenu[2],0,"Las Venturas");
    AddMenuItem(AirportMenu[2],0,"San fierro");
    AddMenuItem(AirportMenu[2],0,"Liberty City");

    SetMenuColumnHeader(AirportMenu[2],1,"Price");
    AddMenuItem(AirportMenu[2],1,"250.000");
    AddMenuItem(AirportMenu[2],1,"250.000");
    AddMenuItem(AirportMenu[2],1,"250.000");

    // Liberty City:

    AirportMenu[3] = CreateMenu("Liberty City:", 2, 0.0, 200.0, 120.0, 250.0);

    SetMenuColumnHeader(AirportMenu[3],0,"Destination");
    AddMenuItem(AirportMenu[3],0,"Las Venturas");
    AddMenuItem(AirportMenu[3],0,"San fierro");
    AddMenuItem(AirportMenu[3],0,"Los Santos");

    SetMenuColumnHeader(AirportMenu[3],1,"Price");
    AddMenuItem(AirportMenu[3],1,"250.000");
    AddMenuItem(AirportMenu[3],1,"250.000");
    AddMenuItem(AirportMenu[3],1,"250.000");

