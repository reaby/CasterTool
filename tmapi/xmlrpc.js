import { GbxClient } from '@evotm/gbxclient';
import { Socket } from 'socket.io';
import cli from '../utils/cli.js';
import chalk from 'chalk';
import PlayerManager from './playermanager.js';

export default class XmlRPC {

    /**
    *
    * @param {Socket} io
    */
    constructor(io) {
        this.io = io;
        this.playerManager = null;
        this.currentPlayer = {};
        this.spectatorUuid = "";
        this.map = {};
        this.connect();
    }

    async sync() {
        const info = await this.gbx.call("GetSystemInfo");
        this.currentPlayer = await this.playerManager?.getPlayer(info.ServerLogin);
        try {
        this.map = await this.gbx.call("GetCurrentMapInfo");
        } catch (e) {
            cli("Couldn't sync current map of game", "game");
        }
        await this.playerManager?.syncPlayers();
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
                cli("i'm speccing: " + spec.nick);
            }
        });

        gbx.on("ManiaPlanet.BeginMatch", async () => {
            await this.sync();
        });

        gbx.on("ManiaPlanet.BeginMap", async (data) => {
            this.map = data[0];
        });

        gbx.on("callback", (name, data) => {
            console.log(name, data);
        });

        await this.gbx.connect("127.0.0.1", 5000);
    }
}