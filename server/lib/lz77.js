const MAGIC = Buffer.from([0x4c, 0x5a, 0x37, 0x37]); // "LZ77"
const WINDOW_SIZE = 32768;
const MAX_MATCH_LEN = 255;
const MIN_MATCH_LEN = 3;

function compress(inputBuffer) {
  const tokens = [];
  let pos = 0;

  while (pos < inputBuffer.length) {
    const windowStart = Math.max(0, pos - WINDOW_SIZE);
    let bestOffset = 0;
    let bestLength = 0;

    for (let i = windowStart; i < pos; i++) {
      let matchLen = 0;
      while (
        matchLen < MAX_MATCH_LEN &&
        pos + matchLen < inputBuffer.length &&
        inputBuffer[i + matchLen] === inputBuffer[pos + matchLen]
      ) {
        matchLen++;
      }
      if (matchLen > bestLength) {
        bestLength = matchLen;
        bestOffset = pos - i;
      }
    }

    if (bestLength >= MIN_MATCH_LEN) {
      tokens.push({ type: 'match', offset: bestOffset, length: bestLength });
      pos += bestLength;
    } else {
      tokens.push({ type: 'literal', byte: inputBuffer[pos] });
      pos++;
    }
  }

  // Header: 8 bytes. Worst case per token: 4 bytes (match token).
  const output = Buffer.alloc(8 + tokens.length * 4);
  let writePos = 0;

  MAGIC.copy(output, writePos);
  writePos += 4;
  output.writeUInt32BE(inputBuffer.length, writePos);
  writePos += 4;

  for (const token of tokens) {
    if (token.type === 'literal') {
      output[writePos++] = 0x00;
      output[writePos++] = token.byte;
    } else {
      output[writePos++] = 0x01;
      output.writeUInt16BE(token.offset, writePos);
      writePos += 2;
      output[writePos++] = token.length;
    }
  }

  return output.slice(0, writePos);
}

module.exports = { compress };
