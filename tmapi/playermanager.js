import { GbxClient } from "@evotm/gbxclient";
import { LoginToUuid } from "./uuid.js";
import cli from "../utils/cli.js";

export class Player {

  constructor() {
    this.login = "";
    this.nick = "";
    this.uuid = "";
    this.id = -1;
    this.isSpectator = true;
    this.spectatorTarget = 0;
  }

  syncFromPlayerInfo(data) {
    this.login = data.Login;
    this.uuid = LoginToUuid(data.Login);
    this.nick = data.NickName;
    this.id = data.PlayerId;
    this.isSpectator = data.SpectatorStatus != 0;
    this.spectatorTarget = Math.floor(data.SpectatorStatus / 10000);
  }
}

export default class PlayerManager {
  /**
   *
   * @param {GbxClient} gbx
   * @memberof PlayerManager
   */
  constructor(gbx) {
    this.gbx = gbx;
    this.players = {};
  }

  async onPlayerDisconnect(login) {
    delete this.players[login];
  }


  async getPlayerbyNick(nickname) {
    for (const i of this.players) {
      const player = this.players[i];
      if (player.nick == nickname) return player;
    }
    return null;
  }

  async getPlayer(login) {
    for (const Login in this.players) {
      if (Login == login) return this.players[Login];
    }

    const player = new Player();
    const data = await this.gbx.call("GetPlayerInfo", login);
    player.syncFromPlayerInfo(data);
    this.players[login] = player;
    return player;
  }

  reset() {
    this.players = {};
  }

  async syncPlayers() {
    this.reset();
    const players = await this.gbx.call("GetPlayerList", 255,0);
    cli("Syncing players...", "game");
    for(const i in players) {
      const player = new Player();
      player.syncFromPlayerInfo(players[i]);
      this.players[player.login] = player;
    }
    return this.players;
  }

  getPlayerById(id) {
    for(const i in this.players) {
      const player = this.players[i];
      if (player.id == id) return player;
    }
    return new Player();
  }

  async onPlayerInfoChanged(data) {
    const player = await this.getPlayer(data.Login);
    player.syncFromPlayerInfo(data);
    this.players[player.login] = player;
    return player;
  }
}