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
  query?: string;
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

  async getEmails(opts: EmailOptions) {
    const result = await this.gmail.users.messages.list({
      userId: this.ctx,
      maxResults: opts.maxResults,
      q: opts.query,
    });
    let { messages } = result.data;
    return messages
  }

  async getEmailByQuery(query : string){
    console.log(query)
    const {data}= await this.gmail.users.messages.list({
      userId: this.ctx,
      maxResults: 1,
      q: query,
    });

    if(!data.messages || data.messages.length <= 0 ){
      return null
    }

    let  message  = data.messages[0];
    const content  = await this.getMessageById(message.id!)
    return {id:message.id, content}
  }

  async getMessageById(messageId: string) {
    const result = await this.gmail.users.messages.get({
      id: messageId,
      userId: this.ctx,
    });

    return this.parseContent(result.data.payload!);
  }


  async deleteMessageById(messageId:string){
    console.log("you have to complete this")
  }

  private parseContent(content: gmail_v1.Schema$MessagePart) { 
    const {body} = content.parts![1]!
    if (!body) return null;
    const parsed = Base64.decode(body.data!.toString()!);
    return parsed;
  }

}
