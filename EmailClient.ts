import { Auth, gmail_v1, google } from "googleapis";
import {
  GoogleAuth,
  JSONClient,
} from "google-auth-library/build/src/auth/googleauth";
import { OAuth2Client } from "google-auth-library";
import { Base64 } from "js-base64";
import { fileTypeFromBuffer } from "file-type";

export type Content = {
  html: string;
  attachmentId: string;
};

export interface Params {
  auth: Auth.OAuth2Client | GoogleAuth<JSONClient> | JSONClient;
}

export interface EmailOptions {
  userId: string;
  maxResults?: number;
  query?: string;
}

export class Decoder {
  decodeData(data: string) {
    return Base64.decode(data);
  }

  clearBase64(base64String: string) {
    const clean = base64String.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(clean, "base64");
  }
}

export class EmailClient extends Decoder {
  private auth: OAuth2Client;
  private gmail: gmail_v1.Gmail;
  private ctx: string;
  constructor(auth: OAuth2Client, user: string) {
    super();
    this.auth = auth;
    this.gmail = google.gmail({ version: "v1", auth: this.auth });
    this.ctx = user;
  }

  async getEmails(opts: EmailOptions) {
    const result = await this.gmail.users.messages.list({
      userId: this.ctx,
      maxResults: opts.maxResults,
      q: opts.query,
    });
    let { messages } = result.data;
    return messages;
  }

  async getEmailByQuery(query: string) {
    console.log(query);
    const { data } = await this.gmail.users.messages.list({
      userId: this.ctx,
      maxResults: 1,
      q: query,
    });

    if (!data.messages || data.messages.length <= 0) {
      return null;
    }

    let message = data.messages[0];
    const content = await this.getMessageById(message.id!);
    return { id: message.id!, content };
  }

  async getMessageById(messageId: string) {
    const result = await this.gmail.users.messages.get({
      id: messageId,
      userId: this.ctx,
    });

    return this.parseContent(result.data.payload!);
  }

  async deleteMessageById(messageId: string) {
    console.log("you have to complete this");
  }

  async getAttachemntById(messageId: string, attachmentId: string) {
    const result = await this.gmail.users.messages.attachments.get({
      userId: this.ctx,
      messageId,
      id: attachmentId,
    });
    return Buffer.from(result.data.data!);
  }

  private extractFromPart(part: gmail_v1.Schema$MessagePart, results: Content) {
    const { body, parts } = part;
    if (body?.attachmentId) results.attachmentId = body.attachmentId;
    if (body?.data) {
      const parsed = this.decodeData(body.data!.toString()!);
      results.html = parsed;
    }
    if (parts) {
      this.extractFromPart(parts[1], results);
    }
  }

  private parseContent(content: gmail_v1.Schema$MessagePart): Content | null {
    if (!content.parts || content.parts.length <= 0) return null;
    const { parts } = content;
    const results: Content = { html: "", attachmentId: "" };
    parts?.map((p) => this.extractFromPart(p, results));
    return results;
  }
}
