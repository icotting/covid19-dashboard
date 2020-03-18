(function () {
    'use strict';
}());

const base = require('./controllers/abstract-controller');

exports.route = async (path) => {

    if (path.startsWith("/api/v1")) {
        try {
            let controller_path = path.substring(7); 
            console.log(controller_path);
            //TODO implement any API routes that might be needed
            return base.NotFound(path);
        } catch (e) {
            return base.Error(e);
        }
    } else {
       return base.NotFound(path);
    }
}