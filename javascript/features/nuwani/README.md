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
    channels, and user modes.

## Commands
**NuwaniJS** supports commands for players, administrators and management members, each implied by
a user's modes on the configured echo channel. The following commands are available:

```javascript
// None yet!
```

## References
  * [IRC/2 Numeric List](https://www.alien.net.au/irc/irc2numerics.html)