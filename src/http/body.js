async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    if (chunk === undefined || chunk === null) {
      continue;
    }
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
      continue;
    }
    if (chunk instanceof ArrayBuffer) {
      chunks.push(Buffer.from(chunk));
      continue;
    }
    if (ArrayBuffer.isView(chunk)) {
      chunks.push(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength));
      continue;
    }
    chunks.push(Buffer.from(String(chunk)));
  }
  if (chunks.length === 0) {
    return '';
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    error.message = 'Invalid JSON payload';
    throw error;
  }
}

module.exports = {
  readBody,
  readJson
};
