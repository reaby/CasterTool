import fs from 'fs';

export default {
    settings: {
        "competitionId": 1
    },

    get: () => {
        if (!fs.existsSync("./settings.json")) {
            fs.writeFileSync("./settings.json", JSON.stringify(this.settings));
        }
        const file = fs.readFileSync("./settings.json");
        return JSON.parse(file);
    },

    set: (settings) => {
        fs.writeFileSync("./settings.json", JSON.stringify(settings));
    }
}