# Administrator IRC Guide
This guide exists for administrators of Las Venturas Playground who wish to become more versed in
the available IRC commands. Our tools are powerful and have evolved over the years, which means
that not everybody may be fully up-to-speed on the latest.

### Controlling who can access the server
  * [I want to kick someone from the server](#-i-want-to-kick-someone-from-the-server)
  * [I want to ban an in-game player](#-i-want-to-ban-an-in-game-player)
  * [I want to ban a player by IP address](#-i-want-to-ban-a-player-by-ip-address)
  * [I want to ban a player by IP range](#-i-want-to-ban-a-player-by-ip-range)
  * [I want to ban a player by serial number](#-i-want-to-ban-a-player-by-serial-number)
  * [I want to find out what the most recent bans are](#-i-want-to-find-out-what-the-most-recent-bans-are)
  * [I want to find out who is using an IP address](#-i-want-to-find-out-who-is-using-an-ip-address)
  * [I want to find out which IP addresses a player is using](#-i-want-to-find-out-which-ip-addresses-a-player-is-using)
  * [I want to find out who is using a serial number](#-i-want-to-find-out-who-is-using-a-serial-number)
  * [I want to find out which serial(s) a player is using](#-i-want-to-find-out-which-serials-a-player-is-using)
  * [I want to find out what a player's record is](#-i-want-to-find-out-what-a-players-record-is)
  * [I want to add a note to a player's record](#-i-want-to-add-a-note-to-a-players-record)
  * [I want to unban a player by IP address, range or serial number](#-i-want-to-unban-a-player-by-ip-address-range-or-serial-number)

### Communicating with players on the server
  * [I want to make a formal announcement](#-i-want-to-make-a-formal-announcement)
  * [I want to send a message, but highlight it](#-i-want-to-send-a-message-but-highlight-it)
  * [I want to send a message to in-game crew](#-i-want-to-send-a-message-to-in-game-crew)

### Managing identity of a player on the server
  * [I want to change a player's username](#-i-want-to-change-a-players-username)
  * [I want to see a player's nickname history](#-i-want-to-see-a-players-nickname-history)
  * [I want to see a player's aliases](#-i-want-to-see-a-players-aliases)
  * [I want to add a new alias for a player](#-i-want-to-add-a-new-alias-for-a-player)
  * [I want to remove an alias from a player](#-i-want-to-remove-an-alias-from-a-player)

### Managing the state of Las Venturas Playground players
  * [I want to see which player data I have access to](#-i-want-to-see-which-player-data-i-have-access-to)
  * [I want to see a player's data](#-i-want-to-see-a-players-data)
  * [I want to update a player's data](#-i-want-to-update-a-players-data)
  * [I want to change a player's password](#-i-want-to-change-a-players-password)


## Controlling who can access the server
As an administrator, you have the ability to control which players are able to access the server,
and to revoke access from any player for any reason. We call this _banning_ and _unbanning_ players.

Las Venturas Playground supports three kinds of bans:

  * **IP addresses**, the default, revoking access to a particular person.
  * **IP ranges**, available through IRC commands, revoking access to a region.
  * **GPCI bans**, which are player's serial numbers, much harder to change.

All types of bans have mandatory associations with a player, and must have an expiration date set.
Bans will also be associated with the person who issued the ban, and come attached with a reason. In
addition to that, we also log each time a ban gets lifted.

### ⯈ I want to kick someone from the server
**Command**: `!kick [player] [reason]`

#### Examples
```
!kick 4 Consider this your last warning, Joe!
!kick Gunther Not allowing my AMAZING bike on the ship :(
```

### ⯈ I want to ban an in-game player
**Command**: `!ban [player] [days=3] [reason]`

#### Examples
```
!ban 16 Unexpected use of a minigun
!ban Gunther Not allowing me to walk on the ship
!ban Gunther 30 Being a douce, come back in 30 days!
```

#### Notes
  * By default, bans will last for three days.

### ⯈ I want to ban a player by IP address
**Command**: `!ban ip [ip] [nickname] [days] [reason]`

#### Examples
```
!ban ip 127.0.0.1 3 Don't want those pesky NPCs
!ban ip 192.168.0.1 30 Banning my router for 30 days for crappy firmware
```

### ⯈ I want to ban a player by IP range
**Command**: `!ban range [ip range] [nickname] [days] [reason]`

#### Examples
```
!ban range 192.168.*.* Family 7 Taking a week off from my household members
!ban range 56.*.*.* USPS 3 My mail was delayed, focus on that please
```

#### Notes
  * Administrators are allowed to ban up to 65,536 addresses. Management members are allowed to
    ban up to 16,777,216 addresses. Raw database access is required in order to go beyond that.

### ⯈ I want to ban a player by serial number
**Command**: `!ban serial [serial] [nickname] [days] [reason]`

#### Examples
```
!ban serial 5111943668 [HC]Robot 10 Not sure if you're real?
!ban serial 7483910346 spambot0 30 Trying to hammer the server
```

### ⯈ I want to find out what the most recent bans are
**Command**: `!lastbans`

#### Examples
```
!lastbans
```

#### Notes
  * Only the five most recent bans will be displayed. Additional information is available through
    the website, which the command will give you a link for.

### ⯈ I want to find out who is using an IP address
**Command**: `!ipinfo [ip | ip range] [maxAge = 1095]`

#### Examples
```
!ipinfo 56.0.105.103 365
!ipinfo 192.168.*.*
```

#### Notes
  * The 10 most recent nicknames will be displayed. Raw database access is required in order to
    access additional nicknames.
  * By default only entries from the past three years will be considered. This can be overridden by
    passing a different value for the `maxAge` argument, a number of days.

### ⯈ I want to find out which IP addresses a player is using
**Command**: `!ipinfo [nickname] [maxAge = 1095]`

#### Examples
```
!ipinfo USPS
```

#### Notes
  * The 10 most recent IP addresses will be displayed. Raw database access is required in order to
    access additional IP addresses.
  * By default only entries from the past three years will be considered. This can be overridden by
    passing a different value for the `maxAge` argument, a number of days.

### ⯈ I want to find out who is using a serial number
**Command**: `!serialinfo [serial] [maxAge = 1095]`

#### Examples
```
!serialinfo 5111943668 90
!serialinfo 5111943668
```

#### Notes
  * The 10 most recent nicknames will be displayed. Raw database access is required in order to
    access additional nicknames.
  * By default only entries from the past three years will be considered. This can be overridden by
    passing a different value for the `maxAge` argument, a number of days.

### ⯈ I want to find out which serial(s) a player is using
**Command**: `!serialinfo [nickname] [maxAge = 1095]`

#### Examples
```
!serialinfo USPS
```

#### Notes
  * The 10 most recent serial numbers will be displayed. Raw database access is required in order to
    access additional serial numbers.
  * By default only entries from the past three years will be considered. This can be overridden by
    passing a different value for the `maxAge` argument, a number of days.

### ⯈ I want to find out what a player's record is
**Command**: `!why [nickname] [maxAge = 365]`

#### Examples
```
!why USPS
```

#### Notes
  * The 5 most recent entries on the player's record will be displayed. Additional information is
    available through the website, which the command will give you a link for.
  * Only entries added in the past year will be displayed by default. An additional parameter can
    be used to display more, but administrators are discouraged from doing so.

### ⯈ I want to add a note to a player's record
**Command**: `!addnote [nickname] [note]`

#### Examples
```
!addnote USPS Did not receive my mail again, grrrr!
```


### ⯈ I want to unban a player by IP address, range or serial number
**Command**: `!unban [ip | ip range | serial] [note]`

#### Examples
```
!unban 56.0.105.103 Turns out that banning USPS does not make parcels appear
!unban 192.168.*.* My flat mate bribed me in giving them access again
!unban 7483910346 Turns out it was Joe pulling another prank
```

## Communicating with players on the server
Everyone on IRC has the ability to send messages to the server with the `!msg` command, but there
are cases where it's useful to stand out a little bit more, or only send a message to a particular
audience, particularly your fellow administrators.

### ⯈ I want to make a formal announcement
**Command**: `!announce [message]`

#### Examples
```
!announce The server will be going down for maintenance in 5 minutes.
```

### ⯈ I want to send a message, but highlight it
**Command**: `!say [message]`

#### Examples
```
!say Everyone should join the cruise! Let's gather at the pirate ship.
```

### ⯈ I want to send a message to in-game crew
**Command**: `!admin [message]`

#### Examples
```
!admin I forgot who you are again, my undercover friend!
```


## Managing identity of a player on the server
Think back to your early teens, where creating your first e-mail account as `hotlad91@hotmail.com`
seemed like the best idea in the world. Come your twenties, with a need to build a resume, and
suddenly this e-mail address might not be the most appropriate anymore.

Players change their minds about their identity all the time. They may join or leave a gang. Up to
them, really. We have a few tools available to help them through this process.

### ⯈ I want to change a player's username
**Command**: `!changename [nickname] [newNickname]`

#### Examples
```
!changename [BB]Ricky92 TheRickster
```

### ⯈ I want to see a player's nickname history
**Command**: `!history [nickname]`;

#### Examples
```
!history [SC]Hizophrenia
```

### ⯈ I want to see a player's aliases
**Command**: `!aliases`

#### Examples
```
!aliases [SC]Hizophrenia
```

### ⯈ I want to add a new alias for a player
**Command**: `!addalias [nickname] [alias]`

#### Examples
```
!addalias MrSpoon MrsFork
```

### ⯈ I want to remove an alias from a player
**Command**: `!removealias [nickname] [alias]`

#### Examples
```
!removealias Beaner Beanster
```


## Managing the state of Las Venturas Playground players
Players come to us with all kinds of requests: their ratio to be re-set, their colour to be changed,
statistics to be merged with another account, or just plain errors in our code that cause corruption
in someone's statistics.

For all of those reasons, you have the ability to amend the information associated with a player
right in the database. A trio of commands exists to power this ability.

### ⯈ I want to see which player data I have access to
**Command**: `!supported`

#### Examples
```
!supported
```

#### Notes
  * The number of supported fields depends on whether you're an administrator or a Management
    member. In addition, there are fields that aren't accessible by either and require raw database
    access.

### ⯈ I want to see a player's data
**Command**: `!getvalue [nickname] [field]`

#### Examples
```
!getvalue Gunther kill_count
!getvalue Gunther stats_exports
```

### ⯈ I want to update a player's data
**Command**: `!setvalue [nickname] [field] [value]`

#### Examples
```
!setvalue Gunther kill_count 25
!setvalue Gunther stats_exports 500
```

### ⯈ I want to change a player's password
**Command**: `!changepass [nickname]`

#### Examples
```
!changepass Gunther
```

#### Notes
  * We do not allow setting a player's password to a particular value, that's up to them. Instead,
    this command will set their password to a pseudo-randomly generated value.
