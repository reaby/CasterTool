import { Router } from 'express';
import TrackmaniaApi from '../tmapi/api.js';
import formatTime from '../utils/time.js'

/**
 *
 * @param {TrackmaniaApi} api
 * @returns
 */

export default function (api) {
    const router = Router();

    async function getNames(list) {
        const namesResult = await api.getDisplayNames(list);
        const out = {};
        for (const info of namesResult) {
          out[info.accountId] = info.displayName;
        }
        return out;
      }


    router.get('/', async (req, res, next) => {
        res.render('index', {});
    });


  router.get('/map', async (req, res, next) => {
    if (!req.query["uid"]) {
      res.end("query string for '?uid=[mapuid]' is missing.");
      return;
    }
    const maps = req.query["uid"].split(",");
    let outData = [];

    for(const mapUid of maps) {
      let map = await api.getMapInfo(mapUid.trim());
      if (!map) {
        res.end("error.");
        return;
      }

      const author = await getNames([map.author]);
      map.authorNick = author[map.author];
      const leaderboard = await api.getMapLeaderboards(mapUid.trim(), 10);
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
      outData.push({map: map, recs: records});
    }

    res.render('map', { mapList: outData });
  });


    return router;
};

