// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Initial delay before the community contribution collections will begin. This gives the full
// gamemode some time to set everything up, before blasting players with tax.. uh.. gifts.
export const kInitialCollectionDelayMs = 2 * 60 * 1000;  // two minutes

// Minimum and maximum collection cycle tmies
const kMinimumCycleIntervalSec = 5;
const kMaximumCycleIntervalSec = 1800;

// List of organisation names to which a player can make community contributions.
const kOrganisationNames = [
    'Harry Plums Wholesale Fruit',
    'Palomino Creek Diner',
    'Sindacco Abattoir',
    'Fud\'s Brazilian Waxing',
    'Live Nude Girls Girls Girls',
    'Nude & XXX Shop',
    'The Pig Pen',
    'The Pole Position Club',
    'Tiki Theater',
    'Juank Air',
    'Pecker\'s Feed & Seed',
    'Pet Grooming',
    'Fifth Ave Antiques',
    'Autobahn',
    'Big Mike\'s',
    'Dam Camper RV Park',
    'Eightball\'s Autoyard',
    'Michelle\'s Auto Repair',
    'Wheel Arch Angels',
    'Coutt and Schutz',
    'Shody Used Autos',
    'Larellas Bakery',
    'Palomino Creek Bank',
    'Attica Bar',
    'La Cucaracha Bar & Seafood',
    'Lil\' Probe Inn',
    'The Welcome Pump',
    'Nelli Nelle School of Beauty',
    'Wu Zi Mu\'s Betting Shop',
    'Come-A-Lot Casino',
    'The Emerald Isle',
    'Easter Bay Chemicals',
    'Homies Sharp',
    'Redwood Tobacco',
    'Monsiuer Trousers',
    'Son of a Beach Clothing',
    'Gaydar Station',
    'The Pleasure Domes Club',
    'Gangsta Bail Bonds',
    'San Andreas Federal Mint',
    'Cluckin\' Bell',
    'El Senior Taco',
    'Muerto-Mex',
    'The Smokin\' Beef Grill',
    'Discount Furniture',
    'Powertool Paradise',
    'Family Medical Clinic',
    'Biffin Bridge Hotel',
    'U Get Inn Motel',
    'The Bog Standard',
    'Tee Pee Motel',
    'Angel Pine Junkyard',
    'True Grime Street Cleaners',
    'SpandEx',
    'Master Sounds 98.3',
    'Radio Los Santos',
    'West Coast Talk Radio',
    'Chuff Security',
    'Avispa Country Club',
    'Bait Shop',
    'The Bowled Spot',
    'Blackfield Stadium',
    'Los Santos Forum',
    'Lolita\'s Market',
    'Ideal Homies Store',
    'Hemlock Tattoo',
    'Movie Stars Homes Tour',
    'Bikini Line Coach Company',
    'Canny Bus Group',
    'Brown Streak Railroad',
    'Abstract Grooves',
    'Gelatto Splatto',
    'Iglesia Pentecostes',
    'Piece of Peace',
    'The Brown Embassy',
    'Ammu-Nation',
    'Erotic Wedding Chapel',
    'Eternal Flame Wedding Chapel',
    'Las Venturas Wedding Chapel',
    'Welding & Weddings',
];

// Implements people's involuntary community contributions.
export class FinancialCommunityContribution {
    regulator_ = null;
    settings_ = null;

    disposed_ = null;

    constructor(regulator, settings) {
        this.regulator_ = regulator;
        this.settings_ = settings;

        this.disposed_ = false;
    }

    // Spins until the community contribution system has been disposed of. The interval can be
    // configured by Management members through the `/lvp settings` command.
    async collect() {
        await wait(kInitialCollectionDelayMs);

        while (!this.disposed_) {
            for (const player of server.playerManager) {
                if (player.isNonPlayerCharacter())
                    continue;

                this.collectContributionForPlayer(player);
            }

            await wait(this.getCollectionDelaySec() * 1000);
        }
    }

    // Collects the community contribution from |player| and lets them know about their entirely
    // voluntary donation. This depends on the player's condition and status.
    collectContributionForPlayer(player) {
        let collectionBase = null;
        let collectionPercentage = null;

        const playerWealth = this.regulator_.getPlayerCashAmount(player);

        // Determine the minimum wealth level at which the |player| has to start paying tax, and
        // what percentage of tax they have to pay after beyond that.
        if (player.isVip()) {
            collectionBase =
                this.settings_().getValue('financial/community_contribution_vip_base');
            collectionPercentage =
                this.settings_().getValue('financial/community_contribution_vip_pct');
        } else if (player.account.isRegistered()) {
            collectionBase =
                this.settings_().getValue('financial/community_contribution_player_base');
            collectionPercentage =
                this.settings_().getValue('financial/community_contribution_player_pct');
        } else {
            collectionBase =
                this.settings_().getValue('financial/community_contribution_guest_base');
            collectionPercentage =
                this.settings_().getValue('financial/community_contribution_guest_pct');
        }

        // The |contributionBase| will be ignored, but every penny beyond that will be taxed at
        // the configured percentage. This must yield a positive contribution amount.
        const contribution =
            Math.floor((playerWealth - collectionBase) * (collectionPercentage / 100));

        if (contribution <= 0)
            return;

        const reason = kOrganisationNames[Math.floor(Math.random() * kOrganisationNames.length)];

        player.sendMessage(Message.FINANCE_CONTRIBUTION_PAID, contribution, reason);
        player.sendMessage(Message.FINANCE_CONTRIBUTION_WHY);

        this.regulator_.setPlayerCashAmount(player, playerWealth - contribution);
    }

    // Returns the configured collection delay in seconds. This method will clamp the delay to a
    // valid range of [5, 1800] seconds, to avoid crazy values.
    getCollectionDelaySec() {
        const configuredDelay =
            this.settings_().getValue('financial/community_contribution_cycle_sec');
        
        if (configuredDelay < kMinimumCycleIntervalSec)
            return kMinimumCycleIntervalSec;
        if (configuredDelay > kMaximumCycleIntervalSec)
            return kMaximumCycleIntervalSec;
        
        return configuredDelay;
    }

    dispose() {
        this.disposed_ = true;
    }
}
