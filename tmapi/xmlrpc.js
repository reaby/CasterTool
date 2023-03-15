import { GbxClient } from '@evotm/gbxclient';
import { Socket } from 'socket.io';
import cli from '../utils/cli.js';
import chalk from 'chalk';
import PlayerManager from './playermanager.js';
import Events from '../modules/events.js';
import ApiCache from '../modules/apiCache.js';

export default class XmlRPC {

    /**
    *
    * @param {ApiCache} apiCache
    * @param {Events} events
    */
    constructor(apiCache, events) {
        this.playerManager = null;
        this.currentPlayer = {};
        this.spectatorUuid = "";
        this.apicache = apiCache;
        this.events = events;
        this.map = {};
        this.connect();
    }

    async sync() {
        const info = await this.gbx.call("GetSystemInfo");
        this.currentPlayer = await this.playerManager?.getPlayer(info.ServerLogin);
        try {
        const map = await this.gbx.call("GetCurrentMapInfo");
        this.map = map;
        await this.apicache.syncMapFromServerData(map);
        } catch (e) {
            cli("Couldn't sync current map of game", "game");
        }
        const players = await this.playerManager?.syncPlayers();
        await this.apicache.syncPlayersFromServerData(players);
        this.events.emit("sync");
    }

    async connect() {
        cli("Attempting link to local game client...", "info")
        const gbx = new GbxClient();
        const playerManager = new PlayerManager(gbx);
        this.playerManager = playerManager;
        this.gbx = gbx;

        const io = this.io;

        gbx.on("connect", async () => {
            cli(chalk.bold.green("Connected"), "game");
            await gbx.call("SetApiVersion", "2013-04-16");
            await gbx.call("EnableCallbacks", true);
            try {
              await gbx.call("Authenticate", "SuperAdmin", "SuperAdmin");
              await this.sync();
            } catch (e) {
             cli("Authenticate to server failed.", "game");
             console.log(e);
            }
        });

        gbx.on("disconnect", async () => {
            cli("Game link: " + chalk.bold.red("Disconnected!"), "game")
            cli("Retrying in 5 seconds... Hold on...", "info");
            setTimeout(() => {
                this.connect();
            }, 5000);
        });

        gbx.on("ManiaPlanet.PlayerDisconnect", async (data) => {
            await playerManager.onPlayerDisconnect(data[0]);
          });

        gbx.on("ManiaPlanet.PlayerConnect", async (data) => {
            // await playerManager.onPlayerConnect(event[0]);   // no need, as the player status changes...
        });

        gbx.on("ManiaPlanet.PlayerInfoChanged", async (data) => {
            const player = await playerManager.onPlayerInfoChanged(data[0]);
            if (player.login == this.currentPlayer.login) {
                const spec = playerManager.getPlayerById(player.spectatorTarget);
                this.events.emit("specTargetChanged", spec);
            }
        });

        gbx.on("ManiaPlanet.BeginMatch", async () => {
            await this.sync();
        });

        gbx.on("ManiaPlanet.BeginMap", async (data) => {
            const map = data[0];
            this.map = map;
            await this.sync();
        });

        gbx.on("callback", (name, data) => {
            cli(chalk.bold.cyan(name), "game");
            console.log(data);
        });

        await this.gbx.connect("127.0.0.1", 5000);
    }
}