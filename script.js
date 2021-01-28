let functions = [];
functions["description"] = [];


functions["description"]["func_add"] = "Adds all numbers on the stack together.";
functions["func_add"] = async (params) => { 
    return [params.reduce((a, b) => a + parseFloat(b), 0)]; 
};
functions["description"]["func_subtract"] = "Subtracts all numbers on the stack from the first.";
functions["func_subtract"] = async (params) => { 
    return [parseFloat(params[0]) - params.slice(1).reduce((a, b) => a + parseFloat(b), 0)]; 
};

functions["description"]["func_multiply"] = "Multiplies all numbers on the stack together.";
functions["func_multiply"] = async (params) => { 
    return [params.reduce((a, b) => a * parseFloat(b), 1)]; 
};
functions["description"]["func_divide"] = "Divides the first number by the product of all other numbers.";
functions["func_divide"] = async (params) => { 
    return [parseFloat(params[0]) / params.slice(1).reduce((a, b) => a * parseFloat(b), 1)]; 
};

functions["description"]["func_delay"] = "Delays the next step.";
functions["func_delay"] = async (params) => {
    await new Promise((resolve) => setTimeout(resolve, parseFloat(params[0])));
    return params;
}

functions["description"]["func_choose"] = "Randomly selects one element on the stack.";
functions["func_choose"] = async (params) => { return [params[Math.floor(Math.random() * params.length)]]; };

functions["description"]["func_random"] = "Returns a random number between 0 and (1 or the first number on the stack)";
functions["func_random"] = async (params) => {
    if (params.length > 0) {
        let upperLimit = params.pop();
        return [...params, Math.random() * upperLimit]; 
    } else {
        return [Math.random()];
    }
};

functions["description"]["func_round"] = "Rounds the top number on the stack.";
functions["func_round"] = async (params) => {
    params.push(Math.round(params.pop()));
    return params;
};

functions["description"]["func_floor"] = "Rounds the top number on the stack down.";
functions["func_floor"] = async (params) => {
    params.push(Math.floor(params.pop()));
    return params;
}

functions["description"]["func_ceil"] = "Rounds the top number on the stack up";
functions["func_ceil"] = async (params) => { 
    params.push(Math.ceil(params.pop()));
    return params;
}

functions["description"]["func_trim"] = "Trims all strings on the stack.";
functions["func_trim"] = async (params) => { return params.map((e) => {return e.toString().trim()})};

functions["description"]["func_lower"] = "Converts all strings on the stack to lowercase.";
functions["func_lower"] = async (params) => { return params.map((e) => {return e.toString().toLowerCase()})};
functions["description"]["func_upper"] = "Converts all strings on the stack to uppercase.";
functions["func_upper"] = async (params) => { return params.map((e) => {return e.toString().toUpperCase()})};

module.exports = functions;