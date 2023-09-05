const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const transportDetails = smtpTransport({
    host: 'mail.ghorbany.dev',
    port: 465,
    secure: true,
    auth: {
        user: 'no-reply@ghorbany.dev',
        pass: process.env.mailer_pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.sendEmail = (email, fullname, subject, message) => {
    const transporter = nodemailer.createTransport(transportDetails);
    transporter.sendMail({
        from: 'no-reply@ghorbany.dev',
        to: email,
        subject: subject,
        html: `<h1>Hello dear ${fullname}</h1>
                <p>${message}</p>`
    });
};
