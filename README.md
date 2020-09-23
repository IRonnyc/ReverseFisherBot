# ReverseFisherBot

add a config.json that contains your api token under the 'token' key and then regular expressions and the emojis you want them to map to:
```
{
    "token": "",
    "messageContainsMap": {
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
    }
}
```