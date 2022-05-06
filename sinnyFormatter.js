// DEPRECATED

var fetch = require("node-fetch");

const getFormattedString = (source, type, params, then) => {
    let urlString = source + '?type=' + type + (params.length > 0 ? "&" : "") + params.join("&"); //param1=value&param2=value....

    console.log("url: " + urlString);
    console.log("source: " + source);
    console.log("type: " + type);
    console.log("params: " + params);
    let returnValue = fetch(new  URL(urlString))
        .then(response => {
            if(!response.ok) {
                return null;
            }
            return response.json();
        })
        .then(json => {
            then(JSON.stringify(json));
        }).catch(err => {
            console.error(err);
        });
    return returnValue;
}

module.exports = {
    getFormattedString
}