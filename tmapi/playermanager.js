import { GbxClient } from "@evotm/gbxclient";
import { LoginToUuid } from "./uuid.js";

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
    this.isSpectator = data.SpectatorStatus !== 0;
    this.spectatorTarget = parseInt(data.SpectatorStatus / 10000);
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
    this.players = [];
  }

  async onPlayerDisconnect(login) {
    let index = 0;
    for (const player of this.players) {
      if (player.login == login) break;
      index += 1;
    }
    this.players.splice(index, 1);
  }


  async getPlayerbyNick(nickname) {
    for (const player of this.players) {
      if (player.nick == nickname) return player;
    }
    return null;
  }

  async getPlayer(login) {
    for (const player of this.players) {
      if (player.login == login) return player;
    }

    const player = new Player();
    const data = await this.gbx.call("GetPlayerInfo", login);
    player.syncFromPlayerInfo(data);
    this.players.push(player);
    return player;
  }

  reset() {
    this.players = [];
  }

  async syncPlayers() {
    this.reset();
    const players = await this.gbx.call("GetPlayerList", 255,0);
    for(const i in players) {
      const player = new Player();
      player.syncFromPlayerInfo(players[i]);
      this.players.push(player);
    }
  }

  getPlayerById(id) {
    for(const player of this.players) {
      if (player.id == id) return player;
    }
    return new Player();
  }

  async onPlayerInfoChanged(data) {
    const player = await this.getPlayer(data.Login);
    const orig_login = player.login;
    player.syncFromPlayerInfo(data);
    if (orig_login == "") {
      this.players.push(player);
    }
    return player;
  }
}
