const request = require('supertest');
const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');
const { loadPlanetsData, } = require('../../models/planets.model')


// launches api is nested test for our get and post endpoints.
describe('Launches API', () => {

    //beforeall will load first before the endpoint test kickstart
    beforeAll(async () => {
        await mongoConnect();
        await loadPlanetsData;
        await new Promise(resolve => setTimeout(() => resolve(), 1000));
    });

    afterAll(async () => {
        await mongoDisconnect();
    });


    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app).get('/v1/launches')
            .expect('Content-Type', /json/)
            .expect(200);
        });
    });
    
    describe('Test POST /launches', () => {
        const completeLaunchData = {
            mission: 'USS Enterprice',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
            launchDate: 'January 4, 2028', 
        };
    
        const launchDataWithoutDate = {
            mission: 'USS Enterprice',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
        };
    
        const launchDataWithInvalidDate = {
            mission: 'USS Enterprice',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
            launchDate: 'hello',
        };
    
        test('It should response with 201 created', async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(completeLaunchData)
            .expect('Content-Type', /json/)
            .expect(201);
    
    
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
            
            expect(response.body).toMatchObject(launchDataWithoutDate);
        });
    
        test('It should catch missing required properties', async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWithoutDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
           expect(response.body).toStrictEqual({
            error: 'Missing Required Launch Property'
           });
        });
        test('It should catch invalid dates', async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWithInvalidDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
           expect(response.body).toStrictEqual({
            error: 'Invalid Launch Date'
           });
        });
    });
});


