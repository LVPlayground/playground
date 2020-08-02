// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Encapsulates the information known about a channel to which messages can be send.
// https://discord.com/developers/docs/resources/guild#get-guild
export class Channel {
    static kTypeText = 0;
    static kTypeVoice = 2;
    static kTypeNews = 5;

    // ID of the channel, through which it will be identified.
    id = null;

    // Name of the channel, as a human readable string. (#{name})
    name = null;

    // Boolean indicating whether this channel has been marked as NSFW.
    nsfw = null;

    // Permission overrides for this channel. Keyed by role Id, valued by { allow, deny } bitmasks.
    permissions = new Map();

    // Type of channel that this instance describes.
    type = null;

    constructor(channelInfo) {
        this.id = channelInfo.id;
        this.name = channelInfo.name;
        this.nsfw = !!channelInfo.nsfw;
        this.type = channelInfo.type;

        for (const overrideInfo of channelInfo.permission_overwrites) {
            if (overrideInfo.type !== 'role')
                continue;  // only consider roles for now

            this.permissions.set(overrideInfo.id, {
                allow: parseInt(overrideInfo.allow_new, 10),
                deny: parseInt(overrideInfo.deny_new, 10)
            });
        }
    }
}