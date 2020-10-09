const fs = require('fs');

let configInUse = 0;
let configUpdating = false;

// define functions to read config from drive

// reads the config synch
const readConfigSync = () => {
    return JSON.parse(fs.readFileSync('./config.json'));
}

// reads the config asynch
const readConfig = (then) => {
    return fs.readFile('config.json', (err, data) => {
        if (err) throw err;
        then(JSON.parse(data));
    })
}

// define functions to write config back to drive

// writes the data synch
const writeConfigSync = (data) => {
    return fs.writeFileSync('./config.json', JSON.stringify(data, null, 4));
}

// writes the data asynch
const writeConfig = (data, path = "./config.json") => {
    fs.writeFile(path, JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
    })
}

let fsWait = false;
// watches the config, and calls the onChange function if the config has changed as soon as it isn't being used
const watchConfig = (onChange) => {
    fs.watch('./config.json', (event, filename) => {
        if (filename) {
            if (fsWait) return;
            // debounce to prevent capturing the same event multiple times
            fsWait = setTimeout(() => {
                fsWait = false;
            }, 1000);

            configUpdating = true;
            onChangeCallbackCaller(onChange);
        }
    });
}

const onChangeCallbackCaller = (onChange) => {
    if (configInUse > 0) {
        setTimeout(() => onChangeCallbackCaller(onChange), 100);
    } else {
        onChange();
        configUpdating = false;
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// counts the running function calls that use the config
async function usingConfig (func) {
    while (configUpdating) {
        await sleep(50);
    }
    configInUse++;
    func();
    configInUse--;
}

const getStatus = () => {
    return `updating config: ${configUpdating}\nfunctions using config right now: ${configInUse}`;
}

module.exports = {
    readConfig,
    readConfigSync,
    writeConfig,
    writeConfigSync,
    watchConfig,

    usingConfig,
    getStatus
}