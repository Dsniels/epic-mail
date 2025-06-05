import { Configuration } from "./config";
import { EmailClient } from "./EmailClient";
import { EmailContent } from "./EmailParser";
import dotenv from "dotenv";

export class EmailService {
  private client: EmailClient;

  constructor(client: EmailClient) {
    this.client = client;
  }

  async getTemporaryPassword() {
    const email = await this.client.getEmailByQuery(process.env.query!);
    if (!email?.content || !email.id) return null;
    await this.client.deleteMessageById(email.id);
    return EmailContent.getTemporaryPassword(email.content);

  }

  async waitForPasswordEmail() {
    const start = Date.now();
    const timeout = 60000;
    return new Promise<void>(async (resolve) => {
      while (Date.now() - start < timeout) {
        const email = await this.client.getEmailByQuery(process.env.query!);
        if (email) return resolve();
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw new Error("No email found");
    });
  }

}
(async () => {
  dotenv.config();
  const auth = await new Configuration().getAuth();
  const client = new EmailClient(auth, "me");
  const emailService = new EmailService(client);
  await emailService.waitForPasswordEmail();
  const pwd = await emailService.getTemporaryPassword();
  console.log("password: ", pwd);
})();

