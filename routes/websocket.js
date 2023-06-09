const ApiCache = require('../modules/apiCache.js');
const { Socket } = require('socket.io');
const XmlRPC = require('../tmapi/xmlrpc.js');
const Events = require('../modules/events.js');
const cli = require('../utils/cli.js');

exports.Websocket = class Websocket {
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
            this.io.emit("front.SpectChange", this.cache.getPB(player));
        });

        io.on("connect", async (socket) => {
            cli("Client Connected", "WebSocket");
            this.syncFront();

            socket.on("back.getRecords", () => {
                socket.send("front.Records", this.cache.records);
            });

            socket.on("back.getMap", () => {
                socket.send("front.Map", this.cache.map);
            });

        });
    }

    syncFront() {
        this.io.emit("front.Map", this.cache.map);
        this.io.emit("front.Records", this.cache.records);
        this.io.emit("front.SpectChange", this.cache.getPB(this.cache.spectatorTarget));
    }
}