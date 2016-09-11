# House Extensions
In an effort to further componentize the housing system, various smaller features associated with
houses have been separated in their own _extension_. In short, a _house extension_ defines a
specific part of the housing system.

## Property Settings
The [Property Settings](property_settings.js) extension provides the similarly named menu item in
the `/house settings` command. Players have the ability to, through this menu, change their house's
name and welcome message, entrance marker color, as well as changing whether to spawn at the house.

This extension also implements display of the welcome message, as well as the message displayed to
house owners reminding them of the `/house settings` command.

## Visitor Log
The [Visitor Log](visitor_log.js) extension logs all occurrences of players entering houses, and
provides a menu option in `/house settings` for VIPs enabling them to see this.
