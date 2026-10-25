export function isUnauthenticatedStatus(status: number) {
  return status === 401 || status === 403 || status === 404;
}
