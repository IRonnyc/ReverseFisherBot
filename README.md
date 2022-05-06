# ReverseFisherBot

## config.json
add a config.json that contains your api token and other configuration for the application itself:
``` json
{
    "token": "",
    "clientId": "",
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
    "activityChangeInterval": 600,
    "emotes": {
        "cheer": ["@author cheers.", "@author cheers @target on"]
    }
}
```

### token
your discord API token.

### clientId
the id of your bot

### activities
array of activities, each containing a name and a type object. supported types (by discord.js):
 - PLAYING
 - STREAMING
 - LISTENING
 - WATCHING

### emotes
emotes that can be triggered with a forward slash (`/`) followed by the emote text. @author is replaced with the person sending the message, while @target is replaced with a list of everyone who was mentioned. The first string is used if nobody is mentioned and doesn't need to include @target.

## pronouns.json
additionally, add a pronouns.json file - if it hasn't been added by default - containing the pronouns of your users. Users can always set these with the /pronouns command:
``` json
{
    "default": {
        "subject": "they",
        "object": "them",
        "dependent_possessive": "their",
        "independent_possessive": "theirs",
        "reflexive": "themself",
        "be": "are"
    },
    "181558073729613838": {
        "subject": "they",
        "object": "them",
        "dependent_possessive": "their",
        "independent_possessive": "theirs",
        "reflexive": "themself",
        "be": "are"
    }
}
```