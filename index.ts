import { Configuration } from "./config";
import { EmailClient } from "./EmailClient";

const main = async () => {
  const auth = await new Configuration().getAuth();
  const client = new EmailClient(auth,"me");
  const labels = await client.getLabel();
  const messages = await client.getEmails({
    userId: "me",
    maxResults: 1,
    q: "from:<updates-noreply@linkedin.com>",
  });
  console.log(messages);
};


main();
