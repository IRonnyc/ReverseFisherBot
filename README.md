# ReverseFisherBot

add a config.json that contains your api token under the 'token' key and then regular expressions and the emojis you want them to map to and finally reactions to specific usernames:
```
{
    "token": "",
    "activities": [
        {
            "name": "Fishing for messages",
            "type": "PLAYING"
        },
        {
            "name": "the fishingrod for messages",
            "type": "WATCHING"
        }
    ],
    "commandPrefix": "/",
    "autoFulfillEmote": "🤖",
    "adminCommandPrefix": "!/",
    "activityChangeInterval": 600,
    "helpPageLength": 1000,
    "wordMap": {
        "bir(d|b)": ["🐦"],
        "dragon": ["🐉"],
        "sn(a|e)k(e)*": ["🐍"],
        "cow": ["🐮"],
        "m(u|o)+h{0,1}(\\W|\\b)": ["🐮"],
        "fishes": ["🐠", "🐡", "🍥"],
        ":o": ["😮"],
        "D:": ["😦"],
        "<3": ["♥"],
        "\\o/": ["🎉"],
        "y(a|e)+s": ["✔"],
        "n(o)+(\\W|\\b)": ["❌"],
        "nose": ["👃"]
    },
    "userconfig": {
        "default": {
            "react": [],
            "pronouns": {
                "subject": "they",
                "object": "them",
                "dependent_possessive": "their",
                "independent_possessive": "theirs",
                "reflexive": "themself",
                "be": "are"
            }
        },
        "IRonnyc": {
            "react": [
                "👼"
            ],
            "pronouns": {
                "subject": "they",
                "object": "them",
                "dependent_possessive": "their",
                "independent_possessive": "theirs",
                "reflexive": "themself",
                "be": "are"
            }
        }
    },
    "messageTitleIgnore": [
        "someTitle"
    ],
    "emotes": {
        "cheer": ["@author cheers.", "@author cheers @target on"]
    },
    "specialEmoteTargets": {
        "onion": "an onion"
    },
    "reactOnOccasion": {
        "snowflake": [
            {
                "probability": 1,
                "msg": [
                    "<@758299827741261835> flexes its muscles at <@snowflake>."
                ]
            }
        ]
    },
    "adminContact": "your snowflake"
}
```

## token
your discord API token.

## activities
array of activities, each containing a name and a type object. supported types (by discord.js):
 - PLAYING
 - STREAMING
 - LISTENING
 - WATCHING

## commandPrefix
This sets the character(s) that starts a command the bot should interpret.

## autoFulfillEmote
The bot will add the emoji as a reaction to autofulfilled emotes (e. g. greetings);

## adminCommandPrefix
This sets the character(s) that start an admin command, that needs to be confirmed by the adminContact. Make sure it doesn't start with your normal command prefix, so it doesn't trigger unimplemented emote warnings.

## activityChangeInterval
the time in seconds between activity changes.

## wordMap
regex expressions to look for in messages and the emojis they're mapped to (which are used to react to these messages).

## helpPageLength
The upper limit of characters for every page returned by the /help command

## usernameMap
regex expressions to look for in usernames and the emojis they're mapped to (which are used to react to all messages of that user).

## messageTitleIgnore
messageTitleIgnore is a list of message titles the bot is not supposed to react to. This can potentially be used to ignore e. g. polls.

## emotes
emotes that can be triggered with a forward slash (`/`) followed by the emote text. @author is replaced with the person sending the message, while @target is replaced with a list of everyone who was mentioned. The first string is used if nobody is mentioned and doesn't need to include @target.

## specialEmoteTargets
specialEmoteTargets is a list of words the bot looks for in emotes to add additional targets. If the entered string starts with a u and then a number, it will try to resolve the number as a user snowflake to tag the user. These are RegEx too!

## reactOnOccasion
The bot will on occasion react to something a user writes with a predefined message. The user can be set under snowflake, enter the snowflake of the user here.
This is followed by an array of possible reactions. Enter objects with the fields `probability` (0 - 1) for the probability of this answer being sent, and `msg` for the messages being sent.

## adminContact
adminContact can hold your personal discord snowflake (type \@yourself into discord chat to escape the link, the snowflake is the number it shows) so the bot can contact you if an error occures (e.g. somebody tried to use an emote that doesn't exist).

## authorizedUsers
users that you trust and who are allowed to execute admin commands.


# adminCommands

## addEmote

`!admin addEmote "test" "@author tests themself." "@author tests @target"`

Parameters: 3
First: name of the emote
Second: emote without target
Third: emote with target

Adds a new emote to the bot. This change has to be saved with saveConfig

## saveConfig

`!admin saveConfig`
Parameter: 0

saves changes to the config file.