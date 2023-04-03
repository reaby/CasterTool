import { Router } from 'express';
import TrackmaniaApi from '../tmapi/api.js';
import formatTime from '../utils/time.js'
import settings from '../utils/settings.js';

/**
 *
 * @param {TrackmaniaApi} api
 * @returns
 */

export default function (api) {
    const router = Router()

    router.get('/leaderboard', async (req, res, next) => {
        const conf = settings.get()
        const result = await api.getCompLeaderboard(conf.competitionId, 100);
        let list = [];
        for(const info of result) {
            list.push(info.participant);
        }
        const names = await api.getNames(list);
        for(const i in result) {
            const info = result[i];
            info['name'] = names[info.participant];
        }
        res.render('competition/leaderboard', { data: result})
    });

    return router
}