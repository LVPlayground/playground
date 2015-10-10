// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

new _crashHelper[1];

/**
 * The SafeIndex macro allows you to quickly do bounds checking before setting an
 * array's index, as out-of-bound reads and writes throw fatal errors in Pawn.
 *
 * This mechanism does two assumptions: firstly, the array in question must be a
 * single-level array. Firstly, the size of the array must exceed it's intended
 * bounds by one, as this will allow us to safely overflow in the excess cell.
 *
 * @example SafeIndex<m_array, index> = 5;
 * @param %0 The array which the bounds checking should be done upon.
 * @param %1 The index which you want to write to.
 */
#define SafeIndex<%0,%1> %0[%1>=0 && %1<(sizeof(%0)-1) ? %1 : (sizeof(%0)-1)]

/**
 * Error messages are quite severe, and are therefore distributed to all players
 * in clear red text. Use this when a system runs into an error from which it can
 * recover, but 
 *
 * @example ERROR("There are no slots available in PhoneConversation::requestSlot().");
 * @param %0 The message which has to be distributed to all users.
 */
#define ERROR(%0) (SendClientMessageToAll(0xFF000000, %0))

/**
 * Utility define which causes the server to crash with a specific message. Crashes will generate
 * a stack trace which can be useful in triaging why something is happening.
 *
 * @example CRASH("This method should never be invoked under these circomstances.");
 * @param %0 Description displaying why the crash has occurred.
 */
#define CRASH(%0) do { printf("CRASH: %s", %0); new _crashIndex = 15; _crashHelper[_crashIndex]++; } while (false)
