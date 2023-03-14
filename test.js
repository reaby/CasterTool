import Api from "./api/api.js"
import config from "./config.js";

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
    const result = await api.getMapLeaderboards("ZcqfpbWLDgOqMT1UoRJmUPOHj23", 10);
    console.log(result);

    const compResult = [];
    const fetchNames = [];
    for(const info of result.tops[0].top) {
        compResult.push(info);
        fetchNames.push(info.accountId);
    }
    const names = await getNames(fetchNames);

    for (const info of compResult) {
        const line = `${info.position}. ${names[info.accountId]} - ${info.score}`;
        console.log(line);
    }

    //const result = await api.getCompLeaderboard(5108, 100, token);
    //const mapInfo = await api.getMapInfo("ZcqfpbWLDgOqMT1UoRJmUPOHj23", liveToken);
    //console.log(mapInfo);

})();

