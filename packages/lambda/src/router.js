(function () {
    'use strict';
}());

const base = require('./controllers/abstract-controller');

exports.route = async (path) => {

    if (path.startsWith("/api/v1")) {
        try {
            let controller_path = path.substring(7); 
            return base.response(200, JSON.stringify({path: controller_path, message: "hello world"}), "application/json");
        } catch (e) {
            return base.Error(e);
        }
    } else {
       return base.NotFound(path);
    }
}