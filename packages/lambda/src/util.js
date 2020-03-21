(function () {
    'use strict';
}());

const aws = require('aws-sdk')
const s3 = new aws.S3();

const CACHE_BUCKET = process.env.websiteS3Bucket;

exports.uploadToWebCache = (key, data) => {
    let params = { 
        Bucket: CACHE_BUCKET,
        Body: data,
        Key: key
      };

      s3.putObject(params, function(err, data) {
        if (err) {
            throw err;
        }
    });
};