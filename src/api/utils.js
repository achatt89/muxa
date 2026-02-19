function extractTextFromMessages(messages = []) {
  if (!Array.isArray(messages)) {
    return '';
  }

  return messages
    .map((msg) => {
      if (!msg) {
        return '';
      }

      if (typeof msg.content === 'string') {
        return msg.content;
      }

      if (Array.isArray(msg.content)) {
        return msg.content
          .map((block) => {
            if (typeof block === 'string') {
              return block;
            }
            if (block && block.text) {
              return block.text;
            }
            return '';
          })
          .join(' ');
      }

      return '';
    })
    .join(' ')
    .trim();
}

function approximateTokensFromText(text) {
  if (!text) {
    return 0;
  }

  return Math.max(1, Math.ceil(text.length / 4));
}

module.exports = {
  extractTextFromMessages,
  approximateTokensFromText
};
