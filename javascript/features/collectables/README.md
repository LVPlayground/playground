# Collectables
There are various _things_ that can be collected on Las Venturas Playground, in a variety of ways,
all of which are implemented through this feature.

Collectables can be collected in multiple _rounds_: this enables players to restart again once they
have found them all, without affecting the benefits granted by locating them in the first place, nor
the achievements they've earned as part of this.

## Series: Achievements
Players can earn achievements by proving themselves in a variety of ways on Las Venturas Playground,
from excessive killing sprees to quick calculations and shooting explosive barrels. The actual
achievements are defined in [achievements.js](achievements.js), and are granted by code throughout
our system.

The following achievements are available on Las Venturas Playground. It's an evolving list, and some
of the achievements have benefits associated with them as well.

Achievement       | What                           | Benefit
------------------|--------------------------------|-------------------------
Tag               | Tag 10 Spray Tags              | Unlocks `/pre` and `/sul` to spawn vehicles.
Back to Back      | Tag 40 Spray Tags              | 
Heaven Spot       | Tag 90 Spray Tags              | Unlocks use of the Bomb Shop
Graffiti Angel    | Tag all Spray Tags             | Unlocks `/nrg` and `/inf` to spawn vehicles.
Firebug           | Explode 10 Red Barrels         | Unlocks `/ele` and `/tur` to spawn vehicles.
Arsonist          | Explode 40 Red Barrels         | Unlocks the _vehicle colour_ key shortcut.
Incendiarist      | Explode 90 Red Barrels         |
Jomeri's Syndrome | Explode all Red Barrels        | Unlocks the _vehicle jump_ key shortcut.
Nimble Critter    | Win 10 reaction tests          |
Quick Addict      | Win 100 reaction tests         | Unlocks the _vehicle nitro_ key shortcut.
Electrolyte       | Win 1,000 reaction tests       |
The Streak        | Win 10 reaction tests in a row |
keybind.cs        | Win a reaction test in <2s     |
Blackbeard        | Collect 10 Treasures           |
Jack Sparrow      | Collect all Treasures          | Unlocks the _vehicle gravity_ key shortcut.

Beginning another round of earning the achievements _will not_ reset the benefits. Once granted, you
will keep them indefinitely.

## Series: Red Barrels
Red Barrels have appeared all around San Andreas, and we need _your_ help in removing them to
avoid any incidents. This is a minigame where players have to find all the explosive barrels
scattered throughout the world, and shoot them once to get rid of them.

As of right now, we have placed 100 red barrels on the Las Venturas islands. In the future we plan
to place another 100 in the San Fierro region, and 100 more in the Los Santos region, with different
colours of barrels to distinguish them as separate games.

Technically, a player object will be created for each of the barrels that the player has not yet
shot. We listen for shots on these objects using the `OnPlayerShootDynamicObject` callback, and,
when received, it will be marked as _found_, and stored as such in the database.

This game was originally proposed by [Jay](https://forum.sa-mp.nl/user-180.html).

## Series: Spray Tags
Spray tags can be found on the walls of Las Venturas, left there by gangs who have moved on from
our server many years ago. Your help is required in bringing them back up-to-date.

There are a hundred spray tags in total, which can be collected by spraying the Spray Can weapon for
at least two seconds on one of the tags. Collected tags change colour, making them visually distinct
to emphasise that you've already collected it.

Technically, we use `sprayTagOnKeyStateChange` to determine whether the player's been firing their
spray can for at least two seconds. If so, we check if there are any nearby spray tags that they're
aiming at, and mark them as collected when successful.

This game, also, was originally introduced by [Jay](https://forum.sa-mp.nl/user-180.html).

## Series: Treasures
Fifty books are located all over Red County, Flint County and Whetstone, each of which unlocks a
hint that will help you find a treasure—a different hint for each player!

There are fifty books, and fifty treasures to be found. They're implemented as objects surrounded by
an area, because SA-MP does not support per-player pickups, which would lead to confusing issues.
Upon entering the area, the collectable will count as having been collected.

Hints work a little bit different for this series: until the player has collected all the books, no
hints can be purchased for finding the actual treasures.

This game was proposed by [Sophia_Naz](https://forum.sa-mp.nl/user-19713.html).

## Visualizing the collectables
Management members have the ability to enable the `collectable_map_icons_display` setting in the
`Playground` group via `/lvp settings`. This will create map icons for all of the collectables, with
graphics appropriate for the kind of collectable. There deliberately is no mechanism for displaying
positions of the collectables _you have not yet collected_, as that would not be fair.
