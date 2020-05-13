# Account Provider
Players are able to have an account on Las Venturas Playground by registering themselves on
[our website](https://sa-mp.nl/). This gives them persistent state on the server, which means that
all their playing data will be stored in a database.

This functionality will be provided by the _Account Provider_, this foundational feature. It adds
the `account` supplement to the `Player` object, which makes this information known to all
code on the server.
