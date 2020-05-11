# Reaction tests
One of Las Venturas Playground's key feature are reaction tests, which ask players to repeat
characters, solve simple calculations, or do a variety of other activities at certain intervals.

This is the code that implements these games. There currently are three implemented:

  1. [Calculation Tests](strategies/calculation_strategy.js), asking players to do a calculation,
  1. [Random Tests](strategies/random_strategy.js), asking players to repeat random characters,
  1. [Remember Tests](strategies/remember_strategy.js), asking players to remember a number.

The frequency and jitter between reaction tests is controllable through the `/lvp settings` command
by Management members, but defaults to once per approximately ten minutes.
