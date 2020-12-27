# Discord integration
Las Venturas Playground supports the ability to integrate with Discord through their WebSockets
based Gateway, which is documented on the following pages:

  * https://discord.com/developers/docs/topics/gateway
  * https://discord.com/developers/docs/topics/opcodes-and-status-codes
  * https://discord.com/developers/docs/topics/oauth2#bots

This directory currently implements support for **version 6** of the Discord API, based on
persistent connections using JSON encoding with compression disabled. We will continue to evaluate
this decision as we get more of an idea of the level of traffic we have with this channel.

The bot's identity and secret have to be defined in the `nuwani.json` configuration file, and are
entirely optional. In most cases only the live server should attempt to establish a connection.

## What Discord is for, and what it's not for
Different from IRC, Discord puts stricter limits on the message volume which makes having a fully
fledged echo mechanism infeasible. On top of that, the lack of rich formatting such as colours make
it challenging to sufficiently differentiate messages in a high message volume environment.

For now, our intention is to provide a basic communication mechanism for players and administrators,
experiment, and evolve the system based on what we learn.

## How the connection works
Our approach to enabling the Discord connection is through a layered design—different parts of the
system have different responsibilities. This had to be considered from scratch as it's not easy in
our architecture to support existing Node.js modules.

  * At the lowest level, the [playgroundjs-plugin](https://github.com/LVPlayground/playgroundjs-plugin)
    provides support for TLS WebSocket connections. This has been implemented on top of the
    excellent [Boost library](https://www.boost.org/).
  * The [DiscordSocket](discord_socket.js) interacts with it, implementing support for connection
    management, retries and [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff).
    It further makes sure that split WebSocket frames are joined together.
  * The [DiscordConnection](discord_connection.js) implements support for the
    [Discord Gateway API](https://discord.com/developers/docs/topics/gateway), handling the connection
    handshake, identification and providing a heartbeat monitor.
  * _TODO: The DiscordTracker keeps track of the channels and users on the Discord server, and has_
    _the necessary knowledge to identify hwo to interact with each of them._
