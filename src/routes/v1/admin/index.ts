import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fastifyCors from 'fastify-cors';
import { Utils } from '../../../common';
import { getTokenFromRequest } from '../../../common/token';
import { NodeEnvironment } from '../../../interface';
import config from '../../../resources/config';
import { sendMeilingError } from '../meiling/error';
import { MeilingV1ErrorType } from '../meiling/interfaces';

const adminV1Plugin = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.register(fastifyCors, {
    origin:
      config.node.environment === NodeEnvironment.Development
        ? '*'
        : config?.admin?.frontend?.url
        ? config.admin.frontend.url
        : config.frontend.url,
  });

  app.addHook('onRequest', (req, rep, next) => {
    if (!config.admin || !config.admin.tokens) {
      sendMeilingError(rep, MeilingV1ErrorType.FORBIDDEN);
      throw new Error('User is not providing proper login credentials for admin');
    }

    const token = getTokenFromRequest(req);
    if (!token) {
      rep
        .status(401)
        .headers({
          'WWW-Authenticate': 'Basic realm="scarlet_mansion"',
        })
        .send();
      throw new Error('User is not providing proper login credentials for admin');
    }

    if (token.method.toLowerCase() === 'basic') {
      // ID and Password flow
      const isValidBasic = Utils.checkBase64(token.token);
      if (!isValidBasic) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_TOKEN);
        throw new Error('Invalid Admin Token');
      }

      const tokenString = Buffer.from(token.token, 'base64').toString('utf-8');
      const basicTokens = config.admin.tokens
        .filter((n) => Utils.checkBase64(n))
        .map((n) => Buffer.from(n, 'base64').toString('utf-8'));

      const matchedTokens = basicTokens.filter((n) => n === tokenString);
      if (matchedTokens.length === 0) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_TOKEN);
        throw new Error('Invalid Admin Token');
      }
    } else if (token.method.toLowerCase() === 'bearer') {
      const matchedTokens = config.admin.tokens.filter((n) => n === token.token);
      if (matchedTokens.length === 0) {
        sendMeilingError(rep, MeilingV1ErrorType.INVALID_TOKEN);
        throw new Error('Invalid Admin Token');
      }
    } else {
      sendMeilingError(rep, MeilingV1ErrorType.NOT_IMPLEMENTED);
    }

    next();
  });

  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
      api: 'Scarlet Mansion Access Control Admin',
    });
  });

  done();
};

export default adminV1Plugin;
