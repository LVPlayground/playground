# Finance Feature
The world of San Andreas has a finance of its own. Players can carry cash, have bank accounts when
they're registered, and can waste their money in a variety of ways.

This feature implements regulation of that money.

## Regulating money on Las Venturas Playground
The [MoneyRegulator](money_regulator.js) is responsible for keeping track of the amount of cash a
player is carrying. The regulator is authoritative: the player's client can tell us that they have
ten times more money, but it wouldn't make a difference: an object aptly called the
[FinancialDispositionMonitor](financial_disposition_monitor.js) will put them back in line.

This immediately stops player's ability to money cheat: any discrepancies will simply be ignored. We
won't even bother informing administrators about it.

Small amounts of money exchanged in casinos, Pay 'n Spray shops and vehicle tuning shops will be
accounted for by the [FinancialDispositionMonitor](financial_disposition_monitor.js).
