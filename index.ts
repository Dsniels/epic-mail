import { Configuration } from "./config";
import { EmailClient } from "./EmailClient";
import { EmailContent } from "./EmailParser";
import dotenv from "dotenv";

(async () => {
  dotenv.config();
  const auth = await new Configuration().getAuth();
  const client = new EmailClient(auth, "me");
  const email = await client.getEmailByQuery(process.env.query!);
  if (!email?.content) return;
  const pwd = EmailContent.getTemporaryPassword(email.content);
  console.log("password: ", pwd);
})();
