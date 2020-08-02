# Discord integration
Las Venturas Playground supports the ability to integrate with Discord through their WebSockets
based Gateway, which is documented on the following pages:

  * https://discord.com/developers/docs/topics/gateway
  * https://discord.com/developers/docs/topics/opcodes-and-status-codes
  * https://discord.com/developers/docs/topics/oauth2#bots

This directory currently implements support for **version 6** of the Discord API, based on
persistent connections using JSON encoding with compression disabled. We will continue to evaluate
this decision as we get more of an idea of the level of traffic we have with this channel.

