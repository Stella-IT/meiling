import { FastifyReply } from 'fastify/types/reply';
import { MeilingCommonError } from '../../../common';
import { OAuth2ErrorResponseType } from './interfaces';

export function sendOAuth2Error(
  rep: FastifyReply,
  error: OAuth2ErrorResponseType,
  description?: string,
  errorCode?: string,
): void {
  let statusCode = 500;

  switch (error) {
    case OAuth2ErrorResponseType.INVALID_REQUEST:
    case OAuth2ErrorResponseType.INVALID_SCOPE:
      statusCode = 400;
      break;
    case OAuth2ErrorResponseType.INVALID_CLIENT:
      statusCode = 401;
      break;
    case OAuth2ErrorResponseType.INVALID_GRANT:
    case OAuth2ErrorResponseType.UNAUTHORIZED_CLIENT:
    case OAuth2ErrorResponseType.RATE_LIMIT_EXCEEDED:
    case OAuth2ErrorResponseType.SLOW_DOWN:
    case OAuth2ErrorResponseType.ACCESS_DENIED:
      statusCode = 403;
      break;
    case OAuth2ErrorResponseType.AUTHORIZATION_PENDING:
      statusCode = 428;
      break;
    case OAuth2ErrorResponseType.UNSUPPORTED_GRANT_TYPE:
      statusCode = 504;
      break;
    default:
      statusCode = 500;
  }

  rep.status(statusCode).send({
    error,
    error_description: description,
    url: MeilingCommonError.buildErrorCodeURL(errorCode),
  });
}
