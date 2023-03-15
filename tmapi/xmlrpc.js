import { GbxClient } from '@evotm/gbxclient';
import cli from '../utils/cli.js';
import chalk from 'chalk';
import PlayerManager, { Player } from './playermanager.js';
import Events from '../modules/events.js';
import ApiCache, { EmptyMap } from '../modules/apiCache.js';

export default class XmlRPC {

    /**
    *
    * @param {ApiCache} apiCache
    * @param {Events} events
    */
    constructor(apiCache, events) {
        this.playerManager = null;
        this.currentPlayer = new Player();
        this.apicache = apiCache;
        this.apicache.spectatorTarget = new Player();
        this.events = events;
        this.map = {};
        this.connect();
    }

    async sync() {
        cli("Syncing server status...", "game");
        const info = await this.gbx.call("GetSystemInfo");
        this.currentPlayer = await this.playerManager?.getPlayer(info.ServerLogin);
        try {
            const map = await this.gbx.call("GetCurrentMapInfo");
            this.map = map;

            const players = await this.playerManager?.syncPlayers();

            this.apicache.resetPlayers();
            this.apicache.syncPlayersFromServerData(players);

            await this.apicache.syncMapFromServerData(map);
        } catch (e) {
            cli("Couldn't sync current map of game", "game");
        }

        this.events.emit("sync");  /** @see {Websocket} **/
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
            // await playerManager.onPlayerConnect(data[0]);   // no need, as the player status changes...
        });

        gbx.on("ManiaPlanet.PlayerInfoChanged", async (data) => {
            if (data[0]) {
                const player = await playerManager.onPlayerInfoChanged(data[0]);
                if (player.login == this.currentPlayer.login) {
                    const spec = playerManager.getPlayerById(player.spectatorTarget);
                    this.apicache.spectatorTarget = spec;
                    this.events.emit("specTargetChanged", spec); /** @see {Websocket} **/
                }
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

        gbx.on("ManiaPlanet.EndMap", async () => {
            this.map = {};
            this.apicache.resetMap();
            this.apicache.spectatorTarget = new Player();
            cli("Clear map and spectator data", "game");
            this.events.emit("sync");  /** @see {Websocket} **/
        });

        gbx.on("ManiaPlanet.EndMatch", async () => {
            this.map = {};
            this.apicache.resetMap();
            this.apicache.spectatorTarget = new Player();
            cli("Clear map and spectator data", "game");
            this.events.emit("sync");  /** @see {Websocket} **/
        });

        gbx.on("callback", (name, data) => {
            //cli(chalk.bold.cyan(name), "game");
            // console.log(data);
        });

        await this.gbx.connect("127.0.0.1", 5000);
    }
}