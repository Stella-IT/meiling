import { OAuthClient, OAuthClientAuthorization, OAuthToken, OAuthTokenType, Permission, User } from '@prisma/client';
import { Token } from '.';
import { getPrismaClient } from '../resources/prisma';

export async function garbageCollect(): Promise<void> {
  const oAuthACLs = await getPrismaClient().oAuthClientAccessControls.findMany({});

  for (const oAuthACL of oAuthACLs) {
    const tokenCount = await getPrismaClient().oAuthToken.count({
      where: {
        authorization: {
          id: oAuthACL.id,
        },
      },
    });

    if (tokenCount === 0) {
      await getPrismaClient().oAuthClientAccessControls.delete({
        where: {
          id: oAuthACL.id,
        },
      });
    }
  }
}

export function getId(authorization: OAuthClientAuthorization | string): string {
  if (typeof authorization === 'string') {
    return authorization;
  }
  return authorization.id;
}

export async function getById(
  authorization: OAuthClientAuthorization | string,
): Promise<OAuthClientAuthorization | undefined> {
  if (typeof authorization === 'string') {
    const tmpAuthorization = await getPrismaClient().oAuthClientAuthorization.findFirst({
      where: {
        id: getId(authorization),
      },
    });

    if (tmpAuthorization) authorization = tmpAuthorization;
    else return;
  }

  return authorization;
}

export async function getClient(
  authorization: OAuthClientAuthorization | string,
): Promise<OAuthClient | undefined | null> {
  const tmpAuthorization = await getById(authorization);
  if (!tmpAuthorization) return;

  const client = await getPrismaClient().oAuthClient.findFirst({
    where: {
      id: tmpAuthorization.clientId,
    },
  });

  return client;
}

export async function getUser(authorization: OAuthClientAuthorization | string): Promise<User | undefined | null> {
  const data = await getById(authorization);
  if (!data) return;
  if (!data.userId) return;

  const user = await getPrismaClient().user.findUnique({
    where: {
      id: data.userId,
    },
  });

  return user;
}

export async function createToken(
  authorization: OAuthClientAuthorization,
  type: OAuthTokenType,
  metadata?: Token.TokenMetadata,
): Promise<OAuthToken> {
  // TODO: allow custom generator for token
  const tokenKey = Token.generateToken();

  const token = await getPrismaClient().oAuthToken.create({
    data: {
      authorization: {
        connect: {
          id: authorization.id,
        },
      },
      type,
      token: tokenKey,

      // TODO: FIX LATER. I KNOW THIS IS BAD!
      metadata: metadata as any,
    },
  });

  updateLastUpdated(authorization);

  return token;
}

export async function getToken(authorization: OAuthClientAuthorization, type: OAuthTokenType): Promise<OAuthToken> {
  let token = await getPrismaClient().oAuthToken.findFirst({
    orderBy: [
      {
        issuedAt: 'desc',
      },
    ],
    where: {
      authorization,
      type,
    },
  });

  if (!token || Token.getExpiresInByType(type, token.issuedAt) < Token.getValidTimeByType(type) * 0.1) {
    token = await createToken(authorization, type, token?.metadata as Token.TokenMetadata);
  }

  updateLastUpdated(authorization);

  return token;
}

export async function getAuthorizedPermissions(authorization: OAuthClientAuthorization): Promise<Permission[]> {
  const permissions = await getPrismaClient().permission.findMany({
    where: {
      authorizations: {
        some: {
          id: authorization.id,
        },
      },
    },
  });

  return permissions;
}

export async function updateLastUpdated(authorization: OAuthClientAuthorization | string): Promise<void> {
  await getPrismaClient().oAuthClientAuthorization.update({
    where: {
      id: getId(authorization),
    },
    data: {
      lastUpdatedAt: new Date(),
    },
  });
}
