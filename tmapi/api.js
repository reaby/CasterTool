import * as fs from 'fs';
import fetch from 'node-fetch';

const toolName = "CasterTool / petri.jarvisalo@gmail.com";
const commonHeader = {
    "Content-Type": "application/json",
    "User-Agent": toolName
};

const AUDIENCE_NADEOSERVICES = "NadeoServices";
const AUDIENCE_LIVESERVICES = "NadeoLiveServices";
const AUDIENCE_CLUBSERVICES = "NadeoClubServices";

export default class TrackmaniaApi {
    constructor(credentials) {
        if (!fs.existsSync("./tokens.json")) {
            fs.writeFileSync("./tokens.json", "{}");
        }
        this.credentials = credentials;
        this.tokens = JSON.parse(fs.readFileSync("./tokens.json").toString());
    }

    async updateToken(audience) {
        const tokens = await this.loginUbi(this.credentials, audience);
        return Object.assign(tokens, { expire: Math.round(Date.now() / 1000) + 3600 });
    }

    saveToken() {
        fs.writeFileSync("./tokens.json", JSON.stringify(this.tokens));
    }

    async getToken(audience) {
        if (!this.tokens[audience] || Math.round(Date.now() / 1000) > this.tokens[audience].expire) {
            console.log("update token!");
            this.tokens[audience] = await this.updateToken(audience);
            this.saveToken();
        }
        return this.tokens[audience].accessToken;
    }

    async loginUbi(credentials, audience) {
        const headers = Object.assign(commonHeader, { "Ubi-AppId": "86263886-327a-4328-ac69-527f0d20a237", "Authorization": `Basic ${credentials}` });
        const body = JSON.stringify({ audience: audience });
        const response = await fetch("https://public-ubiservices.ubi.com/v3/profiles/sessions", { method: "POST", headers: headers, body: body });
        const res = await response.json();
        const headers2 = Object.assign(commonHeader, { "Authorization": `ubi_v1 t=${res.ticket}` });
        const response2 = await fetch("https://prod.trackmania.core.nadeo.online/v2/authentication/token/ubiservices", { method: "POST", headers: headers2, body: body });
        return response2.json();
    }

    async loginDedicatedAccount(credentials, audience) {
        const headers = Object.assign(commonHeader, { "Ubi-AppId": "86263886-327a-4328-ac69-527f0d20a237", "Authorization": `Basic ${credentials}` });
        const body = JSON.stringify({ audience: audience });
        const response = await fetch("https://prod.trackmania.core.nadeo.online/v2/authentication/token/basic", { method: "POST", headers: headers, body: body });
        return response.json();
    }

    async fetchUrl(url, token, method = "GET") {
        const response = await fetch(url, { method: method, headers: { "Authorization": `nadeo_v1 t=${token}` } });
        return response.json();
    }

    async getCompLeaderboard(competitionId, length) {
        const token = await this.getToken(AUDIENCE_CLUBSERVICES);
        return await this.fetchUrl(`https://competition.trackmania.nadeo.club/api/competitions/${competitionId}/leaderboard?length=${length}`, token);
    }

    async getCompetition(competitionId) {
        const token = await this.getToken(AUDIENCE_CLUBSERVICES);
        return await this.fetchUrl(`https://competition.trackmania.nadeo.club/api/competitions/${competitionId}`, token);
    }

    async getMapInfo(mapUid) {
        const token = await this.getToken(AUDIENCE_LIVESERVICES);
        return await this.fetchUrl(`https://live-services.trackmania.nadeo.live/api/token/map/${mapUid}`, token);
    }

    async getDisplayNames(list = []) {
        const token = await this.getToken(AUDIENCE_NADEOSERVICES);
        return await this.fetchUrl(`https://prod.trackmania.core.nadeo.online/accounts/displayNames/?accountIdList=${list.join(",")}`, token);
    }

    async getMapLeaderboards(mapUid, length = 100, offset = 0) {
        const token = await this.getToken(AUDIENCE_LIVESERVICES);
        return await this.fetchUrl(`https://live-services.trackmania.nadeo.live/api/token/leaderboard/group/Personal_Best/map/${mapUid}/top?length=${length}&onlyWorld=true&offset=${offset}`, token);
    }
}
