// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the source of a message, which could either be a user or a server. Some messages,
// like PING, do not have a source at all, and cannot be represented by this class.
//
// The source is standardized as the message prefix, following this ABNF syntax:
//   prefix     =  servername / ( nickname [ [ "!" user ] "@" host ] )
//
//   servername =  hostname
//   nickname   =  ( letter / special ) *8( letter / digit / special / "-" )
//   user       =  1*( %x01-09 / %x0B-0C / %x0E-1F / %x21-3F / %x41-FF )
//   host       =  hostname / hostaddr
//
// For compatibility purposes, only the `prefix` syntax will be strongly considered with the given
// delimiters, other syntaxes will be more loosly implemented.
export class MessageSource {
    nickname_ = null;
    username_ = null;
    hostname_ = null;

    is_server_ = false;
    is_user_ = false;

    // Gets the nickname, if any, associated with this source.
    get nickname() { return this.nickname_; }

    // Gets the username, if any, associated with this source.
    get username() { return this.username_; }

    // Gets the hostname, if any, associated with this source.
    get hostname() { return this.hostname_; }

    // Returns whether this source represents a server.
    isServer() { return this.is_server_; }

    // Returns whether this source represents a user.
    isUser() { return this.is_user_; }

    // Parses the |source| string into a MessageSource structure. An exception will be thrown
    // on invalid formats.
    constructor(source) {
        if (typeof source !== 'string' || !source.length)
            throw new Error('Invalid source given: ' + source);

        const dotPosition = source.indexOf('.');
        const userPosition = source.indexOf('!');
        const hostPosition = source.indexOf('@');

        if (userPosition !== -1) {
            this.nickname_ = source.substring(0, userPosition);
            this.username_ = source.substring(userPosition + 1, hostPosition);
            this.hostname_ = source.substring(hostPosition + 1);

            this.is_user_ = true;
            return;
        }

        if (hostPosition !== -1) {
            this.nickname_ = source.substring(0, hostPosition);
            this.hostname_ = source.substring(hostPosition + 1);

            this.is_user_ = true;
            return;
        }

        if (dotPosition !== -1) {
            this.hostname_ = source;

            this.is_server_ = true;
            return;
        }

        this.nickname_ = source;
        this.is_user_ = true;
    }
}
