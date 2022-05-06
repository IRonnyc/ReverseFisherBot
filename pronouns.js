const fs = require('fs');

let configInUse = {};
let configUpdating = false;

// define functions to read config from drive

// reads the config synch
const readSync = (path) => {
    configUpdating = true;

    let config = JSON.parse(fs.readFileSync(path));

    configUpdating = false;

    return config;
}

// reads the config asynch
const read = (path, then) => {
    return fs.readFile(path, (err, data) => {
        if (err) throw err;

        // no error -> parse data, update slash commands and execute passed function
        then(JSON.parse(data))
    })
}

// writes the data synch
const writeSync = (data, path) => {
    // stringify with 4 as the 3rd parameter ensures pretty formatting of the file 
    // with 4 spaces as indentation
    return fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

// writes the data asynch
const write = (data, path) => {
    // stringify with 4 as the 3rd parameter ensures pretty formatting of the file 
    // with 4 spaces as indentation
    fs.writeFile(path, JSON.stringify(data, null, 4), (err) => {
        // if an error occures, throw it, otherwise everything OK
        if (err) throw err;
    })
}

let fsWait = false;
// watches the config, and calls the onChange function if the config has changed as soon as it isn't being used
const watch = (path, onChange) => {
    fs.watch(path, (event, filename) => {
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
async function using (func) {
    // while config is updating, check every 50ms
    while (configUpdating) {
        await sleep(50);
    }
    // count functions that use the config up and call the function
    configInUse++;
    let ret = func();
    if (ret instanceof Promise) {
        await ret;
    }
    // decrease again
    configInUse--;
}


// returns a human readable representation of the current status
const getStatus = () => {
    return `updating config: ${configUpdating}\nfunctions using config right now: ${configInUse}`;
}

module.exports = {
    read,
    readSync,
    write,
    writeSync,
    watch,

    using,
    getStatus
}