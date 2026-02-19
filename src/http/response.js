function respondJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json');
  res.setHeader('content-length', Buffer.byteLength(body));
  res.end(body);
}

function respondError(res, statusCode, message, code = 'ERROR', meta = {}) {
  respondJson(res, statusCode, {
    error: code,
    message,
    ...meta
  });
}

function writeSse(res, event, data) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const eventPrefix = event ? `event: ${event}\n` : '';
  res.write(`${eventPrefix}data: ${payload}\n\n`);
}

module.exports = {
  respondJson,
  respondError,
  writeSse
};
