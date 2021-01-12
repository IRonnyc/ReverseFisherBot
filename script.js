let functions = [];
functions["description"] = [];


functions["description"]["func_add"] = "Adds all numbers on the stack together.";
functions["func_add"] = (params) => { 
    return [params.reduce((a, b) => a + parseFloat(b), 0)]; 
};
functions["description"]["func_subtract"] = "Subtracts all numbers on the stack from the first.";
functions["func_subtract"] = (params) => { 
    return [parseFloat(params[0]) - params.slice(1).reduce((a, b) => a + parseFloat(b), 0)]; 
};

functions["description"]["func_multiply"] = "Multiplies all numbers on the stack together.";
functions["func_multiply"] = (params) => { 
    return [params.reduce((a, b) => a * parseFloat(b), 1)]; 
};
functions["description"]["func_divide"] = "Divides the first number by the product of all other numbers.";
functions["func_divide"] = (params) => { 
    return [parseFloat(params[0]) / params.slice(1).reduce((a, b) => a * parseFloat(b), 1)]; 
};

functions["description"]["func_choose"] = "Randomly selects one element on the stack.";
functions["func_choose"] = (params) => { return [params[Math.floor(Math.random() * params.length)]]; };

functions["description"]["func_random"] = "Returns a random number between 0 and 1 or the first number on the stack";
functions["func_random"] = (params) => { 
    if (params.length > 0) {
        return [Math.random() * params[0] + 1]; 
    } else {
        return [Math.random()];
    }
};

functions["description"]["func_round"] = "Rounds all numbers on the stack.";
functions["func_round"] = (params) => { 
    return params.map(Math.round); 
};

functions["description"]["func_trim"] = "Trims all strings on the stack.";
functions["func_trim"] = (params) => { return params.map((e) => {return e.toString().trim()})};

functions["description"]["func_lower"] = "Converts all strings on the stack to lowercase.";
functions["func_lower"] = (params) => { return params.map((e) => {return e.toString().toLowerCase()})};
functions["description"]["func_upper"] = "Converts all strings on the stack to uppercase.";
functions["func_upper"] = (params) => { return params.map((e) => {return e.toString().toUpperCase()})};

module.exports = functions;