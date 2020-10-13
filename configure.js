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
        // no error -> parse data and execute passed function
        then(JSON.parse(data));
    })
}

// define functions to write config back to drive

// writes the data synch
const writeConfigSync = (data, path = "./config.json") => {
    // stringify with 4 as the 3rd parameter ensures pretty formatting of the file 
    // with 4 spaces as indentation
    return fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

// writes the data asynch
const writeConfig = (data, path = "./config.json") => {
    // stringify with 4 as the 3rd parameter ensures pretty formatting of the file 
    // with 4 spaces as indentation
    fs.writeFile(path, JSON.stringify(data, null, 4), (err) => {
        // if an error occures, throw it, otherwise everything OK
        if (err) throw err;
    })
}

let fsWait = false;
// watches the config, and calls the onChange function if the config has changed as soon as it isn't being used
const watchConfig = (onChange) => {
    fs.watch('./config.json', (event, filename) => {
        // filename has to be set
        if (filename) {
            // if debounce is still running, ignore the event
            if (fsWait) return;
            // debounce to prevent capturing the same event multiple times
            fsWait = setTimeout(() => {
                fsWait = false;
            }, 1000);
            
            // configUpdating = false is set in onChangeCallbackCaller once onChange has been called
            // this is necessary as onChangeCallbackCaller uses timeouts in case the config is still in use
            configUpdating = true;
            onChangeCallbackCaller(onChange);
        }
    });
}

// calls the onChange function once config isn't being used anymore
const onChangeCallbackCaller = (onChange) => {
    // if still in use, try again in 100ms
    if (configInUse > 0) {
        setTimeout(() => onChangeCallbackCaller(onChange), 100);
    } else { // else call the function and set configUpdating = false
        onChange();
        configUpdating = false;
    }
};

// promise that resolves after a set time
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// counts the running function calls that use the config
async function usingConfig (func) {
    // while config is updating, check every 50ms
    while (configUpdating) {
        await sleep(50);
    }
    // count functions that use the config up and call the function
    configInUse++;
    func();
    // decrease again
    configInUse--;
}


// returns a human readable representation of the current status
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