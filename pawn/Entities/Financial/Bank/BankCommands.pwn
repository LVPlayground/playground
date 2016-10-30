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

        if (this->validatePremiumAccountOrNearCashPoint(playerId) == false)
            return 1; // the player needs to be near an ATM machine to use these commands.

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

        if (this->validatePremiumAccountOrNearCashPoint(playerId) == false)
            return 1; // the player needs to be near an ATM machine to use these commands.

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

        if (this->validatePremiumAccountOrNearCashPoint(playerId) == false)
            return 1; // the player needs to be near an ATM machine to use these commands.

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

        // Premier accounts imply a cost of 10% of whatever amount the player banks. We need to
        // take away the 10 percent here before updating the actual balance.
        if (BankAccount(playerId)->type() == PremierBankAccount) {
            premierCommission = Math->round((BankAccount::PremierDepositTransactionCostPercentage / 100) * depositAmount);
            if ((depositAmount - premierCommission) > BankAccount(playerId)->availableBalance()) {
                premierCommission = Math->round((BankAccount::PremierDepositTransactionCostPercentage / 100) * BankAccount(playerId)->availableBalance());
                depositAmount = BankAccount(playerId)->availableBalance() + premierCommission;
            } else {
                // Correct the requested depositAmount against the available balance on the player's account.
                depositAmount = min(BankAccount(playerId)->availableBalance(), depositAmount);
                premierCommission = Math->round((BankAccount::PremierDepositTransactionCostPercentage / 100) * depositAmount);
            }
        } else
            // Correct the requested depositAmount against the available balance on the player's account.
            depositAmount = min(BankAccount(playerId)->availableBalance(), depositAmount);

        // Instrument how often and how much people deposit money into their account.
        Instrumentation->recordActivity(BankDepositActivity, depositAmount);

        BankAccount(playerId)->setBalance(BankAccount(playerId)->balance() + (depositAmount - premierCommission));
        GivePlayerMoney(playerId, -depositAmount);

        new message[128];
        format(message, sizeof(message), "You have successfully deposited {FFFFFF}$%s{33AA33}. Your new balance is {FFFFFF}$%s{33AA33}.",
            formatPrice(depositAmount), formatPrice(BankAccount(playerId)->balance()));
        SendClientMessage(playerId, Color::Success, message);

        // Inform Premier account holders that ten percent of the total sum has been removed.
        if (BankAccount(playerId)->type() == PremierBankAccount) {
            format(message, sizeof(message), "As usual, {FFFFFF}%.0f%%{33AA33}, or {FFFFFF}$%s{33AA33} has been taken as Premier account commission.",
                BankAccount::PremierDepositTransactionCostPercentage, formatPrice(premierCommission));
            SendClientMessage(playerId, Color::Success, message);
        }

        return 1;
    }

    /**
     * The /account command can be used to get more advanced control over one's bank account. The
     * type of account can be changed using this command, by supplying the type of account (either
     * "normal" or "premier") as the first parameter. Furthermore, it's possible to set whether in-
     * game earnings, such as property earnings, should be stored in one's bank account.
     *
     * @param playerId Id of the player who typed the command.
     * @param params Any further text that the player typed after the command.
     * @command /account [normal|premier|earnings]
     */
    @command("account")
    public onAccountCommand(playerId, params[]) {
        if (BankAccount(playerId)->inBank() == false) {
            SendClientMessage(playerId, Color::Error, "You need to be in the Planning Department building in Las Venturas in order to");
            SendClientMessage(playerId, Color::Error, "be able to make modifications to your bank account. Find the red $ on the map.");
            return 1;
        }

        new parameterOffset, argument[9], message[128];
        if (Command->parameterCount(params) >= 1) {
            Command->stringParameter(params, 0, argument, sizeof(argument));
            parameterOffset = min(strlen(params), Command->startingIndexForParameter(params, 0) + strlen(argument) + 1);

            // See if any method is listening to the argument given by the player. If so, bail out.
            if (Annotation::ExpandSwitch<AccountCommand>(argument, playerId, params[parameterOffset]) == 1)
                return 1;
        }

        // No upgrade or downgrade has been requested, so we can tell them how this command can
        // be used to change their banking experience.
        SendClientMessage(playerId, Color::Error, "Las Venturas Playground Central Bank");

        format(message, sizeof(message), "Welcome to the bank! You currently have a {40CCFF}%s{FFFFFF} account.",
            BankAccount(playerId)->type() == PremierBankAccount ? "Premier" : "normal");
        SendClientMessage(playerId, Color::Information, message);

        // The rest of the messaging depends on what kind of bank account they have.
        if (BankAccount(playerId)->type() == PremierBankAccount) {
            SendClientMessage(playerId, Color::HighlightBlue, "The following options are available to you at the Las Venturas Playground Bank.");
            SendClientMessage(playerId, Color::HighlightBlue, "/account earnings{FFFFFF} - control whether property earnings will be deposited.");
            SendClientMessage(playerId, Color::HighlightBlue, "/account normal{FFFFFF} - downgrade your account back to a Normal account.");
        } else {
            SendClientMessage(playerId, Color::Information, "Please type {40CCFF}/account premier{FFFFFF} to upgrade to a Premier account. Your new limit would be");
            SendClientMessage(playerId, Color::Information, "500 million dollar and you wouldn't need cash points anymore. However, the bank will");
            SendClientMessage(playerId, Color::Information, "take {40CCFF}10%%{FFFFFF} of all your deposits, it'll cost you {40CCFF}25 million{FFFFFF} dollar and you need to");
            SendClientMessage(playerId, Color::Information, "have been in-game for a hundred hours or more.");
        }

        return 1;
    }

    /**
     * Players have the ability to upgrade their account to a Premier account when they match certain
     * guidelines. This will give them an increased bank limit and more options.
     *
     * @param playerId Id of the player who'd like to upgrade to a Premier account.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /account premier
     */
    @switch(AccountCommand, "premier")
    public onAccountPremierCommand(playerId, params[]) {
        if (BankAccount(playerId)->type() == PremierBankAccount) {
            SendClientMessage(playerId, Color::Error, "Error: You already have a Premier bank account!");
            return 1;
        }

        // The player is requesting their account to be upgraded to a Premier account. This has
        // certain requirements and imposes a one-time cost, which they must be able to meet.
        if (this->isPlayerEligibleForPremierAccount(playerId) == false) {
            SendClientMessage(playerId, Color::Error, "You are currently not eligible for an upgrade to a Premier account.");
            SendClientMessage(playerId, Color::Information, "In order to open a Premier account, you need to have been in-game for over a 100 hours");
            SendClientMessage(playerId, Color::Information, "and have a minimum of 25 million dollars in your bank account.");
            return 1;
        }

        // Open their new bank account. Most of the logic will be done within the BankAccount
        // class, but we still need to charge them for the costs involved.
        BankAccount(playerId)->setBankAccountType(PremierBankAccount);
        BankAccount(playerId)->setBalance(BankAccount(playerId)->balance() - BankAccount::RequiredMoneyForPremierAccountUpgrade);
        PlayerSettings(playerId)->setEarningsToBankAccountDisabled(false);

        SendClientMessage(playerId, Color::Success, "Your Premier account has been opened. Enjoy the ability to use your account everywhere");
        SendClientMessage(playerId, Color::Success, "and property profits being immediately deposited into your account.");

        return 1;
        #pragma unused params
    }

    /**
     * Players with a Premier account also have the ability to downgrade to a normal account. Why?
     * Because not everyone may appreciate that we eat 10% of whatever money they earn.
     *
     * @param playerId Id of the player who'd like to downgrade to a normal account.
     * @param params Any further text that the player passed to the command. Unused.
     * @command /account normal
     */
    @switch(AccountCommand, "normal")
    public onAccountNormalCommand(playerId, params[]) {
        if (BankAccount(playerId)->type() == NormalBankAccount) {
            SendClientMessage(playerId, Color::Error, "Error: You already have a normal bank account!");
            return 1;
        }

        // The player is requesting their account to be downgraded to a normal account. This has
        // no requirements, but they will lose their investment to upgrade to a Premier account.
        // Why would anyone do this? Maybe because they think the involved costs are too high?
        BankAccount(playerId)->setBankAccountType(NormalBankAccount);

        SendClientMessage(playerId, Color::Success, "Your account has been downgraded to a normal account. Your funds have been");
        SendClientMessage(playerId, Color::Success, "trimmed, and you need to use cash points again.. Congratulations?");

        return 1;
        #pragma unused params
    }

    /**
     * Premier account holders have the ability to get money they earn from properties automatically
     * deposited in their bank account. This command allows them to toggle that functionality, which
     * is enabled by default, in case they're not interested in it.
     *
     * @param playerId Id of the player who entered this command.
     * @param params Additional parameters as passed on to the command itself.
     * @command /account earnings [on/off]
     */
    @switch(AccountCommand, "earnings")
    public onAccountEarningsCommand(playerId, params[]) {
        if (BankAccount(playerId)->type() != PremierBankAccount) {
            SendClientMessage(playerId, Color::Error, "Error: You need to have a Premier bank account in order to use this feature.");
            return 1;
        }

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Automatic depositoing of in-game earnings is %s{FFFFFF} for you.",
                (PlayerSettings(playerId)->areEarningsToBankAccountDisabled() ?
                    "{DC143C}disabled" : "{33AA33}enabled"));
            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "Type {40CCFF}/account earnings [on/off]{FFFFFF} to toggle this feature. It controls whether money");
            SendClientMessage(playerId, Color::Information, "you make in-game, for example from properties, will be deposited in your account.");
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
     * Easily determine whether a player is currently eligible for an upgrade to a Premier account.
     * This has certain requirements, which we may need to check.
     *
     * @param playerId Id of the player to check eligibility of.
     * @return boolean Is this player eligible to upgrade their account?
     */
    private bool: isPlayerEligibleForPremierAccount(playerId) {
        if (BankAccount(playerId)->balance() < BankAccount::RequiredMoneyForPremierAccountUpgrade)
            return false; // not enough money to pay for the upgrade.

        if (GetPlayerIngameTime(playerId) < BankAccount::RequiredHoursForPremierAccountUpgrade * 3600)
            return false; // not enough in-game time.

        return true;
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

    /**
     * Players need to have a Premier account in order to be able to use their bank commands at all
     * times. If they don't, we need to verify that they're in fact in range of a cash point.
     *
     * @param playerId Id of the player to check account availability for.
     * @return boolean Whether the player is good to continue using the bank's commands.
     */
    private bool: validatePremiumAccountOrNearCashPoint(playerId) {
        if (BankAccount(playerId)->type() == PremierBankAccount ||
            CashPointController->isPlayerInRangeOfCashPoint(playerId) == true) {
            return true;
        }

        SendClientMessage(playerId, Color::Error, "Sorry, unless you've got a {FFFFFF}Premier{DC143C} account you need to be at a cash");
        SendClientMessage(playerId, Color::Error, "point to use this command. Your account can be upgraded at the LV Main Bank.");
        SendClientMessage(playerId, Color::Error, "You can use /taxi 10 on foot or /tow 10 in a vehicle to teleport there.");

        return false;
    }
};
