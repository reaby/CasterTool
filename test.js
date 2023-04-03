import Api from "./tmapi/api.js"
import config from "./config.js";
import { GbxClient } from '@evotm/gbxclient'

const credentials = Buffer.from(config.user+":"+config.pass).toString('base64');
const api = new Api(credentials);

async function getNames(list) {
    const namesResult = await api.getDisplayNames(list);
    const out = {};
    for (const info of namesResult) {
        out[info.accountId] = info.displayName;
    }
    return out;
}



(async () => {
    const result = await api.getCompetitionRounds(5108);
    console.log(result);
})();

