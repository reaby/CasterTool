import ApiCache from "../modules/apiCache.js";
import { Socket } from "socket.io";
import XmlRPC from "../tmapi/xmlrpc.js";
import Events from "../modules/events.js";
import cli from "../utils/cli.js";

export default class Websocket {
    /**
     *
     * @param {XmlRPC} rpc
     * @param {ApiCache} cache
     * @param {Socket} io
     * @param {Events} events
     */
    constructor(rpc, cache, io, events) {
        this.rpc = rpc;
        this.cache = cache;
        this.io = io;
        this.events = events;

        events.on("sync", () => {
            this.syncFront();
        });

        events.on("specTargetChanged", (player) => {
            this.io.emit("front.SpectChange", player);
        });

        io.on("connect", async (socket) => {
            cli("Client Connected", "WebSocket");
            this.syncFront();

            socket.on("back.getRecords", () => {
                socket.send("front.records", this.cache.records);
            });

            socket.on("back.getMap", () => {
                socket.send("front.Map", this.cache.map);
            });

        });
    }


    syncFront() {
        this.io.emit("front.Map", this.cache.map);
        this.io.emit("front.Records", this.cache.records);
    }
}