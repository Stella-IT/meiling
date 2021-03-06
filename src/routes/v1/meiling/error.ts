import chalk from 'chalk';
import { FastifyReply } from 'fastify/types/reply';
import { MeilingCommonError } from '../../../common';
import { NodeEnvironment } from '../../../interface';
import config from '../../../resources/config';
import { MeilingV1ErrorResponse, MeilingV1ErrorType } from './interfaces';

function getMeilingErrorStatusCode(type: MeilingV1ErrorType) {
  switch (type) {
    case MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUIRED:
      // it is draft, but lets try it anyway.
      // https://github.com/bretterer/HTTP-250-2FA-Required/blob/master/draft.adoc#why-250
      // return 250;

      // but for compatibility: here is 401.
      return 401;

    case MeilingV1ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.AUTHENTICATION_NOT_CURRENT_CHALLENGE_METHOD:
    case MeilingV1ErrorType.TWO_FACTOR_AUTHENTICATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.INVALID_REQUEST:
    case MeilingV1ErrorType.INVALID_TOKEN:
    case MeilingV1ErrorType.INVALID_SIGNIN_METHOD:
    case MeilingV1ErrorType.INVALID_SIGNIN_TYPE:
    case MeilingV1ErrorType.ALREADY_SIGNED_IN:
    case MeilingV1ErrorType.ALREADY_SIGNED_OUT:
    case MeilingV1ErrorType.APPLICATION_REDIRECT_URI_INVALID:
    case MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_GENERATED:
    case MeilingV1ErrorType.AUTHORIZATION_REQUEST_NOT_COMPLETED:
      return 400;

    case MeilingV1ErrorType.UNAUTHORIZED:
    case MeilingV1ErrorType.WRONG_USERNAME:
    case MeilingV1ErrorType.WRONG_PASSWORD:
    case MeilingV1ErrorType.SIGNIN_FAILED:
    case MeilingV1ErrorType.INVALID_SESSION:
    case MeilingV1ErrorType.APPLICATION_NOT_AUTHORIZED_BY_USER:
    case MeilingV1ErrorType.APPLICATION_NOT_AUTHORIZED_SCOPES:
    case MeilingV1ErrorType.AUTHORIZATION_REQUEST_INVALID:
      return 401;

    case MeilingV1ErrorType.FORBIDDEN:
      return 403;

    case MeilingV1ErrorType.APPLICATION_NOT_FOUND:
    case MeilingV1ErrorType.NOT_FOUND:
      return 404;

    case MeilingV1ErrorType.UNSUPPORTED_SIGNIN_METHOD:
    case MeilingV1ErrorType.UNSUPPORTED_SCOPE:
    case MeilingV1ErrorType.UNSUPPORTED_RESPONSE_TYPE:
    case MeilingV1ErrorType.UNSUPPORTED_AUTHORIZATION_TYPE:
      return 405;

    case MeilingV1ErrorType.MORE_THAN_ONE_USER_MATCHED:
    case MeilingV1ErrorType.APPLICATION_USER_ACTION_REQUIRED:
    case MeilingV1ErrorType.EXISTING_USERNAME:
    case MeilingV1ErrorType.EXISTING_PASSWORD:
    case MeilingV1ErrorType.EMAIL_NOT_ALLOWED:
    case MeilingV1ErrorType.PHONE_NOT_ALLOWED:
    case MeilingV1ErrorType.CONFLICT:
      return 409;

    case MeilingV1ErrorType.AUTHENTICATION_TIMEOUT:
    case MeilingV1ErrorType.AUTHORIZATION_REQUEST_TIMEOUT:
      return 410;

    case MeilingV1ErrorType.AUTHORIZATION_REQUEST_RATE_LIMITED:
      return 429;

    case MeilingV1ErrorType.INTERNAL_SERVER_ERROR:
      return 500;

    case MeilingV1ErrorType.NOT_IMPLEMENTED:
      return 501;
  }

  // the function for checking all cases are handled.
  // eslint-disable-next-line
  ((n: never) => {})(type);
}

export function sendMeilingError(
  rep: FastifyReply,
  type: MeilingV1ErrorType,
  description?: string,
  code?: string,
): void {
  if (config.node.environment === NodeEnvironment.Development)
    console.error(chalk.red('[ERROR]'), 'Error Report', type);

  const statusCode = getMeilingErrorStatusCode(type);

  rep.status(statusCode).send({
    type,
    description,
    code,
    url: MeilingCommonError.buildErrorCodeURL(code),
  } as MeilingV1ErrorResponse);
}
