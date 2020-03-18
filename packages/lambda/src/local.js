(function () {
    'use strict';
}());

/* Local express server for testing the controllers used by the Lambda function */

const express = require('express')
const app = express()
const port = 8080
const lambda = require('./index')

app.get('/*', (req, res) => {
  lambda.handler({path: req.originalUrl}).then((response) => {
    res.status(response.statusCode);
    res.setHeader('Content-Type', response.headers['Content-Type']);
    res.send(response.body);

  }).catch((err) => {

  });
});

console.log("Using S3 bucket: "+process.env.webCacheBucket);
app.listen(port, () => console.log(`EC2 Classis Local dev server listening on port ${port}!`))
