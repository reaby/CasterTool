import { Router } from 'express';
import TrackmaniaApi from '../tmapi/api.js';
import formatTime from '../utils/time.js'
import { GbxClient } from '@evotm/gbxclient';

/**
 *
 * @param {TrackmaniaApi} api
 * @returns
 */

export default function (api) {
  async function getNames(list) {
    const namesResult = await api.getDisplayNames(list);
    const out = {};
    for (const info of namesResult) {
      out[info.accountId] = info.displayName;
    }
    return out;
  }

  const router = Router();

  router.get('/top10', async (req, res, next) => {
    try {
      const gbx = new GbxClient();
      await gbx.connect("127.0.0.1", 5000);
      await gbx.call("Authenticate", "SuperAdmin", "SuperAdmin");
      const mapinfo = await gbx.call("GetCurrentMapInfo");
      await gbx.disconnect();

      const map = await api.getMapInfo(mapinfo.UId);
      if (!map) {
        res.end("error.");
        return;
      }

      const leaderboard = await api.getMapLeaderboards(mapinfo.UId, 10);
      const compResult = [];
      const fetchNames = [];
      for (const info of leaderboard.tops[0].top) {
        compResult.push(info);
        fetchNames.push(info.accountId);
      }
      const names = await getNames(fetchNames);
      let records = [];

      for (const info of compResult) {
        records.push({ rank: info.position, name: names[info.accountId], time: formatTime(info.score) });
      }

      res.render('map', { map: map, recs: records });
    } catch (e) {
      res.end("Couldn't connect local TM instance.");
    }
  });

  router.get('/map', async (req, res, next) => {
    if (!req.query["uid"]) {
      res.end("uid missing.");
      return;
    }

    const map = await api.getMapInfo(req.query["uid"]);
    if (!map) {
      res.end("error.");
      return;
    }

    const leaderboard = await api.getMapLeaderboards(req.query["uid"], 10);
    const compResult = [];
    const fetchNames = [];
    for (const info of leaderboard.tops[0].top) {
      compResult.push(info);
      fetchNames.push(info.accountId);
    }
    const names = await getNames(fetchNames);
    let records = [];

    for (const info of compResult) {
      records.push({ rank: info.position, name: names[info.accountId], time: formatTime(info.score) });
    }

    res.render('map', { map: map, recs: records });
  });

  return router;
};
