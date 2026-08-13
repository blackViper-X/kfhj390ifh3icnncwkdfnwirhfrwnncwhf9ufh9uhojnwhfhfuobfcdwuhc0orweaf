function createError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function badRequest(message, code = 'BAD_REQUEST') {
  return createError(400, message, code);
}

function unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
  return createError(401, message, code);
}

function forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
  return createError(403, message, code);
}

function notFound(message = 'Not found', code = 'NOT_FOUND') {
  return createError(404, message, code);
}

function conflict(message, code = 'CONFLICT') {
  return createError(409, message, code);
}

module.exports = {
  createError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
