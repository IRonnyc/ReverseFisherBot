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
    "activityChangeInterval": 600,
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
    "usernameMap": {
        "IRonnyc": ["👼"]
    }    
}
```

## token
your discord API token

## activities
array of activities, each containing a name and a type object. supported types (by discord.js):
 - PLAYING
 - STREAMING
 - LISTENING
 - WATCHING

## activityChangeInterval
the time in seconds between activity changes

## wordMap
regex expressions to look for in messages and the emojis they're mapped to (which are used to react to these messages)

## usernameMap
regex expressions to look for in usernames and the emojis they're mapped to (which are used to react to all messages of that user)