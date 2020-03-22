(function() {
    'use strict';
  }());

const base = require('./abstract-controller');
const aws = require('aws-sdk');
const mime = require('mime-types');

var s3 = new aws.S3();

exports.route = async (urlPath) => {

  return new Promise(function(resolve, reject) {
    try {
      getContent(resolve, reject, urlPath);
    } catch(e) {
      reject(err);
    }
  });
};

const getContent = (resolve, reject, urlPath) => {
  if (urlPath === '/' || urlPath.startsWith('/r/')) {
    urlPath = 'index.html';
  } else {
    urlPath = urlPath.replace(/^\/+/, '');
  }

  let params = { 
    Bucket: process.env.websiteS3Bucket,
    Key: urlPath
  };

  console.log(params);

  s3.getObject(params, function(err, data) {
        if (err) {
            console.error("getContent(" + urlPath + ") => " + err);
            resolve(base.NotFound(params.Key));
        } else {
            let mimeType = mime.lookup(urlPath);
            
            if (mimeType === 'image/png' ||
                    mimeType === 'image/jpeg' ||
                    mimeType === 'image/x-icon') {
                // Serve binary content with base64 encoding
                resolve(base.response(200, data.Body.toString('base64'), mimeType, true)); 
            } else {
                resolve(base.response(200, data.Body.toString(), mimeType));
            }
        }
    });
};