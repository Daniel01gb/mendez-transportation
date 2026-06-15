const serverless = require('serverless-http');
const { connectLambda } = require('@netlify/blobs');
const { app } = require('../../app');

exports.handler = async (event, context) => {
  /* Debug endpoint — check what Netlify injects for Blobs */
  if (event.path === '/api/debug-blobs') {
    let connectErr = null;
    try { connectLambda(event); } catch (e) { connectErr = e.message; }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hasBlobs: !!event.blobs,
        blobsPreview: event.blobs ? String(event.blobs).substring(0, 80) : null,
        connectError: connectErr,
        headers: {
          'x-nf-site-id': event.headers['x-nf-site-id'] || null,
          'x-nf-deploy-id': event.headers['x-nf-deploy-id'] || null,
        },
        env: {
          NETLIFY_BLOBS_CONTEXT: process.env.NETLIFY_BLOBS_CONTEXT ? 'SET' : 'NOT_SET',
          NETLIFY_SITE_ID: process.env.NETLIFY_SITE_ID || 'NOT_SET',
        }
      })
    };
  }

  try { connectLambda(event); } catch (_) {}
  return serverless(app)(event, context);
};
