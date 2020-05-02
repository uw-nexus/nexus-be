/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OAuth2Client, Credentials } from 'google-auth-library';

const scope = 'https://mail.google.com';

export const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID || '',
  project_id: process.env.GOOGLE_PROJECT_ID || '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  auth_provider_x509_cert_url: 'https://accounts.google.com/o/oauth2/token',
  client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirect_uris: ['http://localhost'],
  javascript_origins: ['http://localhost'],
};

export function getAuthorizeUrl(callback: (err: any, url: string) => any): void {
  const oauth2Client = new OAuth2Client(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope,
  });

  callback(null, authUrl);
}

export function getAccessToken(callback: (err: any, token?: Credentials | null) => any): void {
  const code = process.env.GOOGLE_AUTH_CODE || '';
  const oauth2Client = new OAuth2Client(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);
  oauth2Client.getToken(code).then(callback);
}

export const tokens: Credentials = {
  access_token: process.env.GOOGLE_ACCESS_TOKEN || '',
  token_type: 'Bearer',
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
  expiry_date: 1586987686541,
};
