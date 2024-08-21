import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY as string,
});

export async function sendEmail(to:string[], subject:string, message:string) {
  return new Promise<void>((resolve, reject) => {
    mg.messages.create('cryptopayserver.com', {
      from: "CryptoPay Server <no-reply@cryptopayserver.com>",
      to: to,
      subject: subject,
      text: message,
    })
    .then(msg => {
      console.log(msg);
      resolve();
    }) // logs response data
    .catch(err => {
      console.error(err);
      reject();
    });
  });
}