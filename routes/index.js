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

