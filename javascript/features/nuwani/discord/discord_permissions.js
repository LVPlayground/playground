// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags

export const kPermissionInstantInvite = 0x1;
export const kPermissionKick = 0x2;
export const kPermissionBan = 0x4;
export const kPermissionAdministrator = 0x8;
export const kPermissionManageChannels = 0x10;
export const kPermissionManageGuild = 0x20;
export const kPermissionAddReaction = 0x40;
export const kPermissionAuditLogs = 0x80;
export const kPermissionPrioritySpeaker = 0x100;
export const kPermissionStream = 0x200;
export const kPermissionViewChannel = 0x400;
export const kPermissionSendMessage = 0x800;
export const kPermissionSendMessageTTS = 0x1000;
export const kPermissionManageMessage = 0x2000;
export const kPermissionEmbedLinks = 0x4000;
export const kPermissionAttachFiles = 0x8000;
export const kPermissionMessageHistory = 0x10000;
export const kPermissionMentionEveryone = 0x20000;
export const kPermissionExternalEmoji = 0x40000;
export const kPermissionGuildInsights = 0x80000;
export const kPermissionConnect = 0x100000;
export const kPermissionSpeak = 0x200000;
export const kPermissionMuteMembers = 0x400000;
export const kPermissionDeafenMembers = 0x800000;
export const kPermissionMoveMembers = 0x1000000;
export const kPermissionUseVoiceActivation = 0x2000000;
export const kPermissionChangeNickname = 0x4000000;
export const kPermissionManageNickname = 0x8000000;
export const kPermissionManageRoles = 0x10000000;
export const kPermissionManageWebhooks = 0x20000000;
export const kPermissionManageEmoji = 0x40000000;
