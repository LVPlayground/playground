// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 *  You can find all sorts of defines which don't belong to other files right in here.
 *  Please keep this file as organized as possible.
 */
#define COLOR_GREY 0xAFAFAFAA
#define COLOR_YELLOW 0xFFFF00AA
#define COLOR_BLUE 0x0000BBAA
#define COLOR_LIGHTBLUE 0x33CCFFAA
#define COLOR_ORANGE 0xFF9900AA
#define COLOR_PINK 0xFF66FFAA

// HOLDING(keys)
#define HOLDING(%0) ((newkeys & (%0)) == (%0))
// PRESSED(keys)
#define PRESSED(%0) (((newkeys & (%0)) == (%0)) && ((oldkeys & (%0)) != (%0)))
// RELEASED(keys)
#define RELEASED(%0) (((newkeys & (%0)) != (%0)) && ((oldkeys & (%0)) == (%0)))

#define CP_INKOOP   7

#define lvp_command(%1,%2,%3); if( ( strcmp( cmdtext[1], #%1, true, (%2) ) == 0 ) \
     && ( ( Player(playerid)->level() >= %3 ) ) \
     && ( ( ( cmdtext[(%2)+1] == 0 ) && ( lvp_%1(playerid,"") ) ) \
     || ( ( cmdtext[(%2)+1] == 32 ) && ( lvp_%1(playerid, cmdtext[(%2)+2]) ) ) ) ) return 1;

new __szTmp[256];

new __iCMDIDX;
#define param_reset(); __iCMDIDX = 0;

#define param_shift(%1); new %1[ 128 ]; if(params[0]) { __iCMDIDX = 0; %1 = strtok(params,__iCMDIDX); str_shift(params,__iCMDIDX+1); }
#define param_shift_int(%1); __szTmp[0] = '\0'; if(params[0]) { __iCMDIDX = 0; __szTmp = strtok(params,__iCMDIDX); str_shift(params,__iCMDIDX+1); } new %1 = strval(__szTmp);

#define MAX_INTERIORS 114

/**
 *  Dialog IDs
 */
#define DIALOG_COMMANDS_LIST                4000
#define DIALOG_COMMANDS_MAIN                4001
#define DIALOG_COMMANDS_COMMUNICATION       4002
#define DIALOG_COMMANDS_TELEPORTATION       4003
#define DIALOG_COMMANDS_FIGHTING            4004
#define DIALOG_COMMANDS_MONEY               4005
#define DIALOG_MINIGAMES                    4007
#define DIALOG_DRIVEBY                      4008
#define DIALOG_GYM_FIGHT                    4009
#define DIALOG_FIGHTCLUB                    4010
#define DIALOG_FIGHTCLUB_DUEL_PLACE         4011
#define DIALOG_FIGHTCLUB_DUEL_WEAPONS_1     4012
#define DIALOG_FIGHTCLUB_DUEL_WEAPONS_2     4013
#define DIALOG_FIGHTCLUB_DUEL_WEAPONS_3     4014
#define DIALOG_FIGHTCLUB_DUEL_WEAPONS_4     4015
#define DIALOG_FIGHTCLUB_DUEL_WEAPONS_5     4016
#define DIALOG_FIGHTCLUB_DUEL_ROUNDS        4017
#define DIALOG_FIGHTCLUB_DUEL_INVITE        4018
#define DIALOG_FIGHTCLUB_WATCH              4019
#define DIALOG_DERBY_MAIN                   4033
#define DIALOG_JUMP_RACES                   4035
#define DIALOG_TELES_MAIN                   4036
#define DIALOG_TELES_TUNE_SHOPS             4037
#define DIALOG_TAXI_LOCATIONS               4038
#define DIALOG_MINIGAME_DM                  4039
#define DIALOG_JUMPS_LIST                   4041

// What is the maximum dialog Id? Used to start switching towards the dialog manager.
#compiler counter(OnDialogResponse, 101)

/**
 *
 * DO NOT ADD NEW DIALOGS IN HERE. ALL FEATURES SHOULD BE MOSTLY SELF-CONTAINED.
 *
 */
 