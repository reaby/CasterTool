import chalk from "chalk";
import TrackmaniaApi from "../tmapi/api.js";
import { Player } from "../tmapi/playermanager.js";
import cli from "../utils/cli.js";
import formatTime from "../utils/time.js";

export const EmptyMap = { uid: "", mapId: "", name: "", author: "", thumbnailUrl: "", fileUrl: "" };

export default class ApiCache {
    /**
     *
     * @param {TrackmaniaApi} api
     */
    constructor(api) {
        this.api = api;
        /**
         * map = { uid: "", mapId: "", name: "", author: "", thumbnailUrl: "", fileUrl: "" };
         */
        this.map = EmptyMap;

        /**
         * structure is players[uid] = login
         */
        this.players = {};

        /**
         * record[rank] = {rank: 1, nick: "nickname", uuid: "uuid", score: 12345, time: "0:12.345" }
         */
        this.records = {};
        this.spectatorTarget = new Player();
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

    syncPlayersFromServerData(players) {
        const out = {};
        for (const i in players) {
            const player = players[i];
            out[player.uuid] = player.nick;
        }
        this.players = Object.assign(this.players, out);
        return this.players;
    }

    /**
     *
     * @param {Player} player
     */
    getPB(player) {
        let out = {nick: player.nick, time: "-:--.---" };
        if (player.uuid !== "" && this.records[player.uuid]) {
            const record = this.records[player.uuid];
            out.time = record.time;
        }
        return out;
    }

    async fetchCurrentMapRecords(playerList = []) {
        if (!this.map.mapId) {
            return;
        }
        if (playerList.length > 0) {
            const mapRecords = await this.api.getMapRecords(this.map.mapId, playerList.join(","));
            const out = {};
            for (const i in mapRecords) {
                const record = mapRecords[i];
                if (record.code) continue;
                out[record.accountId] = { rank: -1, nick: this.players[record.accountId], uuid: record.accountId, score: record.recordScore.time, time: formatTime(record.recordScore.time) }
            }
            return out;
        } else {
            cli(chalk.red("Players list empty"), "Error");
        }
        return {};
    }

    async syncMapFromServerData(map) {
        if (map.UId && this.map.uid !== map.UId) {
            const apimap = await this.api.getMapInfo(map.UId);
            if (apimap) {
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
                let outRecords = {};
                for (const info of compResult) {
                    outRecords[info.accountId] = { rank: info.position, nick: names[info.accountId], uuid: info.accountId, score: info.score, time: formatTime(info.score) };
                }
                this.records = outRecords;
                const list = Object.keys(this.players);
                const recs = await this.fetchCurrentMapRecords(list);
                for (const uid in recs) {
                    if (!this.records[uid]) {
                        this.records[uid] = recs[uid];
                    }
                }
            } else {
                this.map = EmptyMap;
                this.records = {};
                cli("Map not found for world records.", "Error");
            }
        }
    }

    resetMap() {
        this.map = "";
    }
}