const { getAllLaunches, existsLaunchWithId, abortLaunchById, scheduleNewLaunch, } = require('../../models/launches.model');

const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
    // this turns the objects from the launches model into an array for json to send data to front end
    // return res.status(200).json(Array.from(launches.values()));
    const { skip, limit } = getPagination(req.query);
    const launches = await getAllLaunches(skip, limit);
    return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body;

    // to validate the post request
    if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
        return res.status(400).json({ error: 'Missing Required Launch Property' })
    }

    // converting the date from object to string 
    launch.launchDate = new Date(launch.launchDate);

    // validating the date fields in case of errors
    if (isNaN(launch.launchDate)) {
        return res.status(400).json({ error: 'Invalid Launch Date' })
    }

    await scheduleNewLaunch(launch);
    return res.status(201).json(launch);
}


async function httpAbortLaunch(req, res) {
    // convert strings to number (latestflight number - 100)
    const launchId = Number(req.params.id);

    //if launch does not exist
    const existsLaunch = await existsLaunchWithId(launchId);
    if (!existsLaunch) { 
        return res.status(404).json({ error: 'Launch does not exist' });
    }

    // if launch exists
    const aborted = abortLaunchById(launchId);
    if (!aborted) {
        return res.status(400).json({error: 'Launch not aborted', });
    }
    return res.status(200).json({ ok: true, });
}

module.exports ={ httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch }