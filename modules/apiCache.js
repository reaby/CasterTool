import TrackmaniaApi from "../tmapi/api.js";
import cli from "../utils/cli.js";
import formatTime from "../utils/time.js";

export default class ApiCache {
    /**
     *
     * @param {TrackmaniaApi} api
     */
    constructor(api) {
        this.api = api;

        this.map = {};

        /**
         * structure is players[uid] = login
         */
        this.players = {};

        /**
         * record[rank] = {rank: 1, nick: "nickname", uuid: "uuid", score: 12345, time: "0:12.345" }
         */
        this.records = {};

    }

    resetPlayers() {
        this.players = {};
    }

    async getNames(list) {
        const namesResult = await this.api.getDisplayNames(list);
        const out = {};
        for (const info of namesResult) {
            out[info.accountId] = info.displayName;
        }
        return out;
    }

    async SyncPlayersFromUuidList(list = []) {
        let newList = [];

        for (const uuid of list) {
            if (!Object.keys(this.players).includes(uuid)) {
                newList.push(uuid);
            }
        }

        if (newList.length > 0) {
            const namesResult = await this.api.getDisplayNames(list);
            const out = {};
            for (const info of namesResult) {
                out[info.accountId] = info.displayName;
            }
            this.players = Object.assign(this.players, out);
        }
        return this.players;
    }

    async syncPlayersFromServerData(players) {
        const out = {};
        for (const i in players) {
            const player = players[i];
            out[player.uuid] = player.nick;
        }
        this.players = Object.assign(this.players, out);
        return this.players;
    }

    async syncMapFromServerData(map) {
        if (map.UId && this.map.uid !== map.UId) {
            const apimap = await this.api.getMapInfo(map.UId);

            if (!apimap.code) {
                this.map = { uid: map.UId, mapId: apimap.mapId, name: map.Name, author: map.AuthorNickname, thumbnailUrl: apimap.thumbnailUrl, fileUrl: apimap.fileUrl };
                cli("Fetching leaderboards for map: " + map.Name, "Api");
                const leaderboard = await this.api.getMapLeaderboards(map.UId, 50);
                const compResult = [];
                const fetchNames = [];
                for (const info of leaderboard.tops[0].top) {
                    compResult.push(info);
                    fetchNames.push(info.accountId);
                }
                const names = await this.getNames(fetchNames);
                let records = {};
                for (const info of compResult) {
                    records[info.position] = { rank: info.position, nick: names[info.accountId], uuid: info.accountId, score: info.score, time: formatTime(info.score) };
                }
                this.records = records;
            } else {
                this.map = { uid: "", mapId: "", name: "", author: "", thumbnailUrl: "", fileUrl: "" };
                this.records = {};
                cli("Map not found for world records.", "Error");
            }
        }
    }

    resetMap() {
        this.map = "";
    }
}