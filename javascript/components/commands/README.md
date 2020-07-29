# Commands component
Las Venturas Playground has hundreds of commands, each of which have their own syntax rules,
permissions and requirements. This component generalizes the act of doing that, both for in-game
commands and for commands offered through Nuwani.

## The Command Builder
Rather than repeating the same code for every command, our implementation is designed following the
[builder pattern](https://en.wikipedia.org/wiki/Builder_pattern) and enables you to declaratively
specify _what_ the command should be doing. The architecture looks like this:

![Image of architecture](https://github.com/LVPlayground/playground/blob/master/docs/command-builder.png?raw=true)

  * The [CommandBuilder](command_builder.js) helps you define what a command should do: its name,
    description, restrictions, sub-commands and parameters.
  * Once built, is creates a [CommandDescription](command_description.js) instance to represent the
    command, aided by instances of [CommandKey](command_key.js) and [CommandParameter](command_parameter.js)
    as appropriate.
  * This will generally be registered with the _command manager_, which is specific to the type of
    command that you're creating. This happens automagically.

## The Command Executor
Once a command has been built, it can be given to the [CommandExecutor](command_executor.js) when
it should be executed, usually because a player called it.

![Image of architecture](https://github.com/LVPlayground/playground/blob/master/docs/command-executor.png?raw=true)

  * The [CommandExecutor](command_executor.js) considers a given `commandText` string and figures
    out where it fits in the [CommandDescription](command_description.js).
  * It uses a [CommandPermissionDelegate](command_permission_delegate.js) to identify whether a
    certain person is _allowed_ to execute the command. The delegate is able to override any of the
    restrictions set in the source code.
  * The permission delegate will be given a [CommandContextDelegate](command_context_delegte.js),
    which helps it make sense of levels when a command was issued from e.g. IRC.
