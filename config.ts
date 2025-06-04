import { authenticate } from "@google-cloud/local-auth";
import * as fs from "fs/promises";
import { Credentials, JWTAccess, OAuth2Client } from "google-auth-library";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { Auth, google } from "googleapis";
import path from "path";

export const CONSTANTS = {
  TOKEN_PATH: path.join(__dirname, "token.json"),
  CREDENTIALS_PATH: path.join(__dirname, "credentials.json"),
  SCOPES: ["https://www.googleapis.com/auth/gmail.readonly"],
};

export class Configuration {
  constructor() {}

  private async loadCredentialsIfExist(): Promise<JSONClient | null> {
    try {
      const content = await fs.readFile(CONSTANTS.TOKEN_PATH, {
        encoding: "utf8",
      });
      const credentials = JSON.parse(content);
      return google.auth.fromJSON(credentials);
    } catch (error) {
      return null;
    }
  }

  private async saveCredentials(client: JSONClient | OAuth2Client) {
    const content = await fs.readFile(CONSTANTS.CREDENTIALS_PATH, {
      encoding: "utf8",
    });
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: "authorized_user",
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(CONSTANTS.TOKEN_PATH, payload);
  }

  public async getAuth(): Promise<OAuth2Client> {
    const client = await this.loadCredentialsIfExist();
    if (client) {
      return client as OAuth2Client;
    }

    let AuthClient = await authenticate({
      scopes: CONSTANTS.SCOPES,
      keyfilePath: CONSTANTS.CREDENTIALS_PATH,
    });
    if (AuthClient.credentials) {
      await this.saveCredentials(AuthClient);
    }
    return AuthClient;
  }
}
