# Feature: Vehicles
The vehicles feature is responsible for managing the vehicles on Las Venturas Playground. For
administrators this means their ability to create, modify and remove vehicles, for players this
means making sure that there always are vehicles available around them.

The following terminology is important for this feature:

  - A **persistent** vehicle will not be considered for streaming, but will instead always be
    created on the server.
  - A **streamable** vehicle will be created and destroyed on demand. There is no limit to the
    amount of streamable vehicles that can be created on Las Venturas Playground.
  - The list of **disposable vehicles** include vehicles that are not referenced anymore by players,
    but haven't been destroyed yet to reduce churn in vehicle creation.

As currently tested, the performance of the vehicle streamer is sufficient to provide about half
a million vehicles for 500 online players.

## Commands
No commands are available yet.

## Streaming
No details about streaming are available yet.
