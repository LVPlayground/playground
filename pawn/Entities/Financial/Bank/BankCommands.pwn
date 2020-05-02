// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * There are various commands related to the bank accounts, which, for example, allow the player to
 * withdraw money from their account, check their balance or upgrade to a new account type. These
 * commands will control the logic in the BankAccount class, but do all the necessary error and
 * boundary checking required to ensure player's don't break things.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class BankCommands {
    /**
     * The /balance command allows players to check the current balance of their bank account. If
     * the player isn't registered on Las Venturas Playground, a message will be shown that this
     * feature is only available for registered players. Otherwise, both the balance and the maximum
     * amount of money that can be stored in the account will be shown.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /balance
     */
    @command("balance")
    public onBalanceCommand(playerId, params[]) {
        if (this->validateRegistrationStatus(playerId) == false)
            return 1; // the player is not registered with LVP.

        new balance = BankAccount(playerId)->balance(),
            maximumBalance = BankAccount(playerId)->maximumBalance(),
            message[128];

        format(message, sizeof(message), "* Your current balance is {40CCFF}$%s{FFFFFF}, and you can store a maximum of {40CCFF}$%s{FFFFFF}.",
            formatPrice(balance), formatPrice(maximumBalance));
        SendClientMessage(playerId, Color::Information, message);

        return 1;
        #pragma unused params
    }

    /**
     * Withdrawing money from the player's account can either be done for the full funds in a single
     * transaction (specify "all" as the amount), or only for a certain amount. This command is only
     * available for registered players.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command.
     * @command /withdraw [all/amount]
     */
    @command("withdraw")
    public onWithdrawCommand(playerId, params[]) {
        if (this->validateRegistrationStatus(playerId) == false)
            return 1; // the player is not registered with LVP.

        new parameterValue[11],
            requestedAmount = 0;

        Command->stringParameter(params, 0, parameterValue, sizeof(parameterValue));

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /withdraw [all/amount]");
            return 1;
        }

        // The player might want to withdraw all their funds from their account or just a certain
        // amount. Recognize "all" and numbers larger than zero.
        if (strcmp(parameterValue, "all", true, 3) == 0)
            requestedAmount = BankAccount(playerId)->balance();
        else if (strval(parameterValue) > 0)
            requestedAmount = strval(parameterValue);
        else {
            SendClientMessage(playerId, Color::Information, "Usage: /withdraw [all/amount]");
            return 1;
        }

        // Be sure that the amount is larger than zero (we should fail in case of "all" and an empty
        // bank account) and that the player's balance is higher than this value.
        if (requestedAmount <= 0 || requestedAmount > BankAccount(playerId)->balance()) {
            SendClientMessage(playerId, Color::Error, "Error: You do not have sufficient funds in order to complete this transaction.");
            return 1;
        }

        // Instrument how often people withdraw money from their account, and how much.
        Instrumentation->recordActivity(BankWithdrawActivity, requestedAmount);

        // We know the requested amount and verified that the player has enough money.
        BankAccount(playerId)->setBalance(BankAccount(playerId)->balance() - requestedAmount);
        GivePlayerMoney(playerId, requestedAmount);

        new message[128];
        format(message, sizeof(message), "You have successfully withdrawn {FFFFFF}$%s{33AA33}. Your remaining balance is {FFFFFF}$%s{33AA33}.",
            formatPrice(requestedAmount), formatPrice(BankAccount(playerId)->balance()));
        SendClientMessage(playerId, Color::Success, message);

        /// @todo: We should announce this on IRC.
        return 1;
    }

    /**
     * Any player can deposit money into his bank account, within the maximum balance limit. The
     * player can either bank all of his pocket money, specifying "all" as the amount of money to be
     * deposited, or any declared amount of money which is less than or equal to his pocket money's
     * amount. This command is only available for registered players.
     * 
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player passed to the command.
     * @command /bank [all/amount]
     */
    @command("bank")
    public onBankCommand(playerId, params[]) {
        if (this->validateRegistrationStatus(playerId) == false)
            return 1; // the player is not registered with LVP.

        new parameterValue[8],
            depositAmount = 0,
            premierCommission = 0;

        Command->stringParameter(params, 0, parameterValue, sizeof(parameterValue));

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /bank [all/amount]");
            return 1;
        }

        if (strcmp(parameterValue, "all", true, 3) == 0)
            depositAmount = GetPlayerMoney(playerId);
        else if (strval(parameterValue) > 0)
            depositAmount = strval(parameterValue);
        else {
            SendClientMessage(playerId, Color::Information, "Usage: /bank [all/amount]");
            return 1;
        }

        // Validate that the given deposit amount is (a) positive, (b) not larger than the amount of
        // money the player is carrying and (c) fits in the player's bank account.
        if (depositAmount <= 0) {
            SendClientMessage(playerId, Color::Error, "Error: You gave an invalid amount of money to deposit! It needs to be more than $0.");
            return 1;
        }

        if (depositAmount > GetPlayerMoney(playerId)) {
            SendClientMessage(playerId, Color::Error, "Error: You do not have sufficient funds in order to complete this transaction.");
            return 1;
        }

        if (BankAccount(playerId)->availableBalance() == 0) {
            SendClientMessage(playerId, Color::Error, "Error: The bank refuses to take more money from you, because your account is full!");
            return 1;
        }

        depositAmount = min(BankAccount(playerId)->availableBalance(), depositAmount);

        // Instrument how often and how much people deposit money into their account.
        Instrumentation->recordActivity(BankDepositActivity, depositAmount);

        BankAccount(playerId)->setBalance(BankAccount(playerId)->balance() + (depositAmount - premierCommission));
        GivePlayerMoney(playerId, -depositAmount);

        new message[128];
        format(message, sizeof(message), "You have successfully deposited {FFFFFF}$%s{33AA33}. Your new balance is {FFFFFF}$%s{33AA33}.",
            formatPrice(depositAmount), formatPrice(BankAccount(playerId)->balance()));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * The /bankaccount command can be used to get more advanced control over one's bank account.
     * The type of account can be changed using this command, by supplying the type (either
     * "normal" or "premier") as the first parameter. Furthermore, it's possible to set whether in-
     * game earnings, such as property earnings, should be stored in one's bank account.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player typed after the command.
     * @command /bankaccount [normal|premier|earnings]
     */
    @command("bankaccount")
    public onAccountCommand(playerId, params[]) {
        if (BankAccount(playerId)->inBank() == false) {
            SendClientMessage(playerId, Color::Error, "You need to be in the Planning Department building in Las Venturas in order to");
            SendClientMessage(playerId, Color::Error, "be able to make modifications to your bank account. Find the red $ on the map.");
            return 1;
        }

        new parameterOffset, argument[9];
        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, argument, sizeof(argument));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(argument) + 1);

            // See if any method is listening to the argument given by the player. If so, bail out.
            if (Annotation::ExpandSwitch<AccountCommand>(argument, playerId, params[parameterOffset]) == 1)
                return 1;
        }

        SendClientMessage(playerId, Color::Error, "Las Venturas Playground Central Bank");
        SendClientMessage(playerId, Color::HighlightBlue, "The following options are available to you at the Las Venturas Playground Bank.");
        SendClientMessage(playerId, Color::HighlightBlue, "/bankaccount earnings{FFFFFF} - control whether property earnings will be deposited.");

        return 1;
    }

    /**
     * Premier account holders have the ability to get money they earn from properties automatically
     * deposited in their bank account. This command allows them to toggle that functionality, which
     * is enabled by default, in case they're not interested in it.
     *
     * @param playerId Id of the player who entered this command.
     * @param params Additional parameters as passed on to the command itself.
     * @command /bankaccount earnings [on/off]
     */
    @switch(AccountCommand, "earnings")
    public onAccountEarningsCommand(playerId, params[]) {
        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Automatic depositing of in-game earnings is %s{FFFFFF} for you.",
                (PlayerSettings(playerId)->areEarningsToBankAccountDisabled() ?
                    "{DC143C}disabled" : "{33AA33}enabled"));
            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "Type {40CCFF}/bankaccount earnings [on/off]{FFFFFF} to toggle this feature. It controls whether");
            SendClientMessage(playerId, Color::Information, "money you make in-game, for example from properties, will be deposited in your account.");
            return 1;
        }

        new bool: enableEarningsToBankAccount = Command->booleanParameter(params, 0);
        PlayerSettings(playerId)->setEarningsToBankAccountDisabled(!enableEarningsToBankAccount);

        format(message, sizeof(message), "Automatic depositing of in-game earnings has been %s{33AA33} for you.",
                (PlayerSettings(playerId)->areEarningsToBankAccountDisabled() ?
                    "{DC143C}disabled" : "{33AA33}enabled"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Validates that the player is registered with Las Venturas Playground. If they're not, then
     * we'll show them a message about the bank system not being available to them until they have.
     *
     * @param playerId Id of the player to check registration status of.
     * @return boolean Whether this player is registered with the server or not.
     */
    private bool: validateRegistrationStatus(playerId) {
        if (Player(playerId)->isRegistered() == true)
            return true;

        SendClientMessage(playerId, Color::Error, "Sorry, only registered players can have a bank account!");
        SendClientMessage(playerId, Color::Information, "* Register now on {44CCFF}www.sa-mp.nl{FFFFFF}");

        return false;
    }
};
