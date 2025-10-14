// Tiny structured logger with levels and timestamps (ESM)
// Usage: import logger from './logger.js'; logger.info('started', {port})
import { inspect } from 'node:util';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function resolveLevel() {
  const raw = String(process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[raw] ?? LEVELS.info;
}

let currentLevel = resolveLevel();

function ts() {
  return new Date().toISOString();
}

function fmtMeta(meta) {
  try {
    if (meta instanceof Error) {
      return JSON.stringify({ name: meta.name, message: meta.message, stack: meta.stack });
    }
    if (typeof meta === 'object') {
      return JSON.stringify(meta);
    }
    return inspect(meta);
  } catch (e) {
    return inspect(meta);
  }
}

function baseLog(level, msg, ...meta) {
  if (LEVELS[level] > currentLevel) return;
  const line = [`[${ts()}]`, level.toUpperCase(), '-', msg || ''];
  if (meta && meta.length) {
    line.push(meta.map(fmtMeta).join(' '));
  }
  const out = line.join(' ');
  if (level === 'error') console.error(out);
  else if (level === 'warn') console.warn(out);
  else console.log(out);
}

const logger = {
  setLevel(lvl) {
    if (lvl in LEVELS) currentLevel = LEVELS[lvl];
  },
  error: (msg, ...meta) => baseLog('error', msg, ...meta),
  warn: (msg, ...meta) => baseLog('warn', msg, ...meta),
  info: (msg, ...meta) => baseLog('info', msg, ...meta),
  debug: (msg, ...meta) => baseLog('debug', msg, ...meta),
  child(base = {}) {
    return {
      error: (msg, meta = {}) => baseLog('error', msg, { ...base, ...meta }),
      warn: (msg, meta = {}) => baseLog('warn', msg, { ...base, ...meta }),
      info: (msg, meta = {}) => baseLog('info', msg, { ...base, ...meta }),
      debug: (msg, meta = {}) => baseLog('debug', msg, { ...base, ...meta }),
    };
  },
};

export default logger;

