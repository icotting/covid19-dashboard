(function () {
    'use strict';
}());

const static = require('./controllers/static-content-controller');
const router = require('./router');

exports.handler = async (event) => {
    try {
        if (event.path.startsWith("/api/v1")) {
            return await router.route(event.path);
        } else {
            console.log(event.path);
            return await static.route(event.path);
        }
    } catch (e) { 
        return e;
    }
}