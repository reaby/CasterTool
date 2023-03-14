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
    const result = await api.getCompLeaderboard(5108, 100);
    const gbx = new GbxClient();
    await gbx.connect("127.0.0.1", 5000);
    gbx.call("GetPlayerList", 255, 0);


    // gbx.call("GetPlayerInfo", "LOGIN")


    console.log(result);

})();

