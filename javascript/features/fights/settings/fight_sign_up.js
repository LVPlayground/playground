// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Private symbol ensuring that the FightSignUp constructor won't be used.
const PrivateSymbol = Symbol('Please use the static methods.');

// Represents the way players should be able to sign up to a particular fight.
class FightSignUp {
    // Sign-up sequence where a personal invitation will be send to |player|. They are the only
    // person that will be allowed to join this fight. The |expireTime| indicates after how many
    // seconds the invitation should be dropped, because the |player| is unresponsive.
    static createInvitationForPlayer(player, expireTime) {
        return new FightSignUp(
            PrivateSymbol, FightSignUp.TYPE_INVITE_PLAYER, expireTime, { player });
    }

    // Sign-up sequence where a public challenge announcement will be shared. Any player on the
    // server is able to accept the challenge, and join in the fight. The |expireTime| indicates
    // after how many seconds the challenge should be dropped, because nobody dares to fight.
    static createPublicChallenge(expireTime) {
        return new FightSignUp(
            PrivateSymbol, FightSignUp.TYPE_PUBLIC_CHALLENGE, expireTime);
    }

    // Sign-up sequence where a public announcement will be made, given a particular name and
    // command. Players will have to type the command in order to join in the fight. The
    // |expireTime| indicates after how many seconds sign-ups for the fight should be closed.
    static createPublicAnnouncement(name, command, expireTime) {
        return new FightSignUp(
            PrivateSymbol, FightSignUp.TYPE_PUBLIC_ANNOUNCE, expireTime, { name, command });
    }

    // ---------------------------------------------------------------------------------------------

    constructor(privateSymbol, type, expireTime, { player, name, command } = {}) {
        if (privateSymbol !== PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.type_ = type;
        this.expireTime_ = expireTime;

        this.player_ = player || null;
        this.name_ = name || null;
        this.command_ = command || null;

        // Freeze and seal this object to prevent any modifications from being made.
        Object.freeze(this);
        Object.seal(this);
    }

    // Returns whether this sign-up sequence represents a personal invitation.
    isPlayerInvitation() { return this.type_ === FightSignUp.TYPE_INVITE_PLAYER; }

    // Returns whether this sign-up sequence represents a public challenge.
    isPublicChallenge() { return this.type_ === FightSignUp.TYPE_PUBLIC_CHALLENGE; }

    // Returns whether this sign-up sequence represents a public announcement.
    isPublicAnnouncement() { return this.type_ === FightSignUp.TYPE_PUBLIC_ANNOUNCE; }

    // Gets the type of sign-up sequence that should be applied to the fight.
    get type() { return this.type_; }

    // Gets the player for whom the invitation should be send. May be NULL.
    get player() { return this.player_; }

    // Gets the name of the fight that should be included in the announcement. May be NULL.
    get name() { return this.name_; }

    // Gets the command that player have to execute in order to join the fight. May be NULL.
    get command() { return this.command_; }
}

// The two different kinds of sign-up sequences that fights can have.
FightSignUp.TYPE_INVITE_PLAYER = 0;
FightSignUp.TYPE_PUBLIC_CHALLENGE = 1;
FightSignUp.TYPE_PUBLIC_ANNOUNCE = 2;

export default FightSignUp;
