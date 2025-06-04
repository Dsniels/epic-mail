import { Auth, gmail_v1, google } from "googleapis";
import {
  GoogleAuth,
  JSONClient,
} from "google-auth-library/build/src/auth/googleauth";
import { OAuth2Client } from "google-auth-library";
import { Base64 } from "js-base64";

export interface Params {
  auth: Auth.OAuth2Client | GoogleAuth<JSONClient> | JSONClient;
}

export interface EmailOptions {
  userId: string;
  maxResults?: number;
  q?: string;
}

export class EmailClient {
  private auth: OAuth2Client;
  private gmail: gmail_v1.Gmail;
  private ctx: string;
  constructor(auth: OAuth2Client, user: string) {
    this.auth = auth;
    this.gmail = google.gmail({ version: "v1", auth: this.auth });
    this.ctx = user;
  }

  async getLabel() {
    const result = await this.gmail.users.labels.list({ userId: "me" });
    const labels = result.data.labels;
    if (!labels || labels.length == 0) {
      return null;
    }

    return labels;
  }

  async getEmails(opts: EmailOptions) {
    const result = await this.gmail.users.messages.list({
      userId: this.ctx,
      maxResults: opts.maxResults,
      q: opts.q,
    });
    const messages = result.data.messages;
    const parsed = messages?.map((msg) => this.getMessage(msg.id!));
    return messages;
  }

  private async getMessage(messageId: string) {
    const result = await this.gmail.users.messages.get({
      id: messageId,
      userId: this.ctx,
    });

    console.log(result.data.payload?.parts![0].body)
    const {body} = result.data.payload?.parts![1]!
    console.log(body)
    if (!body) return null;
    const parsed = Base64.decode(body.data!.toString()!);
    console.log(parsed)
    return body;
  }
}
