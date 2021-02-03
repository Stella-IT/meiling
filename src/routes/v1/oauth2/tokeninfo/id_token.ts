import { FastifyReply } from 'fastify';
import JWT from 'jsonwebtoken';
import { config } from '../../../..';
import { sendOAuth2Error } from '../error';
import { OAuth2ErrorResponseType } from '../interfaces';

export async function oAuth2IDTokenInfoHandler(token: string, rep: FastifyReply) {
  try {
    const result = JWT.verify(token, config.openid.secretKey) as any;
    if (new Date(result.exp).getTime() < new Date().getTime()) {
      sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'id_token has expired');
      return;
    }

    rep.send(result);
  } catch (e) {
    sendOAuth2Error(rep, OAuth2ErrorResponseType.INVALID_GRANT, 'invalid id_token');
    return;
  }
}