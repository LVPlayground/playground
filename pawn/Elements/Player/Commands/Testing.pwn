// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*       Las Venturas Playground version 2.90 testing commands file.            *
*                                                                              *
*   This file contains commands which are currently in testing, or are not     *
*   enabled. Genereally, the commands are for players, but some of which could *
*   be for admins / management.                                                *
*                                                                              *
*                   Date: 14/02/2009                                           *
*                   Author: Various                                            *
*******************************************************************************/

#if Feature::DisableFightClub == 0
// This command was created by Martijnc a while back in the old
// command syntax. It has been cleaned up here, and is in testing. This
// will only be used in future versions, and will not be included in LVP 2.90.
lvp_Fight(playerid, params[]) {
    CFightClub__OnCommand (playerid, params);
    return 1;
}
#endif