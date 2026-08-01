const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = 8080;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

// Gmail SMTP Credentials (Set GMAIL_APP_PASS to send real emails to patient inboxes)
const GMAIL_USER = process.env.GMAIL_USER || 'ssskinandhairclinic7@gmail.com';
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS || ''; 

let transporterPromise;

if (GMAIL_USER && GMAIL_APP_PASS) {
    console.log(`[SMTP CONFIG] Using Real Gmail SMTP (${GMAIL_USER}) for live email delivery.`);
    transporterPromise = Promise.resolve(nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER,
            pass: GMAIL_APP_PASS
        }
    }));
} else {
    console.log("[SMTP CONFIG] No Gmail App Password detected. Initializing Ethereal test SMTP server for local developer previewing.");
    transporterPromise = nodemailer.createTestAccount().then(testAccount => {
        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    });
}

const server = http.createServer(async (req, res) => {
    let reqUrl = req.url.split('?')[0].split('#')[0];

    // API Endpoint for Sending Real Confirmation Emails
    if (req.method === 'POST' && reqUrl === '/api/send-email') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const transporter = await transporterPromise;

                const patientEmail = (data.email && data.email.includes('@')) ? data.email : null;

                // 1. Dispatch Customer Confirmation Email (if patient email provided)
                if (patientEmail) {
                    const mailOptionsCustomer = {
                        from: '"SS SKIN AND HAIR CLINIC" <ssskinandhairclinic7@gmail.com>',
                        to: patientEmail,
                        subject: data.subject || `Thank You for Contacting SS SKIN AND HAIR CLINIC - ${data.service || 'Consultation'}`,
                        text: data.message || 'Thank you for contacting SS SKIN AND HAIR CLINIC. Our support team will contact you as soon as possible.',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1F2937; background-color: #FAF7F2; border-radius: 16px; border: 2px solid #D4AF37;">
                                <div style="background-color: #4A121E; padding: 20px; text-align: center; border-radius: 12px;">
                                    <h2 style="margin: 0; color: #F3E5AB; font-family: Georgia, serif; font-size: 22px; letter-spacing: 2px;">SS SKIN AND HAIR CLINIC</h2>
                                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #D4AF37; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">Premium Cosmetology & Laser Center</p>
                                </div>
                                
                                <div style="margin-top: 24px; background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #E5E7EB;">
                                    <h3 style="margin-top: 0; color: #4A121E; font-size: 18px;">Reservation Received</h3>
                                    <p style="font-size: 14px; font-weight: bold; color: #047857; margin-bottom: 16px;">
                                        Thank you for contacting SS SKIN AND HAIR CLINIC. Our support team will contact you as soon as possible.
                                    </p>

                                    <div style="background: #F9FAFB; padding: 14px; border-radius: 8px; font-size: 13px; line-height: 1.6; border-left: 4px solid #D4AF37;">
                                        <h4 style="margin: 0 0 8px 0; color: #4A121E;">Reservation Summary:</h4>
                                        <p style="margin: 4px 0;">• <strong>Patient Name:</strong> ${data.name || 'Guest'}</p>
                                        <p style="margin: 4px 0;">• <strong>Mobile Number:</strong> ${data.phone || 'Not provided'}</p>
                                        <p style="margin: 4px 0;">• <strong>Email Address:</strong> ${data.email || 'Not provided'}</p>
                                        <p style="margin: 4px 0;">• <strong>Consultation Service:</strong> ${data.service || 'General Consultation'}</p>
                                        <p style="margin: 4px 0;">• <strong>Assigned Specialist:</strong> ${data.doctor || 'Dr. M. Triveni (Cosmetologist)'}</p>
                                        <p style="margin: 4px 0;">• <strong>Preferred Date:</strong> ${data.date || 'As early as available'}</p>
                                    </div>

                                    <div style="margin-top: 20px;">
                                        <h4 style="margin-bottom: 8px; color: #4A121E; font-size: 14px;">Complete 35 Clinical Treatments Portfolio:</h4>
                                        <p style="font-size: 12px; line-height: 1.5; margin: 4px 0;">✨ <strong>Skin Care:</strong> HydraFacial, Chemical Peel, Medi Facials, Skin Brightening, Acne & Scar Care, Pigmentation & Melasma Care, Anti-Aging, Wrinkle Reduction, Skin Tightening, Dark Circle & Open Pore Treatment, Mole/Wart/Tag/Corn Removal, Stretch Mark Treatment.</p>
                                        <p style="font-size: 12px; line-height: 1.5; margin: 4px 0;">⚡ <strong>Laser Tech:</strong> Laser Hair Reduction & Removal, Carbon Laser Peel/Facial, Pigmentation Laser, Photo Facial, Skin Rejuvenation, Laser Skin Tightening, Tattoo Removal.</p>
                                        <p style="font-size: 12px; line-height: 1.5; margin: 4px 0;">💇 <strong>Hair Care & FUE:</strong> PRP Hair Therapy, GFC Hair Therapy, Hair Fall Treatment, Hair Regrowth Therapy, Dandruff Treatment, Hair Mesotherapy, Scalp Rejuvenation, Hair Strengthening, Hair Nutrition Therapy.</p>
                                    </div>
                                </div>

                                <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #6B7280;">
                                    <p style="margin: 2px 0;">SS SKIN AND HAIR CLINIC • 62-1-15/4B, Sriharipuram, Visakhapatnam - 530011</p>
                                    <p style="margin: 2px 0;">Guest Care Phone / WhatsApp: +91 78936 16535</p>
                                </div>
                            </div>
                        `
                    };

                    const infoCustomer = await transporter.sendMail(mailOptionsCustomer);
                    const previewUrl = nodemailer.getTestMessageUrl(infoCustomer);
                    console.log(`[EMAIL DISPATCH SUCCESS] Customer Email Delivered to: ${patientEmail}. Preview URL: ${previewUrl}`);
                }

                // 2. Dispatch Owner Lead Alert Email
                const mailOptionsOwner = {
                    from: '"SS CLINIC WEBSITE" <ssskinandhairclinic7@gmail.com>',
                    to: 'ssskinandhairclinic7@gmail.com',
                    subject: `🚨 NEW APPOINTMENT BOOKING: ${data.name || 'Guest'} - ${data.service || 'Consultation'}`,
                    text: `New Booking Request Received:\n\n• Patient Name: ${data.name}\n• Phone: ${data.phone}\n• Email: ${data.email}\n• Service: ${data.service}\n• Doctor: ${data.doctor}\n• Date: ${data.date}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #4A121E; border-radius: 12px; background: #FFFFFF;">
                            <div style="background-color: #4A121E; padding: 16px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
                                <h2 style="margin: 0; color: #F3E5AB; font-family: Georgia, serif;">🚨 New Appointment Lead Received</h2>
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
                                <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #4A121E;">Patient Name:</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${data.name || 'Guest'}</td></tr>
                                <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #4A121E;">Phone Number:</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;"><a href="tel:${data.phone}" style="color: #2563EB; font-weight: bold;">${data.phone || 'Not provided'}</a></td></tr>
                                <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #4A121E;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;"><a href="mailto:${data.email}">${data.email || 'Not provided'}</a></td></tr>
                                <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #4A121E;">Service Requested:</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${data.service || 'General Consultation'}</td></tr>
                                <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #4A121E;">Assigned Doctor:</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${data.doctor || 'Dr. M. Triveni'}</td></tr>
                                <tr><td style="padding: 10px; border-bottom: 1px solid #E5E7EB; font-weight: bold; color: #4A121E;">Preferred Date:</td><td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${data.date || 'As early as available'}</td></tr>
                            </table>
                            <div style="margin-top: 20px; text-align: center;">
                                <a href="https://wa.me/91${(data.phone || '').replace(/[^0-9]/g, '')}" style="background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Open Patient Chat in WhatsApp</a>
                            </div>
                        </div>
                    `
                };
                const infoOwner = await transporter.sendMail(mailOptionsOwner);
                const ownerPreviewUrl = nodemailer.getTestMessageUrl(infoOwner);
                console.log(`[EMAIL DISPATCH SUCCESS] Owner Lead Alert Delivered. Preview URL: ${ownerPreviewUrl}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'success', 
                    message: 'Email dispatched successfully',
                    patientEmail: patientEmail
                }));
            } catch (err) {
                console.error('[EMAIL DISPATCH ERROR]', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
        });
        return;
    }

    if (reqUrl === '/') reqUrl = '/index.html';
    if (!path.extname(reqUrl)) reqUrl += '.html';

    const filePath = '.' + reqUrl;
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'text/html';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Page Not Found</h1><p><a href="/index.html">Return to Home</a></p>', 'utf-8');
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`SS SKIN AND HAIR CLINIC server with Email API running at http://localhost:${PORT}/`);
});
