function parseSse(body) {
  return body
    .trim()
    .split('\n\n')
    .filter(Boolean)
    .map((chunk) => {
      let event = null;
      let rawData = null;
      chunk.split('\n').forEach((line) => {
        if (line.startsWith('event: ')) {
          event = line.slice(7);
        } else if (line.startsWith('data: ')) {
          rawData = line.slice(6);
        }
      });
      if (!rawData) {
        return { event, data: null };
      }
      if (rawData === '[DONE]') {
        return { event, data: '[DONE]' };
      }
      return {
        event,
        data: JSON.parse(rawData)
      };
    });
}

module.exports = { parseSse };
