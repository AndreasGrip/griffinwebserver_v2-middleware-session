const crypto = require('crypto');
const cookie = require('cookie');

const ttl = 1000 * 60 * 60 * 12; // 12 hours in milliseconds

// sessions will be kept in both a array and object for convenience
var sessions = {};
const sessionsArray = [];

setInterval(pruneSessions, 60 * 1000); // prune every minute

function pruneSessions() {
  for (let i = 0; i < sessions.length; i++) {
    if (sessions[i].createdAt + ttl >= Date.now()) { // if session is expired, delete it
      delete sessions[i]; // delete it from object
      sessionsArray.splice(i, 1); // delete it from array
      i--;
    }
  }
}

// helper function
function generateSessionId() {
  let sessionId = crypto.randomBytes(32).toString('hex');
  if (sessions[sessionId]) sessionId = generateSessionId(); // generate a new id if the generated id is already in use
  return sessionId;
}

function session(req, res) {
  // check for session id in cookie
  const cookies = req?.headers?.cookie ? cookie.parse(req.headers.cookie) : {};
  let sessionId = cookies?.session_id;
  // if cookie is present, check for session in sessions object
  if (!sessionId || !sessions[sessionId]) {
    sessionId = generateSessionId();
    sessions[sessionId] = { id: sessionId, expires: Date.now() + ttl, createdAt: Date.now(), accessedAt: Date.now(), data: {} };
    sessionsArray.push(sessions[sessionId]);
    res.setHeader('Set-Cookie', `session_id=${sessionId}; path=/; max-age=${ttl}; httpOnly; sameSite=strict`);
  } else {
    // if session is found in sessions object, only update accessedAt
    sessions[sessionId].accessedAt = Date.now();
  }
  req.session = sessions[sessionId];
}

module.exports = session;
