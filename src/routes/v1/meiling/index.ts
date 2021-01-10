import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { findMatchingUsersByUsernameOrEmail } from '../../../common/user';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';
import { meilingV1SigninHandler } from './signin';
import { meilingV1SignupHandler } from './signup';
import { meilingV1UserInfoHandler } from './user';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Engine',
      api: 'Meiling Endpoints',
    });
  });

  app.get(baseURI + '/user', meilingV1UserInfoHandler);
  app.get(baseURI + '/user/exist', meilingV1UserExistHandler);

  app.post(baseURI + '/signin', meilingV1SigninHandler);
  app.post(baseURI + '/signup', meilingV1SignupHandler);
}

async function meilingV1UserExistHandler(req: FastifyRequest, rep: FastifyReply) {
  if ((req.query as any)?.username) {
    const username = (req.query as any)?.username;
    const users = await findMatchingUsersByUsernameOrEmail(username);

    rep.send({
      exist: users.length > 0,
    });
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'username is missing.');
    return;
  }
}