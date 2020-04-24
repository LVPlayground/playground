// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// When calling EchoMessage with a new tag, be sure to add it to //data/irc_messages.json. The
// |format| required in EchoMessage follows the following syntax:
//
//   d  - Integer
//   f  - Floating point (decimal) number
//   s  - Single word
//   z  - Multiple words
//
// This is orthogonal to the formatting syntax in //data/irc_messages.json, which follows the
// normal JavaScript syntax. Sorry :).

// Provided by the PlaygroundJS plugin.
native EchoMessage(tag[], format[], message[]);
