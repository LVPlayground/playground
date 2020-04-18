// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Parser to split up the IRC MODE command in a sequence of individual changes. The flexibility
// offered by the command's syntax makes it undesirable to do this in multiple places.
export class ModeParser {
    // The actions that the parser can be in whilst parsing a MODE command.
    static kActionUndefined = 0;
    static kActionSet = 1;
    static kActionUnset = 2;

    // Types of modes that will be recognised by the mode parser.
    static kModeWithParameter = 0;
    static kModeWithParameterWhenSet = 1;
    static kModeWithoutParameter = 2;

    channelModes_ = null;

    // Gets the modes that are known to the mode parser.
    get channelModes() { return this.channelModes_; }

    constructor() {
        this.channelModes_ = new Map();
    }

    // Parses the given |message|, which must be a MODE command. Returned is a structure in the
    // following format:
    //
    // {
    //   "set": [
    //     { "flag": "R" },
    //     { "flag": "a", "param": "nickname "}
    //   ],
    //   "unset": [
    //     { "flag": "k" }
    //   ]
    // }
    //
    // Parsing and available flags depend on the type of parsing that has to be done, because
    // the modes and their arguments are different for users and channels. This can be derived from
    // the given |message|.
    parse(message) {
        if (message.command !== 'MODE')
            throw new Error('Only MODE command can be parsed.');

        if (message.params.length < 2)
            throw new Error('Parsing the MODE command requires at least two parameters.');

        const target = message.params[0];
        const result = {
            set: [],
            unset: []
        };

        let params = message.params.slice(1);

        // This outer loop should only catch actually flag updates, not the parameters that follow
        // after. Per RFC 8212 it's valid for multiple flag blocks to appear, even though most
        // popular clients (including mIRC) do not seem to support this.
        while (params.length > 0) {
            let action = ModeParser.kActionUndefined;
            let type, param;

            for (const flag of [...params.shift()]) {
                if (['+', '-'].includes(flag)) {
                    action = flag === '-' ? ModeParser.kActionUnset
                                          : ModeParser.kActionSet;

                    continue;
                }

                type = this.channelModes_.get(flag);
                if (type === undefined)
                    throw new Error('Unrecognized flag in MODE command: ' + flag);

                param = null;

                switch (type) {
                    case ModeParser.kModeWithParameterWhenSet:
                        if (action !== ModeParser.kActionSet)
                            break;
                        
                        // deliberate fall-through

                    case ModeParser.kModeWithParameter:
                        if (!params.length)
                            throw new Error('Invalid MODE command (missing parameter): ' + message);

                        param = params.shift();
                        break;
                }

                if (action === ModeParser.kActionSet)
                    result.set.push({ flag, param });
                else
                    result.unset.push({ flag, param });
            }
        }

        return result;
    }

    // Sets the channel prefixes for the current network when given by the RPL_ISUPPORT message,
    // which tells us about the user statuses people are able to have in a channel.
    setChannelPrefixes(prefixes) {
        const divider = prefixes.indexOf(')');
        if (divider === -1 || prefixes.length != 2 * divider)
            throw new Error('Invalid PREFIX syntax found: ' + prefixes);

        this.setModesWithType(prefixes.substring(1, divider), ModeParser.kModeWithParameter);
    }

    // Sets the channel modes for the current network. This comes in four groups:
    //
    //   (a) Modes that always have a user as a parameter,
    //   (b) Modes that always have a parameter,
    //   (c) Modes that have a parameter when being set,
    //   (d) Modes that never have a parameter.
    //
    // We treat (a) and (b) as the same in our implementation, as no validation will be done. The
    // modes will be stored in the local |channelModes_| member.
    setChannelModes(modes) {
        const groups = modes.split(',');
        if (groups.length != 4)
            throw new Error('Invalid CHANMODES parameter received: ' + modes);
        
        this.setModesWithType(groups[0], ModeParser.kModeWithParameter);
        this.setModesWithType(groups[1], ModeParser.kModeWithParameter);
        this.setModesWithType(groups[2], ModeParser.kModeWithParameterWhenSet);
        this.setModesWithType(groups[3], ModeParser.kModeWithoutParameter);
    }

    // Sets the |modes| to the given |type|. Only to be used for internal calls.
    setModesWithType(modes, type) {
        for (const mode of [...modes]) {
            if (this.channelModes_.has(mode))
                throw new Error(`The mode "${mode}" has already been registered.`);
            
            this.channelModes_.set(mode, type);
        }
    }
}
