// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Players who also happen to be member of a gang can have different roles in their membership. A
 * gang has one or more leaders, optional managers and of course gang members.
 */
enum GangRole {
    // Gang leaders lead the gang and have complete authority over the gang.
    GangLeaderRole,

    // Gang managers can add and remove gang members.
    GangManagerRole,

    // Gang members are normal foot soldiers, but still have access to many of the shared gang
    // information such as the bank account.
    GangMemberRole
};
