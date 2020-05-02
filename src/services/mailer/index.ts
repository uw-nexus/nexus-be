import nodemailer, { SentMessageInfo, TransportOptions } from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { credentials, tokens } from '../../config/google-auth';
import { FE_ADDR, EMAIL_ADDR, EMAIL_NAME } from '../../config';

const transportConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  service: 'Gmail',
  from: `"${EMAIL_NAME}" <${EMAIL_ADDR}>`,

  auth: {
    type: 'OAuth2',
    user: EMAIL_ADDR,
    clientId: credentials.client_id,
    clientSecret: credentials.client_secret,
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    expires: tokens.expiry_date,
  },
} as TransportOptions;

const handlebarsOptions = {
  viewEngine: {
    extName: '.html',
    partialsDir: path.resolve(__dirname, './templates/'),
    layoutsDir: path.resolve(__dirname, './templates/'),
    defaultLayout: 'password-reset-instru-email.html',
  },
  viewPath: path.resolve(__dirname, './templates/'),
  extName: '.html',
};

const gmailTransport = nodemailer.createTransport(transportConfig);
gmailTransport.use('compile', hbs(handlebarsOptions));

export async function sendPasswordResetIntru(email: string, jwt: string): Promise<SentMessageInfo> {
  const data = {
    to: email,
    template: 'password-reset-instru-email',
    subject: 'NEXUS App Password Reset',
    context: {
      url: `${FE_ADDR}/password-reset/${jwt}`,
    },
  };

  return gmailTransport.sendMail(data);
}
