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

// Lazy initialize Ethereal SMTP test account for instant local email delivery & previewing
let transporterPromise = nodemailer.createTestAccount().then(testAccount => {
    console.log("Initialized local SMTP email server for Ethereal dispatch.");
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

                const mailOptions = {
                    from: '"SS SKIN AND HAIR CLINIC" <no-reply@ssskinandhairclinic.com>',
                    to: data.email || 'patient@ssclinic.com',
                    subject: data.subject || `Thank You for Contacting SS SKIN AND HAIR CLINIC`,
                    text: data.message || 'Thank you for contacting SS SKIN AND HAIR CLINIC. Our support team will contact you as soon as possible.',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 24px; color: #1F2937; background-color: #FAF7F2; border-radius: 16px; border: 2px solid #D4AF37;">
                            <div style="background-color: #4A121E; padding: 20px; text-align: center; border-radius: 12px;">
                                <h2 style="margin: 0; color: #F3E5AB; font-family: Georgia, serif; font-size: 22px; tracking-widest: 2px;">SS SKIN AND HAIR CLINIC</h2>
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

                const info = await transporter.sendMail(mailOptions);
                const previewUrl = nodemailer.getTestMessageUrl(info);
                console.log(`[EMAIL DISPATCH SUCCESS] Delivered to: ${data.email}. Preview URL: ${previewUrl}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'success', 
                    message: 'Email dispatched successfully',
                    previewUrl: previewUrl,
                    toEmail: data.email
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
