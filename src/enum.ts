/**
 * Created by Zero<mobius_pan@yeah.net> on 2020/3/17 17:43.
 */
export enum HttpStatusCode {
  Ok = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  UnprocessableEntity = 422,
  InternalServerError = 500,
  GatewayTimeout = 504,
}

export enum LogLever {
  Debugger= 'debug',
}
