// Express 4 does not catch rejected promises from async route handlers — an
// unhandled rejection there hangs the request until it times out. Wrapping
// each handler forwards the rejection to the error middleware instead.
//
// (Express 5 does this natively; this wrapper is what lets us stay on 4.)
module.exports = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
