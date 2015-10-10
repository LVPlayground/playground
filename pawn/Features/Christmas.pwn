// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Christmas-themed decoration objects are placed throughout Las Venturas; they include a tree
 * near The Ship and a few themed vehicles.
 * 
 * @feature Christmas decorations
 * @category Christmas
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
#if Feature::EnableChristmasDecorations == 1
    #include "Features/Christmas/ChristmasDecorations.pwn"
#endif

/**
 * Gift Hunting is a Christmas-themed minigame. In a nutshell, a present is dropped somewhere in
 * Las Venturas; when a player picks it up, he receives a random gift, such as a jetpack,
 * limited invincibility, or a minigun.
 *
 * @feature Gift Hunting
 * @category Christmas
 * @author Manuele "Kase" Macchia <kaseify@gmail.com>
 */
#if Feature::EnableGiftHunting == 1
    #include "Features/Christmas/GiftHunting.pwn"
#endif
