import { fileTypeFromBuffer } from "file-type";
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
    return EmailContent.getTemporaryPassword(email.content.html);
  }

  async waitForPasswordEmail() {
    const start = Date.now();
    const timeout = 60000;
      while (Date.now() - start < timeout) {
        const email = await this.client.getEmailByQuery(process.env.query!);
        if (email) return email
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      throw new Error("No email found");
  }
}
(async () => {
  dotenv.config();
  const auth = await new Configuration().getAuth();
  const client = new EmailClient(auth, "me");
  const emailService = new EmailService(client);
  const email = await client.getEmailByQuery(process.env.query_attachment!);
  //console.log(JSON.stringify(email?.content));
  const att = await client.getAttachemntById(
    email?.id!,
    email?.content?.attachmentId!,
  );
  const type = await fileTypeFromBuffer(att);
  const pwd = await emailService.getTemporaryPassword();
})();
