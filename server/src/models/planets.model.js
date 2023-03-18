const fs = require('fs');
const path = require('path')
const { parse } = require('csv-parse');

const planets = require('./planets.mongo');

// this array will receive our data.
const habitablePlanets = [];

function isHabitablePlanets(planet) {
    return planet['koi_disposition'] === 'CONFIRMED'
      && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
      && planet['koi_prad'] < 1.6;
}


function loadPlanetsData() {
    return new Promise((resolve, reject) => {
            // rading kepler_data as a stream
     fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
        // pipe is the destination of my kepler_data
        .pipe(parse({
            comment: '#',
            columns: true,
        }))
        .on('data', async (data) => {
            if (isHabitablePlanets(data)) {
                savePlanet(data);
            } 
        })
        .on('error', (err) => {
            console.log(err)
            reject(err);
        })
        .on('end', async () => {
            const countPlanetsFound = (await getAllPlanets()).length;
            console.log(`${countPlanetsFound} habitable planets found! `);
            resolve();
        });

    });  
}

    async function getAllPlanets() {
        return await planets.find({}, /* to exclude some fields from our response in mongo */ {
            '_id': 0, '__v': 0,
        });
    }

    // upsert method (if planets exist in our db)
    async function savePlanet(planet) {
        try {
            await planets.updateOne({keplerName: planet.kepler_name,}, {keplerName: planet.kepler_name,}, { upsert: true });
        } catch (err) {
            console.error(`Could not save planet ${err}`);
        }
       
    }


module.exports = {  loadPlanetsData, getAllPlanets }