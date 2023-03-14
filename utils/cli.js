import { Chalk } from 'chalk';
import { createSupportsColor } from 'supports-color';

const stdoutSupportsColor = createSupportsColor(process.stdout);
const chalk = new Chalk({ level: 1 });

export default (text, type = "info", stamp = true) => {
    let out = "";
    if (stamp) {
        const date = new Date().toLocaleDateString() +  " " + new Date().toLocaleTimeString();
        out += chalk.bold.white(date) + ": ";
    }
    if (type) {
        out += chalk.bold.green("[") + type + chalk.bold.green("] ")
    }
    console.log(out + chalk.gray(text));
};
