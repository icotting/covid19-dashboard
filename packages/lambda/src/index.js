(function () {
    'use strict';
}());

const static = require('./controllers/static-content-controller');
const router = require('./router');

exports.handler = main;

async function main(event) {

    try {
        if (event.path.startsWith("/api/v1")) {
            return await router.route(event.path);
        } else {
            return await static.route(event.path);
        }
    } catch (e) { 
        return e;
    }
}