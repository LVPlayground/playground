# NuwaniJS IRC Bot
For years, Las Venturas Playground has had four supporting IRC bots, each written in PHP based
on the [Nuwani framework](https://github.com/LVPlayground/nuwani): Nuwani, Sonium, Saber and
Boteend. These were systems external to the server requiring their own maintenance, went largely
untested and had unclear, and frequently inconsistent support for features.

In order to reduce complexity and maintenance of the server, it was decided to rewrite those bots in
JavaScript. Meet **NuwaniJS**. It's a novel system that only depends on the Socket interface
made available by [PlaygroundJS](https://github.com/LVPlayground/playgroundjs-plugin).

## Configuration
The system can be configured through a file called `nuwani.json` in the SA-MP server root, which
will be interpret by the [Configuration](configuration.js) class.

```json
{
    "bots": [
        { "nickname": "NuwaniJS", "password": "pazzw0rd", "master": true }
    ],
    "servers": [
        { "ip": "127.0.0.1", "port": 6667, "ssl": false },
    ],
    "channels": [
        { "channel": "#echo", "echo": true },
        { "channel": "#admins", "password": "only4crew" }
    ],
    "levels": [
        { "mode": "a", "level": "management" },
        { "mode": "o", "level": "administrator" },
        { "mode": "v", "level": "vip" }
    ],
    "commandPrefix": "!",
    "owners": [
        "*!*@lvp.administrator"
    ]
}
```

  * The system supports an arbitrary amount of bots. Only a single bot can be the `master`, which
    will propagate received messages for processing text and commands. Messages received by other,
    non-master bots will be silently ignored. Each bot has a `nickname`, and optionally a
    `password` which will be used to identify to _NickServ_.

  * The system supports an arbitrary amount of servers. Each bot will only connect to a single
    server, iterating through the list as connection errors are found. Exponential back-off will be
    applied when initiating a reconnect, to avoid hammering servers. Each server has an `ip` and
    a `port`, and optionally an `ssl` flag to initiate a secure connection.

  * Bots can join an arbitrary number of channels on the IRC Network. Channels will be joined after
    _NickServ_ identification has completed. Only a single channel can be the `echo` channel, where
    federated output will be sent. Channels can optionally have a `password` defined too.

  * A mapping is necessary between IRC levels (e.g. the "@", "+" prefixes) and LVP access levels.
    The IRC levels are indicated as user modes, and the LVP access levels have to be one of
    `management`, `administrator` or `vip`.

## Features
**NuwaniJS** has been designed specifically for [Las Venturas Playground](https://sa-mp.nl/) and is
not meant to be a general purpose bot. Its features focus on applicability, compatibility and
reliability, to minimize the amount of maintenance necessary on an on-going basis.

  * Exponential [backoff policy](runtime/backoff_policy.js) to avoid hammering servers.
  * Parsing of [messages](runtime/message.js) and [message prefixes](runtime/message_source.js) in
    line with the ABNF syntax defined in the RFC.
  * Sequenced [connection handshake](runtime/connection_handshake.js) to guarantee ordering and
    handling failure cases of registration, authentication and joining channels.
  * Tracking of [network state](runtime/network_tracker.js) including server support rules,
    channels, and user modes, with server-compatible [mode parsing](runtime/mode_parser.js).

## Commands
**NuwaniJS** supports commands for players, administrators and management members, each implied by
a user's modes on the configured echo channel. The following commands are available:

### Maintenance commands

  * [!eval](commands/maintenance_commands.js) (restricted to **bot owners**): to run arbitrary code
    in context of the server.
  * [!level](commands/maintenance_commands.js): determines the level of an IRC user.

### Generic commands (everyone)

  * [!time](commands/maintenance_commands.js): displays the current time on the server.

## Echo
**NuwaniJS** has the ability to share almost everything that happens on the server with people
watching on IRC. This is quite critical in enabling people to understand what's going on, and
to allow them to interact with people on the server as well.

Code written in Pawn has the ability to call the `EchoMessage` native function. It takes three
parameters: `tag`, the message's identifier, `format`, the message's syntax, and `message`, the
individual parts, formatted in accordance with the `format`, which should be distributed.

Code in JavaScript can depend on this Nuwani module, and call the public `echo` function. It
only requires the `tag`, followed by any number of arguments that, together, make up the message.

Messages will then be formatted by the [MessageFormatter](echo/message_formatter.js), which takes
the defined format (in [irc_messages.json](/data/irc_messages.json)). This formats supports various
operators: `<color>` to amend the message's color, `<target>` to change where the message should
go, and `<prefix>` to require a particular channel user mode in order to receive the message.

Once formatted, the message will be passed to the [MessageDistributor](echo/message_distributor).
This class has the ability to evenly divide messages over the available bots, provide a built-in
fake lag to prevent the bots from timing out, and request the [Runtime](runtime/runtime.js) to
spawn extra bots when required. The messages are then sent to the network.

## References
  * [RFC 2812](https://tools.ietf.org/html/rfc2812)
  * [IRC/2 Numeric List](https://www.alien.net.au/irc/irc2numerics.html)
