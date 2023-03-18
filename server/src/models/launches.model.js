const axios = require('axios');
const launchesDatabase = require('./launches.mongo');
const planets = require('./planets.mongo');

// const launches = new Map();

// let latestFlightNumber = 100;

const DEFAULT_FLIGHT_NUMBER = 100;

//space x url
const SPACE_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
    console.log('Downloading launch data...');
    const response = await axios.post(SPACE_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        'customers': 1
                    }
                }
            ]
        }
    });

    if (response.status !== 200) {
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed');
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        });

    const launch = {
        flightNumber: launchDoc['flight_number'],
        mission: launchDoc['name'],
        rocket: launchDoc['rocket']['name'],
        launchDate: launchDoc['date_unix'],
        upcoming: launchDoc['upcoming'],
        success: launchDoc['success'],
        customers,
    };


    console.log(`${launch.flightNumber} ${launch.mission}`);

    //populate launches collection...
    await saveLaunch(launch);
    }
}

// using axios package for making http requests from an api
async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });

    if (firstLaunch) {
        console.log('Launch data already loaded');
        return;
    } else {
        await populateLaunches();
    }
    
};




// memory storage not persistent
// launches.set(launch.flightNumber, launch);

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}


async function getAllLaunches(skip, limit) {
    return await launchesDatabase.find({}, { '_id': 0, '__v': 0, })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}


async function saveLaunch(launch) {
    // upsert method (if lauches exist in our db)
    await launchesDatabase.findOneAndUpdate({flightNumber: launch.flightNumber,}, launch, {upsert: true,});
}


async function scheduleNewLaunch(launch) {
    // validating if planets in planetsmodel is real
    const planet = await planets.findOne({ keplerName: launch.target, });
    if (!planet) {
        throw new Error('No matching planet found');
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ['Zero to Mastery', 'NASA' ],
        flightNumber: newFlightNumber,
    });

    await saveLaunch(newLaunch);
}


/* function addNewLaunch(launch) {
    latestFlightNumber++;
    launches.set(latestFlightNumber,
     Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ['ZTM', 'NASA'],
        flightNumber: latestFlightNumber,
    }));
} */


async function abortLaunchById(launchId) {
    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });
    
    // outdated feature in mongoose
    // return aborted.ok === 1 && aborted.nModified === 1;
    return aborted.modifiedCount === 1;
    //const aborted = launches.get(launchId);
    //aborted.upcoming = false;
    //aborted.success = false;
    //return aborted;
}

module.exports = {
    loadLaunchData,
    existsLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById,
}