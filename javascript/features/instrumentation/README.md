# Instrumentation
The number of opinions on where we should invest our time is equal to the number of players. Each
player has a different view, and rightfully so: they play in their own way, use their preferred set
of features and commands. That makes it a really tricky problem to decide where to invest next.

In order to address that problem, we _instrument_ the server. That means that we store analytical
information to understand how and when certain systems are used, giving us clear data to help decide
where to invest our time.

## Privacy
This is strictly analytical data that records _how_ people play, without recording the specifics.
That means that we'll record that you sent a private message, but do not record to whom it was sent,
or what the message read. Indeed, recorded instrumentation is associated with your account ID.

The user association will only be used where absolutely required: for most data, such as insight in
how commands are used, the association does not matter at all beyond your access level. For other
data, such as categorizing players based on behaviour, we might use account IDs as an _aggregation_
_token_ rather than as a personal identifier.
