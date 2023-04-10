const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  auth: {
    user: process.env.MAIL_EMAIL,
    pass: process.env.MAIL_PASS,
  },
});

function sendMail(email, subject, text) {
  const options = {
    from: process.env.MAIL_EMAIL,
    to: email,
    subject,
    text,
  };
  transporter.sendMail(options, (err, info) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`Sent: ${info.response}`);
  });
}

module.exports = {
  sendMail,
};
