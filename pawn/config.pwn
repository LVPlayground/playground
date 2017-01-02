// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Determining the version number may be done using some basic mathematics. The major version will
 * increment by one for each full period of eight weeks since July 13, 2012. The minor version will
 * equal the remainder, so anything between zero and seven weeks. The revision will be incremented
 * by one for each release, but will be re-set when either the major or minor version changes.
 *
 * An online tool to view the current major and minor versions is available here:
 * http://development.sa-mp.nl/version.php
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Version {
    public const Major = 31;
    public const Minor = 7;
};

/**
 * Various debugging features can be toggled on or off by changing the defines in this class. Please
 * be sure to clearly document what toggling a constant will have for an effect on the gamemode.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Debug {
    // Timer debugging is useful to track down performance issues or crashes. It will announce
    // timers before they run, and give a brief overview of their run-time after they're done.
    public const EnableTimerDebugging = 0;

    // Enable visual verbosity, i.e. map icons for spawn positions, properties and cash points.
    public const EnableVisualVerbosity = 0;

    // Logging MySQL queries can often be useful for debugging purposes. It's possible to choose
    // whether to enable logging these queries or not.
    public const EnableDatabaseLogging = 0;
};

// Set this to 1 if you'd like to build Las Venturas Playground in release mode (lead devs only).
#define BuildGamemodeInReleaseMode 0

// Try to include the private release configuration file. This are necessary to authenticate with
// the MySQL database and distribute echo to the right location, among other things.
#tryinclude "config-release.pwn"

// In case no database credentials have been supplied by earlier, private configuration files yet,
// create the default settings. The same goes for the echo settings.
#if !defined DatabaseCredentialsSupplied
    #define PasswordSalt        "^&lvp__@"
    #define BETA_TEST           1
#endif

#if !defined EchoSettingsSupplied
    #define EchoHostname        "127.0.0.1"
    #define EchoPort            26669
#endif

/**
 * Any compile-time gamemode configuration should be added as a public constant to this class. They
 * may be referred to from anywhere, and should have no dynamic behavior at all. Toggling the
 * availability of individual features should be done in the Feature class further down.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Configuration {
    // What is the salt used to hash passwords more securely?
    public const PasswordSalt = PasswordSalt;

    // What is the hostname echo information should be send to?
    public const EchoHostname = EchoHostname;

    // At which port is the echo server listening?
    public const EchoPort = EchoPort;
};

/**
 * Toggling the availability of certain features should be done by changing their values in this
 * class. Please follow existing conventions and add features based on their alphabetical order.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Feature {
    /** **************************************************************************************** **/
    /// Moving stuff to JavaScript defines.

    // Disables the Pawn of everything related to DM fights.
    public const DisableFights = 0;

    // Be able to switch it off in preperation of the rewrite of it in javascript
    public const DisableKilltime = 0;

    /** **************************************************************************************** **/
    /// Christmas

    // Christmas-themed decoration objects are placed throughout Las Venturas; they include a tree
    // near The Ship and a few vehicles.
    public const EnableChristmasDecorations = 0;

    // Grants temporary VIP rights to all registered players during the festive period. The rights
    // will not persist between sessions, and the user should be tempted to donate.
    public const TemporaryVip = 0;

    // A present is dropped somewhere in Las Venturas; when a player picks it up, he receives a 
    // random gift.
    public const EnableGiftHunting = 0;

    /** **************************************************************************************** **/
    /// Minigames

    // The Hay minigame is a very nice-to-have game, but it hogs CPU.
    public const DisableHay = 0;

};
