(function() {
  'use strict';
}());

exports.response = sendResponse;

exports.NotFound = (path) => {
  return sendResponse(404, JSON.stringify({status: 'Not Found', urlPath: path}), 'application/json');
}

exports.Error = (e) => {
  return sendResponse(500, JSON.stringify(e), "application/json");
}

function sendResponse(statusCode, body, contentType, isBase64Encoded = false) {
  return {
    statusCode: statusCode,
    isBase64Encoded: isBase64Encoded,
    body: body,
    headers: {
      'Content-Type': contentType
    }
  };
};