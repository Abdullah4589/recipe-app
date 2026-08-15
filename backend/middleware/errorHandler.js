// Central error handling.
//
// Before this existed every route had its own `catch (e) { res.status(500) }`,
// which turned ordinary client mistakes into 500s: a malformed ObjectId in a
// URL, or a missing required field, both surfaced as "server error". That is
// wrong for the caller (nothing is retryable about a bad id) and it hides real
// server faults in the noise.
//
// Routes now throw and let this map the error to a status once, in one place.

// Thrown deliberately by route code for expected client errors.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(message = 'Not found') {
  return new HttpError(404, message);
}

function badRequest(message = 'Bad request') {
  return new HttpError(400, message);
}

// eslint-disable-next-line no-unused-vars -- Express identifies error
// middleware by arity; the 4th param must stay even though it is unused.
function errorHandler(err, _req, res, _next) {
  // Deliberate errors from route code.
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Mongoose: a required/enum/type constraint failed. Client's fault.
  if (err.name === 'ValidationError') {
    const fields = Object.keys(err.errors || {});
    return res.status(400).json({
      message: fields.length
        ? `Validation failed: ${fields.join(', ')}`
        : 'Validation failed',
      fields,
    });
  }

  // Mongoose: a path could not be cast — almost always a malformed ObjectId
  // arriving from the URL. Client's fault, not a server fault.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for '${err.path}'` });
  }

  // Mongo duplicate key — the unique index did its job.
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Already exists' });
  }

  // Anything reaching here is genuinely unexpected, so it gets logged.
  // Message is not echoed to the client: internal error text can leak schema
  // and driver details.
  console.error('[unhandled]', err);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = { errorHandler, HttpError, notFound, badRequest };
