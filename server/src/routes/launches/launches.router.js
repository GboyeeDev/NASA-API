const express = require('express');

const { httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch } = require('./launches.controller')

const launchesRouter = express.Router();

launchesRouter.get('/v1/launches', httpGetAllLaunches)
launchesRouter.post('/v1/launches', httpAddNewLaunch)
launchesRouter.delete('/launches/:id', httpAbortLaunch)

module.exports = launchesRouter