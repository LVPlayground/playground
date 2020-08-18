# Feature: Announce
This is a non-triggerable feature that provides a number of APIs for other features to announce
events to players, administrators and those watching through Nuwani. It's a low-level feature as
many of the higher level features have a need to be able to do this.

## Category: Chat announcements
Various types of announcements are most appropriate for the chatbox, because we want most players to
pay attention to them: starting a game for them to sign up to, and administrator notices.

Various APIs are available, where the appropriate one depends on the audience of your message.

  * `announceToPlayers(message, ...params)`: announces the given `message` to all in-game players.
    The `message` will be formatted according to the `params` when given.

  * `announceToAdministrators(message, ...params)`: announces the given `message` to all in-game
    administrators, as well as those watching on IRC and Discord. The `message` will be formatted
    according to the `params` when given.

## Category: News announcements
Players have a limited view at the bottom of their screens which tells them about more trivial
happenings, for example participation in games and results of matches. This view only contains four
messages at most, which are time limited and cycle when they overflow. In addition, players have
the ability to disable this view altogether if they're not interested.

News messages can be posted through the following API:

  * `broadcastNews(message, ...params)`: announcse the given `message` to all players who have
    enabled news messages. The `message` will be formatted according to the `params` when given.

