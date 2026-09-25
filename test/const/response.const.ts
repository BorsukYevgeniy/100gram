export const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'You must be authorized to access this resource',
  statusCode: 401,
};

export const forbiddenResponse = {
  error: 'Forbidden',
  message: 'You must be an administator to access this resource',
  statusCode: 403,
};

export const userNotFoundResponse = {
  error: 'Not Found',
  message: 'User not found',
  statusCode: 404,
};
