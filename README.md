# mee-ding-history
A helper Discord bot for MEE to remember what message people dinged on, because sometimes it's hillarious.

## Known Issues

* Private channels will cause the bot to be unable to search unless granted permissions/roles to allow access to private channels.
* Deleted Levelup messages and deleted Ding messages may cause unexpected results.
* Dings are stored in unreliable cache memory, needs a proper DB setup for putting data on-ice.

* !ding term : is still hardcoded ¯\_(ツ)_/¯
* !ding user ___ x : sometimes fails where it would succeed for the mentioned user doing !ding me x

## Feature Requests

* !ding me all
