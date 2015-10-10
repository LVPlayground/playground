// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The AmmunationDialog class handles the weapon dialogs of each Ammunation shop. The weapon buying
 * process consists of several dialogs.
 *
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
class AmmunationDialog {
    // This dialog lets you choose among all types of weapon.
    public const WeaponTypeSelectionDialog = @counter(OnDialogResponse);

    // This dialog lets you choose which weapon to buy.
    public const WeaponSelectionDialog = @counter(OnDialogResponse);

    // This dialog lets you choose among several types of persistence type for the armour.
    public const ArmourTypeSelectionDialog = @counter(OnDialogResponse);

    // This dialog lets you choose how many ammunitions to buy along with your weapon.
    public const AmmunitionAmountSelectionDialog = @counter(OnDialogResponse);

    // After closing the ammunation menu, how many seconds should it be ignored?
    const ClosedDialogIgnoreSeconds = 1;

    // Is the player already through the weapon buying process?
    new bool: m_isPlayerThroughBuyingProcess[MAX_PLAYERS];

    /**
     * This array stores the latest Ammunation shop ID used by each player. We need this information
     * to display the correct available weapons list in the Ammunation dialogs throughout the whole
     * weapon buying process.
     */
    new m_latestAmmunationShopUsed[MAX_PLAYERS];

    /**
     * Any player who is attempting to purchase a weapon will have to go through several steps. This 
     * array stores the weapon persistence type of the weapon the player is buying. We'll need this 
     * information to hand out the correct kind of weapon at the end of the process.
     */
    new WeaponPersistenceType: m_pendingPurchaseWeaponType[MAX_PLAYERS];

    // This array stores the GTA Id of the weapon the player is buying.
    new m_pendingPurchaseWeaponId[MAX_PLAYERS];

    // What is the time (in seconds) that the player last closed a menu?
    new m_lastDialogCloseTime[MAX_PLAYERS];

    /**
     * Reset a player variable which controls whether the Ammunation dialogs should be displayed for the 
     * player or not. This is called when a player joins the server.
     *
     * @param playerId Id of the player who just joined the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_isPlayerThroughBuyingProcess[playerId] = false;
    }

    /**
     * Show the player the first step of the weapon buying process. Here, the player gets to choose
     * between two kinds of weapon persistence types; regular weapons, lost upon death, and
     * spawn-weapons, given back each time the player spawns. He can also choose to buy armour.
     *
     * If the Ammunation the player is in only offers one kind of weapon persistence type,
     * redirect the player to the second step of the process.
     * 
     * @param playerId Player Id we're showing the dialog to.
     * @param shopId Ammunation shop Id the player's in.
     */
    public showWeaponTypeSelectionDialogToPlayer(playerId, shopId) {
        new selection[90];

        if (!Ammunation(shopId)->availableWeaponCount())
            this->showWeaponSelectionDialogToPlayer(playerId, SingleSessionWeapon);
        else if (!Ammunation(shopId)->availableSpawnWeaponCount())
            this->showWeaponSelectionDialogToPlayer(playerId, SingleLifeWeapon);
        else {
            format(selection, sizeof(selection), "Regular weapons {96BCE8}(%d items)\n\r{FFFFFF}Spawn weapons {96BCE8}(%d items)\n\rArmour",
                Ammunation(shopId)->availableWeaponCount(), Ammunation(shopId)->availableSpawnWeaponCount());
            ShowPlayerDialog(playerId, AmmunationDialog::WeaponTypeSelectionDialog, DIALOG_STYLE_LIST, "Choose your gear!", selection, "Select", "Cancel");
        }

        m_latestAmmunationShopUsed[playerId] = shopId;
        m_isPlayerThroughBuyingProcess[playerId] = true;
    }

    /**
     * Once the player has chosen a weapon persistence type, display the related dialog.
     * 
     * @param playerId Id of the player the dialog is shown to.
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     */
    @switch(OnDialogResponse, AmmunationDialog::WeaponTypeSelectionDialog)
    public onWeaponTypeSelectionDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
        if (button == LeftButton) { // "Select"
            switch(listItem) {
                case 0: { // Regular weapons
                    this->showWeaponSelectionDialogToPlayer(playerId, SingleLifeWeapon);
                }
                case 1: { // Spawn-weapons
                    this->showWeaponSelectionDialogToPlayer(playerId, SingleSessionWeapon);
                }
                case 2: { // Armour
                    this->showArmourTypeSelectionDialogToPlayer(playerId);
                }
            }
        }

