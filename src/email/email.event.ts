import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OnEvent } from '@nestjs/event-emitter';
import { registerEnumType } from '@nestjs/graphql';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export const MailEventEnum = {
  SEND_EMAIL_OTP: 'email.send.otp',
};

registerEnumType(MailEventEnum, {
  name: 'MailEventEnum',
});

@Injectable()
export class MailEvent {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'baod66397@gmail.com',
        pass: 'pjjvdkogqislkdnb',
      },
    });
  }

  @OnEvent(MailEventEnum.SEND_EMAIL_OTP)
  async sendMail(to: string, subject: string, otp: string) {
    const templatePath = path.join(
      process.cwd(),
      'src/email/template/otp-template.handlebars',
    );
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);
    const html = template({ otp });

    const info = await this.transporter.sendMail({
      from: '"Orchid" <sender@example.com>',
      to: to,
      subject: subject,
      html: html,
    });

    console.log('Message sent: %s', info.messageId);
  }
}
