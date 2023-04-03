import { Router } from 'express';
import TrackmaniaApi from '../tmapi/api.js';
import formatTime from '../utils/time.js'
import { GbxClient } from '@evotm/gbxclient';

/**
 *
 * @param {TrackmaniaApi} api
 * @param {GbxClient} tmclient
 * @returns
 */

export default function (api, tmclient) {
  const router = Router();

  router.get('/top10', async (req, res, next) => {
    try {
      const mapinfo = await tmclient.gbx.call("GetCurrentMapInfo");

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
      const names = await api.getNames(fetchNames);
      let records = [];

      for (const info of compResult) {
        records.push({ rank: info.position, name: names[info.accountId], time: formatTime(info.score) });
      }

      res.render('common/map', { mapList: [{ map: map, recs: records }] });
    } catch (e) {
      res.end("Couldn't connect local TM instance.");
    }
  });

  router.get('/top1', async (req, res, next) => {
    try {
      const mapinfo = await tmclient.gbx.call("GetCurrentMapInfo");
      const map = await api.getMapInfo(mapinfo.UId);
      if (!map) {
        res.end("error.");
        return;
      }

      const leaderboard = await api.getMapLeaderboards(mapinfo.UId, 1);
      const compResult = [];
      const fetchNames = [];
      for (const info of leaderboard.tops[0].top) {
        compResult.push(info);
        fetchNames.push(info.accountId);
      }
      const names = await api.getNames(fetchNames);
      let rec = { name: "", time: "" };

      for (const info of compResult) {
        rec.name = names[info.accountId];
        rec.time = formatTime(info.score);
      }

      res.render('game/top1', { map: map, rec: rec });
    } catch (e) {
      res.end("Couldn't connect local TM instance.");
    }
  });

  router.get('/dashboard', async (req, res, next) => {
    res.render("game/dashboard");
  });

  router.get('/tmwt', async (req, res, next) => {
    res.render("game/tmwt");
  });

  return router;
}
