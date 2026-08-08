const https = require('https');
const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const data = JSON.parse(event.body);
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    // Fallback email if environment variable is missing
    const ADMIN_EMAIL = process.env.GMAIL_USER || 'theauzent@gmail.com';

    const sendTelegram = !['WORKSPACE_APPROVED', 'WORKSPACE_UPDATED', 'PAYMENT_REMINDER', 'TESTING_APPROVED'].includes(data.category);
    const targetEmail = data.email;

    const submissionTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let tgMessage = `🏢 *New Update: ${data.category}*\n`;
    tgMessage += `⏰ Time: ${submissionTime}\n`;
    tgMessage += `━━━━━━━━━━━━━━━━━━━━\n`;

    let emailSubject = 'Update from The Auzent';
    let emailHtml = '';

    // Smart button generator for pre-filled one-click replies
    const getReplyButton = (subject, bodyText) => `
        <div style="margin-top: 25px; text-align: center;">
            <a href="mailto:${ADMIN_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}" 
               style="background-color: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
               Reply to this Email
            </a>
        </div>
    `;

    // Clean, modern, and friendly email template
    const generateEmail = (title, content) => `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background-color: #FFFFFF;">
        <div style="background-color: #0F172A; padding: 24px; text-align: center; border-bottom: 4px solid #2563EB;">
            <h1 style="color: #FFFFFF; margin: 0; font-size: 22px; letter-spacing: 1px;">The Auzent</h1>
            <p style="color: #94A3B8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Custom App & Web Solutions</p>
        </div>
        <div style="padding: 30px; color: #334155; line-height: 1.6; font-size: 15px;">
            <h2 style="color: #0F172A; font-size: 18px; margin-top: 0;">${title}</h2>
            ${content}
        </div>
        <div style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
            <p style="margin: 0;">This is an automated but monitored inbox. Feel free to reply!</p>
            <p style="margin: 4px 0 0 0;">&copy; ${new Date().getFullYear()} The Auzent. All rights reserved.</p>
        </div>
    </div>`;

    if (data.category === 'LEAD') {
        const isTesting = data.projectType === 'QA Testing Service';
        tgMessage += `👤 *Name:* ${data.name}\n📧 *Email:* ${data.email}\n📱 *Phone:* ${data.whatsapp}\n`;
        
        if (isTesting) {
            tgMessage += `🐛 *Type:* App Testing & QA\n📦 *Package:* ${data.package}\n🔗 *Link:* ${data.reference}\n📝 *Details:* ${data.features}`;
            
            emailSubject = `App Testing Request Received | The Auzent`;
            emailHtml = generateEmail('Testing Request Received', `
                <p>Hi ${data.name},</p>
                <p>We have safely received your App Testing request for the <strong>${data.package}</strong> package.</p>
                <p>Our team is currently reviewing your app details. We will contact you shortly to confirm the process and assign our testers to your project.</p>
                ${getReplyButton('Re: Testing Request', 'Hi The Auzent team,%0D%0A%0D%0AI have a question regarding my testing request...')}
            `);
        } else {
            tgMessage += `🏗️ *Type:* ${data.projectType}\n💰 *Budget:* ${data.budget}\n⏳ *Timeline:* ${data.timeline}\n📝 *Details:* ${data.features}`;
            
            emailSubject = `Project Request Received | The Auzent`;
            emailHtml = generateEmail('Project Request Received', `
                <p>Hi ${data.name},</p>
                <p>Thank you for reaching out! Your project request has been successfully saved in our system.</p>
                <div style="background-color: #F1F5F9; padding: 15px; border-radius: 6px; border-left: 3px solid #2563EB; margin: 20px 0;">
                    <p style="margin: 0 0 5px 0;"><strong>Project Type:</strong> ${data.projectType.toUpperCase()}</p>
                    <p style="margin: 0 0 5px 0;"><strong>Estimated Budget:</strong> ${data.budget}</p>
                    <p style="margin: 0;"><strong>Target Timeline:</strong> ${data.timeline}</p>
                </div>
                <p>Our lead developer is reviewing your requirements right now. We will contact you directly to discuss the next steps.</p>
                ${getReplyButton('Re: Project Request', 'Hi The Auzent team,%0D%0A%0D%0AI would like to add some more details to my project request...')}
            `);
        }
    } 
    else if (data.category === 'CONTACT') {
        tgMessage += `👤 *Name:* ${data.name}\n📧 *Email:* ${data.email}\n🌐 *Via:* ${data.platform} (${data.platform_id})\n💬 *Msg:* ${data.message}`;
        emailSubject = `Message Received | The Auzent`;
        emailHtml = generateEmail('Message Received', `
            <p>Hi ${data.name},</p>
            <p>We have successfully received your message.</p>
            <p>Our support team is looking into it and will reply to you as soon as possible.</p>
            ${getReplyButton('Following up on my message', 'Hi The Auzent team,%0D%0A%0D%0AJust following up on the message I sent earlier...')}
        `);
    } 
    else if (data.category === 'REPORT') {
        tgMessage += `📧 *User:* ${data.email}\n🚨 *Issue:* ${data.type}\n📝 *Desc:* ${data.description}`;
        emailSubject = `Issue Report Saved | The Auzent`;
        emailHtml = generateEmail('Issue Report Saved', `
            <p>Hi there,</p>
            <p>We have received your issue report regarding: <strong>${data.type}</strong>.</p>
            <p>Our technical team has been notified, and we are looking into the problem right away.</p>
            ${getReplyButton('Additional details for my issue', 'Hi The Auzent team,%0D%0A%0D%0AI want to add some more context to the bug I reported...')}
        `);
    } 
    else if (data.category === 'WORKSPACE_APPROVED') {
        emailSubject = `Welcome! Your Client Portal is Ready | The Auzent`;
        emailHtml = generateEmail('Client Portal Details', `
            <p>Hi ${data.name},</p>
            <p>Great news! Your custom project workspace has been created successfully.</p>
            <div style="background-color: #F8FAFC; padding: 20px; border: 1px solid #E2E8F0; border-radius: 6px; text-align: center; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748B; text-transform: uppercase;">Your Secure Login Details</p>
                <p style="margin: 0 0 5px 0; font-size: 16px;"><strong>Workspace ID:</strong> <span style="color: #2563EB;">${data.portalId}</span></p>
                <p style="margin: 0; font-size: 16px;"><strong>Security PIN:</strong> <span style="letter-spacing: 2px;">${data.pin}</span></p>
            </div>
            <p style="text-align: center;">
                <a href="https://theauzent.netlify.app/gateway.html" style="background-color: #2563EB; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Login to Portal</a>
            </p>
            <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 13px; color: #475569;">
                <p style="margin: 0 0 5px 0; font-weight: bold; color: #0F172A;">Important Note:</p>
                <p style="margin: 0;">By logging into your portal or proceeding with the payment, you confirm that you agree to the project scope and terms. You don't need to reply to this email to accept.</p>
            </div>
            ${getReplyButton('Re: My Client Portal', 'Hi The Auzent team,%0D%0A%0D%0AI have successfully logged in, but I have a quick question...')}
        `);
    } 
    else if (data.category === 'TESTING_APPROVED') {
        emailSubject = `Action Required: App Testing Approved | The Auzent`;
        emailHtml = generateEmail('Testing Order Approved', `
            <p>Hi ${data.name},</p>
            <p>Your App Testing order has been officially approved by our team!</p>
            <p><strong>Task ID:</strong> <span style="color: #059669; font-weight: bold;">${data.taskId}</span></p>
            <p><strong>Total Price:</strong> ₹${Number(data.price).toLocaleString('en-IN')}</p>
            <h3 style="font-size: 15px; margin-top: 20px;">What happens next?</h3>
            <ol style="padding-left: 20px; margin-top: 10px;">
                <li style="margin-bottom: 10px;">Please click the reply button below or message us on WhatsApp to receive your secure payment link.</li>
                <li style="margin-bottom: 10px;">Once the payment is clear, we will provide you with the list of tester accounts.</li>
                <li>Our 14-day testing process will begin immediately after setup.</li>
            </ol>
            ${getReplyButton('Send me the payment link', 'Hi The Auzent team,%0D%0A%0D%0AThank you for the approval. Please send me the UPI/Payment link so we can start the testing process.')}
        `);
    }
    else if (data.category === 'WORKSPACE_UPDATED') {
        emailSubject = `Project Status Update | The Auzent`;
        emailHtml = generateEmail('Status Updated', `
            <p>Hi ${data.name},</p>
            <p>The status of your project has just been updated.</p>
            <div style="background-color: #EFF6FF; padding: 15px; border-radius: 6px; border-left: 3px solid #2563EB; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1E3A8A;">New Status: ${data.status}</p>
            </div>
            <p>Please log in to your Client Portal to see the latest progress and check your live preview.</p>
            ${getReplyButton('Question about my project status', 'Hi The Auzent team,%0D%0A%0D%0AI saw the recent status update and wanted to ask...')}
        `);
    } 
    else if (data.category === 'BLUEPRINT_SUBMITTED') {
        tgMessage += `✅ *DETAILS LOCKED*\nPortal: ${data.portalId}\nTime: ${submissionTime}\nClient project details locked.`;
        emailSubject = `Project Details Safely Locked | The Auzent`;
        emailHtml = generateEmail('Project Details Locked', `
            <p>Hi there,</p>
            <p>The project details and requirements for Workspace <strong>${data.portalId}</strong> have been securely saved and locked.</p>
            <p>Our developers will now strictly follow these requirements to build your project. Any new major features requested after this point will be treated as a separate addition.</p>
            ${getReplyButton('Re: Locked Details', 'Hi The Auzent team,%0D%0A%0D%0AI know the details are locked, but I forgot to mention one small thing...')}
        `);
    } 
    else if (data.category === 'PAYMENT_REMINDER') {
        emailSubject = `Action Required: Pending Payment | The Auzent`;
        emailHtml = generateEmail('Payment Reminder', `
            <p>Hi ${data.name},</p>
            <p>This is a quick, friendly reminder regarding an upcoming payment for your project workspace (<strong>${data.portalId}</strong>).</p>
            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 5px 0; color: #475569;">Total Project Cost:</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹${Number(data.total).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; color: #475569; border-bottom: 1px solid #E2E8F0;">Amount Paid:</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #059669; border-bottom: 1px solid #E2E8F0;">- ₹${Number(data.paid).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0 0 0; color: #E11D48; font-weight: bold; font-size: 15px;">Amount Pending:</td>
                        <td style="padding: 10px 0 0 0; text-align: right; font-weight: bold; color: #E11D48; font-size: 15px;">₹${Number(data.balance).toLocaleString('en-IN')}</td>
                    </tr>
                </table>
            </div>
            <p>You can easily complete the payment safely by logging into your <a href="https://theauzent.netlify.app/gateway.html" style="color: #2563EB; font-weight:bold;">Client Portal</a> and using the payment QR code.</p>
            <p style="font-size: 12px; color: #64748B;"><em>Note: If you have already paid, please allow up to 4 hours for the payment to show up on your dashboard.</em></p>
            ${getReplyButton('Question about my payment', 'Hi The Auzent team,%0D%0A%0D%0AI have a question regarding the pending payment amount...')}
        `);
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
    });

    try {
        if (sendTelegram && BOT_TOKEN && CHAT_ID) {
            const tgPayload = JSON.stringify({ chat_id: CHAT_ID, text: tgMessage, parse_mode: 'Markdown' });
            const req = https.request({ 
                hostname: 'api.telegram.org', 
                path: `/bot${BOT_TOKEN}/sendMessage`, 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'} 
            }, (res) => { res.on('data', ()=>{}); });
            req.write(tgPayload); 
            req.end();
        }

        if (targetEmail && emailHtml) {
            await transporter.sendMail({ 
                from: `"The Auzent" <${process.env.GMAIL_USER}>`, 
                to: targetEmail, 
                subject: emailSubject, 
                html: emailHtml 
            });
        }
        
        return { statusCode: 200, body: JSON.stringify({ status: 'Success' }) };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ status: 'Error', error: err.message }) };
    }
};