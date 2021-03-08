import { FastifyReply, FastifyRequest } from 'fastify';
import { meilingV1UserActionGetUser } from '../..';
import { prisma } from '../../../../../../..';
import { ClientAuthorization, Token, User, Utils } from '../../../../../../../common';
import { sendMeilingError } from '../../../../error';
import { MeilingV1ErrorType } from '../../../../interfaces';

interface DeviceCode {
  user_code: string;
}

export async function meilingV1OAuthClientDeviceAuthCheckHandler(req: FastifyRequest, rep: FastifyReply) {
  const userBase = (await meilingV1UserActionGetUser(req)) as User.UserInfoObject;
  const type = 'DEVICE_CODE';

  // get parameters and query
  let query = req.query as DeviceCode;
  const body = req.body as DeviceCode;

  // validate
  if (!Utils.isValidValue(query, query.user_code)) {
    if (!Utils.isValidValue(body, body.user_code)) {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'missing user_code.');
      return;
    }

    query = body;
  }

  // get userData of selected user
  const userData = await User.getDetailedInfo(userBase);
  if (!userData) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'unable to fetch user from DB.');
    return;
  }

  const minimumIssuedAt = new Date(new Date().getTime() - 1000 * Token.getValidTimeByType(type));

  const deviceTokens = await prisma.oAuthToken.findMany({
    where: {
      issuedAt: {
        gte: minimumIssuedAt,
      },
      type,
    },
  });

  const matchingUserCodes = deviceTokens.filter(
    (n) => ((n.metadata as unknown) as Token.TokenMetadataV1).data?.deviceCode?.userCode === query.user_code,
  );
  if (matchingUserCodes.length === 0) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'no matching user_code found');
    return;
  }

  const userCode = matchingUserCodes[0];

  const client = await ClientAuthorization.getClient(userCode.authorizationId);
  if (!client) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_FOUND, 'unable to find proper client');
    return;
  }

  const authorization = await ClientAuthorization.getById(userCode.authorizationId);
  if (!authorization) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.UNAUTHORIZED,
      "specified oAuth2 application doesn't have proper authorization",
    );
    return;
  }

  // permissions that were requested
  const requestedPermissions = await ClientAuthorization.getAuthorizedPermissions(authorization);

  rep.send({
    client_id: client.id,
    scope: requestedPermissions.map((n) => n.name).join(' '),
  });
}