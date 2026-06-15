const serverless = require('serverless-http');
const { connectLambda } = require('@netlify/blobs');
const { app } = require('../../app');

exports.handler = async (event, context) => {
  let connectErr = null;
  try { connectLambda(event); } catch (e) { connectErr = e.message; }

  /* Expose debug info via process global for the /api/debug-blobs route */
  process._blobsDebug = {
    hasEventBlobs: !!event.blobs,
    blobsPreview:  event.blobs ? String(event.blobs).substring(0, 60) : null,
    connectError:  connectErr,
    siteIdHeader:  event.headers && event.headers['x-nf-site-id']   || null,
    deployIdHeader: event.headers && event.headers['x-nf-deploy-id'] || null,
    env_BLOBS_CTX:  process.env.NETLIFY_BLOBS_CONTEXT ? 'SET' : 'NOT_SET',
    env_SITE_ID:    process.env.NETLIFY_SITE_ID || 'NOT_SET',
  };

  return serverless(app)(event, context);
};