        else {
            m_isPlayerThroughBuyingProcess[playerId] = false;
            m_lastDialogCloseTime[playerId] = Time->currentTime();
        }

        #pragma unused inputText
        return 1;
    }

    /**
     * Show the player the second step of the weapon buying process. This step consists in choosing
     * a weapon among a list of available gear.
     * 
     * @param playerId Player Id we're showing the dialog to.
     * @param weaponType Weapon persistence type chosen.
     */
    public showWeaponSelectionDialogToPlayer(playerId, WeaponPersistenceType: weaponType) {
        new selection[250], availableWeaponName[20],
            shopId = m_latestAmmunationShopUsed[playerId];

        new availableWeapon;
        for (new weaponIndex; weaponIndex < Ammunation(shopId)->availableWeaponCount(); ++weaponIndex) {
            availableWeapon = Ammunation(shopId)->availableWeapon(weaponIndex);
            if (weaponType == SingleSessionWeapon && !AmmunationWeapon(availableWeapon)->isAvailableAsSpawnWeapon())
                continue;

            AmmunationWeapon(availableWeapon)->getName(availableWeaponName, sizeof(availableWeaponName));

            if (weaponIndex == 0)
                format(selection, sizeof(selection), "%s", availableWeaponName);
            else
                format(selection, sizeof(selection), "%s\n\r%s", selection, availableWeaponName);
        }

        ShowPlayerDialog(playerId, AmmunationDialog::WeaponSelectionDialog, DIALOG_STYLE_LIST, "Choose your gear!", selection, "Select", "Back");

        m_pendingPurchaseWeaponType[playerId] = weaponType;
    }

    /**
     * The player has chosen a weapon to buy; display the third step of the process, which lets him
     * choose how many ammunitions to buy along with his weapon.
     *
     * If it is a melee weapon, directly give it to the player, skipping the third step.
     * 
     * @param playerId Id of the player the dialog is shown to.
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     */
    @switch(OnDialogResponse, AmmunationDialog::WeaponSelectionDialog)
    public onWeaponSelectionDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
        new shopId = m_latestAmmunationShopUsed[playerId], weaponId;

        if (button == LeftButton) { // "Select"
            if (m_pendingPurchaseWeaponType[playerId] == SingleSessionWeapon) {
                new availableSpawnWeapons[AmmunationManager::MaximumWeaponsPerAmmunation];

                Ammunation(shopId)->getAvailableSpawnWeaponList(availableSpawnWeapons, sizeof(availableSpawnWeapons));
                weaponId = availableSpawnWeapons[listItem];
            } else
                weaponId = Ammunation(shopId)->availableWeapon(listItem);

            m_pendingPurchaseWeaponId[playerId] = weaponId;

            if (AmmunationWeapon(weaponId)->isMeleeWeapon()) {
                this->giveWeaponToPlayer(playerId, weaponId, 1);
                this->showWeaponSelectionDialogToPlayer(playerId, m_pendingPurchaseWeaponType[playerId]);
            } else
                this->showAmmunitionAmountSelectionDialog(playerId, weaponId);

        } else if (button == RightButton) // "Back"
            this->showWeaponTypeSelectionDialogToPlayer(playerId, shopId);

        #pragma unused inputText
        return 1;
    }

    /**
     * If the player has chosen to buy armour, show the player the armour type selection dialog.
     * He'll be able to chose between two options: regular single life armour and spawn armour,
     * which is given back to him upon spawn.
     * 
     * @param playerId Id of the player we're shoting the dialog to.
     */
    public showArmourTypeSelectionDialogToPlayer(playerId) {
        ShowPlayerDialog(playerId, AmmunationDialog::ArmourTypeSelectionDialog, DIALOG_STYLE_LIST, "Choose your gear!", "Regular armour\n\rSpawn armour", "Select", "Back");
    }

    /**
     * The player has chosen the of armour he prefers to buy; if he's got enough money, give it to him.
     * 
     * @param playerId Id of the player the dialog is shown to.
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     */
    @switch(OnDialogResponse, AmmunationDialog::ArmourTypeSelectionDialog)
    public onArmourTypeSelectionDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
        new shopId = m_latestAmmunationShopUsed[playerId];

        if (button == LeftButton) { // "Select"
            switch (listItem) {
                case 0: { // Regular armour
                    if (GetPlayerMoney(playerId) < Ammunation(shopId)->armourPrice()) {
                        SendClientMessage(playerId, Color::Red, "* You don't have enough money!");
                        // Now close the dialog as he has no money.
                        m_lastDialogCloseTime[playerId] = Time->currentTime();
                        m_isPlayerThroughBuyingProcess[playerId] = false;
                    }
                    else {
                        SetPlayerArmour(playerId, 100);
                        GivePlayerMoney(playerId, -Ammunation(shopId)->armourPrice());
                        SendClientMessage(playerId, Color::Green, "* You've just bought armour!");
                        this->showWeaponTypeSelectionDialogToPlayer(playerId, shopId);
                    }
                }
                case 1: { // Spawn armour
                    if (GetPlayerMoney(playerId) < Ammunation(shopId)->armourPrice() * AmmunationManager::PriceMultiplier) {
                        SendClientMessage(playerId, Color::Red, "* You don't have enough money!");
                        // Now close the dialog as he has no money.
                        m_lastDialogCloseTime[playerId] = Time->currentTime();
                        m_isPlayerThroughBuyingProcess[playerId] = false;
                        return 1;
                    }

                    if (SpawnWeaponManager(playerId)->giveSpawnArmour()) {
                        SetPlayerArmour(playerId, 100);
                        GivePlayerMoney(playerId, -Ammunation(shopId)->armourPrice() * AmmunationManager::PriceMultiplier);
                        SendClientMessage(playerId, Color::Green, "* You've just bought spawn armour!");
                        this->showWeaponTypeSelectionDialogToPlayer(playerId, shopId);
                    }
                    else {
                        SendClientMessage(playerId, Color::Red, "* You already have spawn armour!");
                        this->showWeaponTypeSelectionDialogToPlayer(playerId, shopId);
                    }
                }
            }
        } else if (button == RightButton) // "Back"
            this->showWeaponTypeSelectionDialogToPlayer(playerId, shopId);

        #pragma unused inputText
        return 1;
    }

    /**
     * Show the player the third and last step of the buying process. It consists in choosing
     * an amount of ammunition to buy along with your weapon among several multipliers; x1, x2,
     * x5, x10, x25, x50 and x100.
     * 
     * @param playerId Id of the player we're showing the dialog to.
     * @param weaponId Id of the weapon the player is buying.
     */
    public showAmmunitionAmountSelectionDialog(playerId, weaponId) {
        new selection[512], weaponLine[64],
            ammunition = AmmunationWeapon(weaponId)->ammunition(),
            basePrice = AmmunationWeapon(weaponId)->basePrice();

        if (m_pendingPurchaseWeaponType[playerId] == SingleSessionWeapon)
            basePrice = basePrice * AmmunationManager::PriceMultiplier;

        new multipliers[] = {1, 2, 5, 10, 25, 50, 100};
        for (new index = 0; index < sizeof(multipliers); ++index) {
            format(weaponLine, sizeof(weaponLine), "{96BCE8}%dx{FFFFFF} (%d rounds): $%s\r\n",
                multipliers[index],
                multipliers[index] * ammunition,
                formatPrice(multipliers[index] * basePrice));
            strcat(selection, weaponLine, sizeof(selection));
        }

        selection[strlen(selection)-2] = 0; // strip the final \r\n.

        ShowPlayerDialog(playerId, AmmunationDialog::AmmunitionAmountSelectionDialog, DIALOG_STYLE_LIST, "Choose your gear!", selection, "Select", "Back");
    }

    /**
     * The player has chosen the amount of ammunition he wishes to buy along with his weapon, which
     * we're going to give him. He'll pay according to the ammunition multiplier he's chosen.
     * 
     * @param playerId Id of the player the dialog is shown to.
     * @param button The button which was clicked, see the DialogButton enumeration.
     * @param listItem Index of the selected item in the list, which starts at zero.
     * @param inputText The text which was inserted, if any.
     */
    @switch(OnDialogResponse, AmmunationDialog::AmmunitionAmountSelectionDialog)
    public onAmmunitionAmountSelectionDialogResponse(playerId, DialogButton: button, listItem, inputText[]) {
        if (button == LeftButton) { // "Select"
            new multiplier;
            switch (listItem) {
                case 0: multiplier = 1; // x1
                case 1: multiplier = 2; // x2
                case 2: multiplier = 5; // x5
                case 3: multiplier = 10; // x10
                case 4: multiplier = 25; // x25
                case 5: multiplier = 50; // x50
                case 6: multiplier = 100; // x100
            }

            this->giveWeaponToPlayer(playerId, m_pendingPurchaseWeaponId[playerId], multiplier);
            this->showWeaponSelectionDialogToPlayer(playerId, m_pendingPurchaseWeaponType[playerId]);
            return 1;
        } else if (button == RightButton) // "Back"
            this->showWeaponSelectionDialogToPlayer(playerId, m_pendingPurchaseWeaponType[playerId]);

        #pragma unused inputText
        return 1;
    }

    /**
     * At the end of the buying process, if the player has got enough money, give him the 
     * correct kind of weapon he bought, along with the specified amount of ammunitions.
     * 
     * @param playerId Id of the buyer.
     * @param weaponId Id of the weapon we're selling.
     * @param ammunitionMultiplier How many rounds should be given along with the weapon?
     */
    public giveWeaponToPlayer(playerId, weaponId, ammunitionMultiplier) {
        new notice[128], weaponName[20];
        AmmunationWeapon(weaponId)->getName(weaponName, sizeof(weaponName));
        switch (m_pendingPurchaseWeaponType[playerId]) {
            case SingleLifeWeapon: {
                if (GetPlayerMoney(playerId) < AmmunationWeapon(weaponId)->basePrice() * ammunitionMultiplier) {
                    SendClientMessage(playerId, Color::Red, "* You don't have enough money!");
                    return;
                }

                GiveWeapon(playerId, weaponId, AmmunationWeapon(weaponId)->ammunition() * ammunitionMultiplier);
                GivePlayerMoney(playerId, AmmunationWeapon(weaponId)->basePrice() * -ammunitionMultiplier);

                format(notice, sizeof(notice), "* You've just bought x%d %s.", ammunitionMultiplier, weaponName);
                SendClientMessage(playerId, Color::Green, notice);
            }
            case SingleSessionWeapon: {
                if (GetPlayerMoney(playerId) < AmmunationWeapon(weaponId)->basePrice() * ammunitionMultiplier * AmmunationManager::PriceMultiplier) {
                    SendClientMessage(playerId, Color::Red, "* You don't have enough money!");
                    return;
                }

                SpawnWeaponManager(playerId)->giveSpawnWeapon(weaponId, ammunitionMultiplier);
                GivePlayerMoney(playerId, AmmunationWeapon(weaponId)->basePrice() * -ammunitionMultiplier * AmmunationManager::PriceMultiplier);
                format(notice, sizeof(notice), "* You've just bought x%d %s as spawn weapon.", ammunitionMultiplier, weaponName);
                SendClientMessage(playerId, Color::Green, notice);
            }
        }
    }

    /**
     * While the player is going through the ammunation buying process they'll stand still in the
     * pickup, meaning that it'll be picked up repeaditly. To avoid opening it multiple times after
     * each other, we check whether they're not still in the process, or stopped it recently.
     *
     * @param playerId Id of the player to check the constraints for.
     * @return boolean Should the dialog be shown at this time?
     */
    public bool: shouldDialogBeOpenedForPlayer(playerId) {
        if (m_isPlayerThroughBuyingProcess[playerId])
            return false;

        if (m_lastDialogCloseTime[playerId] == 0)
            return true;

        return (Time->currentTime() - m_lastDialogCloseTime[playerId]) > ClosedDialogIgnoreSeconds;
    }
}
