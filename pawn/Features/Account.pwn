// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#include "Features/Account/AccountData.pwn"

/**
 * Accounts on Las Venturas Playground have been entirely rewritten to be more stable, performant
 * and feature rich. The new system is entirely asynchronous and features a number of exciting new
 * features, aside from a more object oriented set-up in the code.
 *
 * Because the system is aysnchronous with several layers of abstraction, the most common work-flows
 * will be explained in this comment. When editing code or hunting for a bug, finding the flows that
 * may be involved in the problem you're trying to solve is a very good first step.
 *
 * 1. Connection and initial authentication.
 * 2. Granting a player administrator rights through /modlogin.
 * 3. ...
 *
 * *************************************************************************************************
 *
 * 1. Connection and initial authentication.
 *
 * After a player connects to Las Venturas Playground, we fire a PlayerRegisteredRequest for their
 * nickname, but continue under the assumption that they're not registered. If it returns, it'll
 * inform the Account class through the onRegisteredRequestComplete() method of the User Id, the
 * account's Skin Id and whether they can be identified automatically, which occurs when their IP
 * address is on a whitelist for the account. If it is possible to use automatic identified, proceed
 * to loading the account's details and abort.
 *
 * If we need to ask the user to enter their password, a EnterPasswordDialog will be created. There
 * are two possible outcomes here:
 *
 *     1) The users enters a password into the dialog.
 *        When this happens, the EnterPasswordDialog class will call onPasswordDialogResponse() on
 *        the player's Account instance. Fire a PasswordVerificationRequest and show a dialog to the
 *        player telling them that it's being verified.
 *
 *     2) They click on the cancel button.
 *        Tell them that the account is registered and that they do need to enter a password, and
 *        show the EnterPasswordDialog dialog again.
 *
 * A player can see the enter-password dialog three times, after that they will be kicked. Code-
 * wise, this flow can be represented in the following way:
 *
 * 1. Account::onPlayerConnect()
 *    --> PlayerRegisteredRequest::createForNickname() [asynchronous -- go to (2)].
 * 2. PlayerRegisteredRequest::onReceivedResult()
 *    --> Account::onRegisteredRequestComplete()
 *        --> Account::identifyPlayerForUserId() [if automatic identification]
 *            --> AccountDataRequest::createForUserId() [asynchronous -- go to (6)].
 *        --> EnterPasswordDialog::show() [asynchronous -- go to (3)].
 * 3. EnterPasswordDialog::onResponse()
 *    --> Account::onPasswordDialogResponse()
 *        --> AccountRegisteredDialog::show() [if clicked on cancel -- go to (5*)].
 *        --> PasswordVerificationRequest::createForUserId() [asynchronous -- go to (4)].
 * 4. PasswordVerificationRequest::onReceivedResult()
 *    --> Account::onPasswordVerificationComplete()
 *        --> Account::identifyPlayerForUserId() [if verified]
 *            --> AccountDataRequest::createForUserId() [asynchronous -- go to (6)].
 *        --> EnterPasswordDialog::show() [asynchronous -- go to (3)].
 * 5. AccountRegisteredDialog::onResponse()
 *    --> Account::displayPasswordDialog() [if clicked on Identify]
 *        --> ForcedGuestDialog::show() [if more than #N login attempts)
 *        --> EnterPasswordDialog::show() [asynchronous -- go to (3)].
 *    --> Account::changeNicknameAndPlayAsGuest() [if clicked on Play]
 * 6. AccountDataRequest::onReceivedResult()
 *    --> AccountData::onReceivedAccountData()
 *    --> Account::onReceivedAccountData()
 *
 * When you need to retrieve new fields from the database, i.e. because of a new account feature
 * being implemented, you'll want to change this in AccountData::onReceivedAccountData() and in
 * AccountDataRequest::__construct() (to modify the actual query which will be executed).
 *
 * *************************************************************************************************
 *
 * 2. Granting a player administrator rights through /modlogin.
 *
 * Administrators of Las Venturas Playground have the ability to get access to their Staff rights
 * without having to use their nickname for a certain session. The main use-case for this is that
 * it gives them the ability to be undercover.
 *
 * After a player types the /modlogin command, the following sequence takes off:
 *
 * 1. AccountCommands::onModLoginCommand()
 *    --> Account::requestModLogin()
 *        --> ModLoginRequest::createForPlayer() [asynchronous -- go to (2)].
 * 2. ModLoginRequest::onReceivedResult()
 *    --> Account::onSuccessfulModLoginAttempt() [if successful]
 *    --> Account::onFailedModLoginAttempt() [if failed]
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */

/**
 * There are several types of password requests. The most common one will be initial authentication,
 * but in order to prevent abuse of certain low-level features, such as gaining rcon access, we
 * should put a dialog in place if the user joined using automatic identification.
 */
enum PasswordRequestType {
    InitialAuthenticationPasswordRequest
};

#include "Features/Account/UndercoverAdministrator.pwn"
#include "Features/Account/Account.pwn"

#include "Features/Account/AccountRegisteredDialog.pwn"
#include "Features/Account/AccountSaver.pwn"
#include "Features/Account/NicknameGenerator.pwn"

#include "Features/Account/EnterPasswordDialog.pwn"
#include "Features/Account/ForcedGuestDialog.pwn"

#include "Features/Account/Bans/BanCommands.pwn"
#include "Features/Account/Bans/BanManager.pwn"

#include "Features/Account/GpciLogger.pwn"

#include "Features/Account/AccountCommands.pwn"
