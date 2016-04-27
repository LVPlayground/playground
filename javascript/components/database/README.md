# Component: Database
The database component allows features to communicate with the MySQL database powering Las Venturas
Playground. All functionalities are strictly asynchronous.

## MySQL safety 101
It is important that you do not substitute untrusted information (basically everything!) in the
query that is about to be executed. For example, the following is **bad**:

```javascript
self.addEventListener('playertext', event => {
    database.query('INSERT INTO message_log (message) VALUES ("' + event.text + '")');
});
```

While this may look innocent enough, consider the following two messages:

  1. `You're so "funny"!`
  2. `"); DROP TABLE users --`

The first message would cause a syntax error, and prevent the message from being written to your
log. The second message would write an empty message, then remove all user information.

Instead, please use the substitution feature of the `query()` method, and put a question mark in the
query at the place where you want a safe version of this data so be substituted.

```javascript
self.addEventListener('playertext', event => {
    database.query('INSERT INTO message_log (message) VALUES(?)', event.text); 
});
```

This will safely insert the message into the database, regardless of what it is.

## Example: Get the level of a connecting player.
The following example will select a player's level from the database when they connect to the
server. The callbacks will be executed once the information either is available, or an error
occurred and the data could not be retrieved.

```javascript
// Access the database via the Playground instance in production code!
let database = new Database(...);

self.addEventListener('connect', event => {
    let player = server.playerManager.getById(event.playerid);

    database.query('SELECT level FROM users WHERE nickname = ?', player.name).then(
        results => console.log(player.name + ' is a ' + results[0].level),
        error => console.log('Could not get the level!', error));
});
```
