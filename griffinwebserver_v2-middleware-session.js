const crypto = require('node:crypto');
const cookie = require('cookie');

// Default TTL tiles
let ttl = 1000 * 60 * 60 * 12; // 12 hours in milliseconds
let ttlInactive = 1000 * 60 * 60; // 1hour of inactivity

// sessions will be kept in both a array and object for convenience
var sessions = {};
const sessionsArray = [];

setInterval(pruneSessions, 60 * 1000); // prune every minute

function setTtlInactive(seconds) {
  ttlInactive = seconds * 1000; // convert to milliseconds
}

function setTtl(seconds) {
  ttl = seconds * 1000;
}

function pruneSessions() {
  for (let i = sessionsArray.length - 1; i >= 0; i--) {
    // If session id partually deleted or session have expired or missing from session object, delete it
    if (!sessionsArray[i].createdAt || sessionsArray[i].createdAt + ttl <= Date.now() || sessionsArray[i].accessedAt + ttlInactive <= Date.now() || !sessions[sessionsArray[i].id]) {
      if (sessions[sessionsArray[i].id]) delete sessions[sessionsArray[i].id]; // delete it from object if it exists
      sessionsArray.splice(i, 1); // delete it from array
    }
  }
}

// helper function
function generateSessionId() {
  let sessionId;
  do {
    // generate a new id. If the generated id is already in use, generate another one.
    sessionId = crypto.randomBytes(32).toString('hex');
  } while (sessions[sessionId]);
  return sessionId;
}

function session(req, res) {
  // check for session id in cookie
  const cookies = req?.headers?.cookie ? cookie.parse(req.headers.cookie) : {};
  let sessionId = cookies?.session_id;
  // if cookie is present, check for session in sessions object, that the data object exits and createdAt exists. Otherwise create new session.
  if (!sessionId || !sessions[sessionId] || !sessions[sessionId].data || !sessions[sessionId].createdAt) {
    // if old session is dammaged and will be replaced, remove the old one.
    // TODO Also remove from sessionsArray before delete from sessions
    if (sessions[sessionId]) delete sessions[sessionId];
    sessionId = generateSessionId();
    sessions[sessionId] = { id: sessionId, createdAt: Date.now(), accessedAt: Date.now(), data: {} };
    sessionsArray.push(sessions[sessionId]);
    const sessionCookieString = `session_id=${sessionId}; path=/; max-age=${ttl / 1000}; httpOnly; sameSite=strict`;
    // if no cookie is set set as empty array
    let setCookie = res.getHeader('Set-Cookie') || [];
    // convert to array if needed
    if (!Array.isArray(setCookie)) setCookie = [setCookie];
    setCookie.push(sessionCookieString);
    res.setHeader('Set-Cookie', setCookie);
  } else {
    // if session is found in sessions object, only update accessedAt
    sessions[sessionId].accessedAt = Date.now();
  }
  req.session = sessions[sessionId];
}

module.exports = session;
module.exports.setTtl = setTtl;
module.exports.setTtlInactive = setTtlInactive;
