var authorizedUsers = new Set([]);

var authorizationMethod = undefined;
const authorizeUser = (user) => {
    authorizedUsers.add(user);
}

const authorizeUsers = (users) => {
    users.forEach(authorizedUsers.add);
}

const deauthorizeAll = () => {
    authorizedUsers = new Set([]);
}

const deauthorizeUser = (user) => {
    authorizedUsers.delete(user);
}

const hasPermission = (user) => {
    console.log(`Checking user: ${user}`);
    return authorizedUsers.has(user);
}

const requestAuthorization = (author, command, parameters) => {
    if (authorizationMethod) {
        return new Promise(authorizationMethod(author, command, parameters));
    }
    return new Promise(() => {
        Promise.reject("Couldn't resolve authorization method");
    })
}

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