const chalk = require('chalk');
//const { createSupportsColor } = require('supports-color');

//const stdoutSupportsColor = createSupportsColor(process.stdout);


module.exports = (text, type = "info", stamp = true) => {
    let out = "";
    if (stamp) {
        const date = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
        out += chalk.gray(date +" ");
    }
    if (type) {
        out += chalk.bold.green("[") + type + chalk.bold.green("] ")
    }
    console.log(out + chalk.white(text));
};
