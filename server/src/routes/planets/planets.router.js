const express = require('express')

const { httpGetAllPlanets } = require('./planets.controller')

const planetsRouter = express.Router()

planetsRouter.get('/v1/planets', httpGetAllPlanets)


module.exports = planetsRouter