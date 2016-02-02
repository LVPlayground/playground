# Feature: Activity Log
There are many features on Las Venturas Playground that would benefit from the ability to analyse
how players use and interact with them in order to drive further improvements.

Examples include gaining an understanding of where players spend their time, which vehicles are
being used most and which weapons are most popular in killing players on which areas of the map.

The code in this feature aims to record as much information as we can to enable such analysis. A
secondary goal of this feature is to enable replays of in-game playing sessions, to be able to
simulate what the effects are of features based on heuristics, for example an economy.

## List of things being logged.

- Deaths, including their position and reason, associated with player accounts if possible.
- Kills, including their position and reasons, associated with player accounts where possible.
