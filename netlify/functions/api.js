const serverless = require('serverless-http');
const { connectLambda } = require('@netlify/blobs');
const { app } = require('../../app');

exports.handler = async (event, context) => {
  /* Initialize Netlify Blobs from the Lambda event before Express runs */
  try { connectLambda(event); } catch (_) {}
  return serverless(app)(event, context);
};
