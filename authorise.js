// DEPRECATED

// set with all authorized users
var authorizedUsers = new Set([]);

// method by which a request can be authorized, if the user
// issuing the request hasn't been authorized
var authorizationMethod = undefined;

// adds the user to the set of authorized users. please ensure it
// isn't randomly called!
const authorizeUser = (user) => {
    authorizedUsers.add(user);
}

// adds the users to the set of authorized users. please ensure it
// isn't randomly called!
const authorizeUsers = (users) => {
    users.forEach(authorizedUsers.add);
}

// resets the set of authorized users
const deauthorizeAll = () => {
    authorizedUsers = new Set([]);
}

// removes a single user from the set
const deauthorizeUser = (user) => {
    authorizedUsers.delete(user);
}

// checks if the user is in the set
const hasPermission = (user) => {
    console.log(`Checking user: ${user}`);
    return authorizedUsers.has(user);
}

// wraps the authorizationMethod in a new promise or returns a rejected promise
const requestAuthorization = (author, command, parameters) => {
    if (authorizationMethod) {
        return new Promise(authorizationMethod(author, command, parameters));
    }
    return new Promise((resolve, reject) => {
        reject("Couldn't resolve authorization method");
    })
}

// set the authorizazionMethod
const setAuthorizationMethod = (method) => {
    authorizationMethod = method;
}

module.exports = {
    authorizeUser,
    authorizeUsers,
    deauthorizeAll,
    deauthorizeUser,
    hasPermission,
    requestAuthorization,
    setAuthorizationMethod
}