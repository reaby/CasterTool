const { Router } = require('express')
const TrackmaniaApi = require('../tmapi/api.js')
const formatTime = require('../utils/time.js')
const settings = require('../utils/settings.js')

/**
 *
 * @param {TrackmaniaApi} api
 * @returns
 */

module.exports = function (api) {
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