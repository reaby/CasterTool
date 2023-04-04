const fs = require('fs');

module.exports = {
    get: () => {
        if (!fs.existsSync("./settings.json")) {
            fs.writeFileSync("./settings.json", JSON.stringify({ "competitionId": 1 }));
        }
        const file = fs.readFileSync("./settings.json");
        return JSON.parse(file);
    },

    set: (settings) => {
        fs.writeFileSync("./settings.json", JSON.stringify(settings));
    }
}