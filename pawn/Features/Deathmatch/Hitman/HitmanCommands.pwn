// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The HitmanCommands class combines all the commands for the use of placing money on players'
 * heads and requesting this value on somebody's head (if any).
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class HitmanCommands {
    /**
     * Players can request the current bounties by using /bounties.
     * 
     * @param playerId Id of the player who typed the command.
     * @command /bounties
     */
    @command("bounties")
    public onBountiesCommand(playerId, params[]) {
        SendClientMessage(playerId, Color::Information, "Current bounties:");

        // We are following the same visual style here as with the /gangs command (GangCommands.pwn)
        new message[128], displayed = 0;
        for (new player = 0; player <= PlayerManager->highestPlayerId(); player++) {
            if (Player(player)->isConnected() == true && Player(player)->isNonPlayerCharacter() == false
                && HitmanTracker(player)->playerBounty() > 0) {
                format(message, sizeof(message), " {CCCCCC}(%d) {%06x}%s {FFFFFF}- $%s", player,
                    ColorManager->playerColor(player) >>> 8, Player(player)->nicknameString(),
                    formatPrice(HitmanTracker(player)->playerBounty()));

                SendClientMessage(playerId, Color::Information, message);
                ++displayed;
            }
        }

        if (displayed == 0)
            SendClientMessage(playerId, Color::Information, " There aren't any bounties at the moment..");

        return 1;
        #pragma unused params
    }

    /**
     * To put a bounty on someone's head, players can use the /hitman command. After initiation, we
     * do several checks in order to avoid misuse/abuse. At the end we place the bounty, and inform
     * the public and the victim about it.
     * 
     * @param playerId Id of the player who typed the command.
     * @param player Id or name of the victim receiving the bounty.
     * @param amount The amount of money that needs to be placed on someone's head.
     * @command /hitman [player] [amount]
     */
    @command("hitman")
    public onHitmanCommand(playerId, params[]) {
        new bountyAmount = Command->integerParameter(params, 1);
        if (Command->parameterCount(params) != 2 || bountyAmount < 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /hitman [player] [amount]");
            return 1;
        }

        new victimId = Command->playerParameter(params, 0, playerId);
        if (victimId == Player::InvalidId)
            return 1;

        if (Player(victimId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "You can't place a bounty on a NPC!");
            return 1;
        }

        if (Time->currentTime() - HitmanTracker(playerId)->lastHitmanUsageTime() < 15
            && Player(playerId)->isModerator() == false) {
            SendClientMessage(playerId, Color::Error, "You can only place a bounty every 15 seconds.");
            return 1;
        }

        new maxBountyAmount, message[256];
        if (HitmanTracker(victimId)->playerBounty() + bountyAmount > HitmanTracker::MaximumBountyAmount) {
            maxBountyAmount = HitmanTracker::MaximumBountyAmount - HitmanTracker(victimId)->playerBounty();
            format(message, sizeof(message), "The maximum amount you can place on %s (%d) is $%s.",
                Player(victimId)->nicknameString(), victimId, formatPrice(maxBountyAmount));
            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        if (bountyAmount > GetPlayerMoney(playerId)) {
            SendClientMessage(playerId, Color::Error, "You don't have enough money!");
            return 1;
        }

        // Update the victim's bounty, retrieve money from player and update his hitman usage timestamp.
        HitmanTracker(victimId)->setBounty(HitmanTracker(victimId)->playerBounty() + bountyAmount);
        GivePlayerMoney(playerId, -bountyAmount);
        HitmanTracker(playerId)->lastHitmanUsageTime() = Time->currentTime();

        format(message, sizeof(message),
            "* %s has had a {A9C4E4}$%s bounty {CCCCCC}put on his head from %s {A9C4E4}(total: $%s){CCCCCC}.",
            Player(victimId)->nicknameString(), formatPrice(bountyAmount), Player(playerId)->nicknameString(),
            formatPrice(HitmanTracker(victimId)->playerBounty()));
        SendClientMessageToAllEx(Color::ConnectionMessage, message);

        format(message, sizeof(message), "* You have had a $%s bounty put on you from [%d] %s.",
            formatPrice(bountyAmount), playerId, Player(playerId)->nicknameString());
        SendClientMessage(victimId, Color::Warning, message);

        return 1;
    }
};
