import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ClientAuthorization, Token } from '../../../../common';
import { MeilingV1Session } from '../../meiling/common';
import { sendMeilingError } from '../../meiling/error';
import { MeilingV1ErrorType } from '../../meiling/interfaces';

const internalAdminHandler = (app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void => {
  app.get('/sakuya', async (req, rep) => {
    try {
      console.log('[Sakuya] Running Garbage Collect for Meiling Sessions...');
      await MeilingV1Session.garbageCollect();

      console.log('[Sakuya] Running Garbage Collect for OAuth2 Tokens...');
      await Token.garbageCollect();

      console.log('[Sakuya] Running Garbage Collect for OAuth2 ACL Data...');
      await ClientAuthorization.garbageCollect();

      rep.send({ success: true });
    } catch (e) {
      console.error(e);
      sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR);
    }
  });

  done();
};

export default internalAdminHandler;
