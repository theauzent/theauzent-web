// js/admin.js

let currentEditingEmail = "";
let currentEditingName = "";
let currentEditingWA = "";
let currentEditingId = null;
let currentTestingId = null;

document.addEventListener("DOMContentLoaded", () => {
    const auth = firebase.auth();
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminLoginError = document.getElementById('loginError');
    const leadsContainer = document.getElementById('main-content-grid');
    const liveToast = document.getElementById('liveToast');
    const toastMsg = document.getElementById('toastMsg');

    let currentTab = 'leads'; 
    let unsubscribe = null;

    auth.onAuthStateChanged((user) => {
        if (user) {
            loginScreen.classList.add('hidden');
            dashboardScreen.classList.remove('hidden');
            dashboardScreen.classList.add('flex', 'flex-col');
            initAdminSystem();
        } else {
            loginScreen.classList.remove('hidden');
            dashboardScreen.classList.add('hidden');
            dashboardScreen.classList.remove('flex', 'flex-col');
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            adminLoginError.classList.add('hidden');
            const email = document.getElementById('adminEmail').value.trim();
            const password = document.getElementById('adminPassword').value.trim();

            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                adminLoginError.textContent = "Login Failed: Invalid Admin Details.";
                adminLoginError.classList.remove('hidden');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.signOut();
        });
    }

    function initAdminSystem() {
        calculateStats();
        fetchData();
        
        // Hide unused creation buttons since Client and Lab projects are hardcoded
        const btnLabs = document.querySelector('button[onclick="openCreateModal(\'auzent_labs\')"]');
        const btnProjects = document.querySelector('button[onclick="openCreateModal(\'auzent_projects\')"]');
        if (btnLabs) btnLabs.style.display = 'none';
        if (btnProjects) btnProjects.style.display = 'none';
    }

    function calculateStats() {
        db.collection('auzent_leads').onSnapshot(snap => {
            const pendingEl = document.getElementById('stat-pending');
            if(pendingEl) pendingEl.textContent = snap.size;
        });

        db.collection('auzent_gateways').onSnapshot(snap => {
            let totalIncome = 0;
            let activeProjects = 0;
            let completedProjects = 0;
            snap.forEach(doc => {
                const d = doc.data();
                totalIncome += (Number(d.paid_amount) || 0);
                if(d.status && (d.status.includes('Live') || d.status.includes('Completed'))) completedProjects++; else activeProjects++;
            });
            if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').textContent = `₹${totalIncome.toLocaleString('en-IN')}`;
            if(document.getElementById('stat-active')) document.getElementById('stat-active').textContent = activeProjects;
            if(document.getElementById('stat-done')) document.getElementById('stat-done').textContent = completedProjects;
        });
    }

    function fetchData() {
        if (unsubscribe) unsubscribe();
        
        let col = 'auzent_leads';
        if(currentTab === 'workspaces') col = 'auzent_gateways';
        if(currentTab === 'history') col = 'auzent_audit_logs';
        if(currentTab === 'contacts') col = 'auzent_support';
        if(currentTab === 'reports') col = 'auzent_issues';
        
        let orderField = currentTab === 'history' ? 'audit_timestamp' : 'timestamp';
        if(leadsContainer) leadsContainer.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400 font-mono text-xs">Loading data...</div>';

        unsubscribe = db.collection(col).orderBy(orderField, 'desc').onSnapshot((snapshot) => {
            if(!leadsContainer) return;
            leadsContainer.innerHTML = '';
            
            if (snapshot.empty) {
                leadsContainer.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-xs font-mono">No records found here.</div>`;
                return;
            }

            snapshot.forEach((doc) => {
                if(currentTab === 'leads') leadsContainer.innerHTML += renderLeadCard(doc);
                else if(currentTab === 'workspaces') leadsContainer.innerHTML += renderWorkspaceCard(doc);
                else if(currentTab === 'history') leadsContainer.innerHTML += renderHistoryCard(doc);
                else if(currentTab === 'contacts') leadsContainer.innerHTML += renderContactCard(doc);
                else if(currentTab === 'reports') leadsContainer.innerHTML += renderReportCard(doc);
            });
        });
    }

    function renderLeadCard(doc) {
        const lead = doc.data();
        const rawDate = lead.timestamp && lead.timestamp.toDate ? lead.timestamp.toDate().toLocaleDateString() : 'Recent';
        const displayBudget = lead.projectType === 'QA Testing Service' ? (lead.package || lead.budget || 'Testing Package') : (lead.budget || 'Not Provided');

        return `
            <div onclick="window.viewLeadDetails('${doc.id}')" class="glass-card p-6 border-l-4 border-l-blue-600 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group searchable-card bg-white pointer-events-auto">
                <div>
                    <div class="flex justify-between text-[10px] mb-2 font-mono font-bold uppercase tracking-wider">
                        <span class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">${lead.projectType || 'General Project'}</span>
                        <span class="text-slate-400">${rawDate}</span>
                    </div>
                    <h3 class="text-lg font-montserrat font-bold text-[#0F172A] mb-1 searchable-text">${lead.name || 'Client Name'}</h3>
                    <p class="text-emerald-600 font-bold text-xs mb-3">${displayBudget}</p>
                    <p class="text-slate-500 text-xs font-mono searchable-text truncate">${lead.email || 'No Email'}</p>
                </div>
            </div>`;
    }

    function renderWorkspaceCard(doc) {
        const data = doc.data();
        const isTesting = doc.id.startsWith('AZ-TST');
        const borderColor = isTesting ? 'border-l-purple-500' : 'border-l-emerald-500';
        const tagBg = isTesting ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
        const typeTag = isTesting ? 'App Testing' : 'Active Project';

        return `
            <div class="glass-card p-6 border-l-4 ${borderColor} searchable-card bg-white pointer-events-auto">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="text-base font-montserrat font-bold text-[#0F172A] searchable-text">${data.name || 'Client Name'}</h3>
                    <span class="text-[9px] font-mono font-bold uppercase tracking-wider ${tagBg} border px-2 py-0.5 rounded">${typeTag}</span>
                </div>
                <p class="text-[10px] text-slate-500 font-mono font-bold mb-1">${isTesting ? 'Task ID:' : 'Portal ID:'} <strong class="text-blue-600">${doc.id}</strong></p>
                <p class="text-[10px] text-slate-500 mb-4 font-bold uppercase">${data.status || 'Active'}</p>
                <button onclick="${isTesting ? `openTestingMgmtModal('${doc.id}')` : `openMgmtModal('${doc.id}')`}" class="w-full ${isTesting ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#2563EB] hover:bg-blue-700'} text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm">Manage</button>
            </div>`;
    }

    function renderContactCard(doc) {
        const data = doc.data();
        return `
            <div onclick="window.viewMessageDetails('${doc.id}', 'CONTACT')" class="glass-card p-6 border-l-4 border-l-sky-500 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all searchable-card bg-white pointer-events-auto">
                <div>
                    <div class="flex justify-between text-[10px] mb-2 font-mono font-bold uppercase tracking-wider text-slate-400">
                        <span>${data.platform || 'Direct'}</span>
                        <span>Message</span>
                    </div>
                    <h3 class="text-base font-bold text-[#0F172A] mb-1 searchable-text">${data.name || data.email}</h3>
                    <p class="text-slate-500 text-xs font-mono searchable-text">${data.email || 'N/A'}</p>
                </div>
            </div>`;
    }

    function renderReportCard(doc) {
        const data = doc.data();
        return `
            <div onclick="window.viewMessageDetails('${doc.id}', 'REPORT')" class="glass-card p-6 border-l-4 border-l-red-500 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all searchable-card bg-white pointer-events-auto">
                <div>
                    <div class="flex justify-between text-[10px] mb-2 font-mono font-bold uppercase tracking-wider text-red-600">
                        <span>${data.type || 'ISSUE'}</span>
                        <span>Issue Report</span>
                    </div>
                    <h3 class="text-base font-bold text-[#0F172A] mb-1 searchable-text">${data.email || 'User'}</h3>
                    <p class="text-slate-500 text-xs mt-2 line-clamp-2">${data.description || ''}</p>
                </div>
            </div>`;
    }

    function renderHistoryCard(doc) {
        const log = doc.data();
        const actionColor = log.audit_action.includes('Completed') ? 'text-blue-600 bg-blue-50' : (log.audit_action.includes('Approved') ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50');
        const dateStr = log.audit_timestamp && log.audit_timestamp.toDate ? log.audit_timestamp.toDate().toLocaleDateString() : 'N/A';
        return `
            <div class="glass-card p-6 border-l-4 border-l-slate-300 opacity-80 hover:opacity-100 transition-all searchable-card bg-white pointer-events-auto">
                <div class="flex justify-between text-[10px] mb-2 font-mono font-bold uppercase">
                    <span class="text-slate-500">${log.projectType || 'Project'}</span>
                    <span class="${actionColor} px-2 py-0.5 rounded border text-center">${log.audit_action}</span>
                </div>
                <h3 class="text-base font-bold text-[#0F172A] mb-1 searchable-text">${log.name}</h3>
                <p class="text-xs text-slate-500 mb-1 searchable-text font-mono">📧 ${log.email} | 📱 ${log.whatsapp || 'N/A'}</p>
                <p class="text-[10px] text-slate-400 font-mono mt-3">Date: ${dateStr}</p>
            </div>`;
    }

    window.viewLeadDetails = async (id) => {
        const doc = await db.collection('auzent_leads').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();
        
        document.getElementById('currentLeadId').value = id;
        document.getElementById('ldName').textContent = data.name || 'Client Name';
        document.getElementById('ldType').textContent = data.projectType || 'Project Type';
        document.getElementById('ldEmail').textContent = data.email || 'N/A';
        document.getElementById('ldEmail').href = `mailto:${data.email}`;
        document.getElementById('ldWhatsapp').textContent = data.whatsapp || 'N/A';
        document.getElementById('ldWhatsapp').href = `https://wa.me/${(data.whatsapp||'').replace(/\D/g,'')}`;
        
        const displayBudget = data.projectType === 'QA Testing Service' ? (data.package || data.budget || 'Testing Package') : (data.budget || 'N/A');
        document.getElementById('ldBudget').textContent = displayBudget;

        document.getElementById('ldTimeline').textContent = data.timeline || 'Not Specified';
        document.getElementById('ldFeatures').textContent = data.features || 'No details provided.';
        
        const ipEl = document.getElementById('ldIP');
        const devEl = document.getElementById('ldDevice');
        if(ipEl) ipEl.textContent = data.client_ip || 'Hidden';
        if(devEl) devEl.textContent = data.client_device || 'Hidden';

        const refLink = document.getElementById('ldRef');
        if(data.reference && data.reference !== "None") {
            refLink.href = data.reference;
            refLink.classList.remove('hidden');
        } else {
            refLink.classList.add('hidden');
        }

        const returningTag = document.getElementById('ldReturningTag');
        if (returningTag) {
            let isDuplicate = false;
            if(data.email) {
                const actMail = await db.collection('auzent_gateways').where('email', '==', data.email).get();
                if(!actMail.empty) isDuplicate = true;
            }
            if(!isDuplicate && data.email) {
                const logMail = await db.collection('auzent_audit_logs').where('email', '==', data.email).get();
                if(!logMail.empty) isDuplicate = true;
            }

            if (isDuplicate) {
                returningTag.textContent = "⚠️ MATCHING EMAIL FOUND";
                returningTag.classList.remove('hidden', 'bg-blue-100', 'text-blue-700', 'border-blue-200');
                returningTag.classList.add('bg-amber-100', 'text-amber-800', 'border-amber-300');
            } else {
                returningTag.classList.add('hidden');
            }
        }

        const modal = document.getElementById('leadDetailsModal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        document.getElementById('btnApproveMain').onclick = () => window.approveLead(id);
        document.getElementById('btnRejectMain').onclick = () => window.rejectLead(id);
    };

    window.closeLeadModal = () => {
        const modal = document.getElementById('leadDetailsModal');
        if(modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    window.approveLead = async (id) => {
        const agreedPrice = Number(document.getElementById('onboardPrice').value);
        if(!agreedPrice || agreedPrice <= 0) return alert("Please enter a final project price to accept.");

        if(!confirm("Are you sure you want to approve this project and create a client portal?")) return;
        const btn = document.getElementById('btnApproveMain');
        btn.textContent = "Creating Portal...";

        try {
            const leadRef = db.collection('auzent_leads').doc(id);
            const data = (await leadRef.get()).data();
            const isTesting = data.projectType === 'QA Testing Service';
            
            let portalId, pin, targetCategory, alertMsg;

            if (isTesting) {
                portalId = "AZ-TST-" + Math.floor(1000 + Math.random() * 9000);
                targetCategory = 'TESTING_APPROVED';
                
                await db.collection('auzent_gateways').doc(portalId).set({
                    ...data,
                    portalId: portalId, 
                    is_testing_order: true,
                    status: 'Payment Pending',
                    total_price: agreedPrice,
                    paid_amount: 0,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alertMsg = `Hello ${data.name},\n\nGood news! Your App Testing request has been approved. ✅\n\nTask ID: *${portalId}*\nTotal Price: ₹${agreedPrice.toLocaleString('en-IN')}\n\nPlease check your email (${data.email}) for the next steps and payment details. We will begin testing as soon as the payment is confirmed.`;

            } else {
                portalId = "AZ-" + Math.floor(1000 + Math.random() * 9000);
                pin = Math.floor(1000 + Math.random() * 9000);
                targetCategory = 'WORKSPACE_APPROVED';
                
                await db.collection('auzent_gateways').doc(portalId).set({
                    ...data,
                    portalId: portalId,
                    portalPin: pin,
                    status: 'Development in Progress',
                    total_price: agreedPrice,
                    paid_amount: 0,
                    is_preview_active: false,
                    admin_locked: false,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alertMsg = `Hello ${data.name},\n\nYour Auzent Client Portal is ready! 🚀\n\nWe have securely sent your Portal ID and Security PIN to your email address (*${data.email}*).\n\nPlease check your inbox to log in here: https://theauzent.netlify.app/gateway.html`;
            }

            await db.collection('auzent_audit_logs').add({
                ...data,
                portalId: portalId,
                audit_action: 'Approved & Created',
                audit_timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await leadRef.delete(); 

            try {
                await fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category: targetCategory, email: data.email, name: data.name, portalId: portalId, pin: pin, taskId: portalId, price: agreedPrice })
                });
            } catch(e) {}

            window.closeLeadModal();
            showToast("Project created successfully.");

            const cleanWA = (data.whatsapp || '').replace(/\D/g, '');
            if(cleanWA) window.open(`https://wa.me/${cleanWA}?text=${encodeURIComponent(alertMsg)}`, '_blank');

        } catch (err) {
            console.error(err);
            alert("Error: Could not create the project.");
        } finally {
            if(document.getElementById('btnApproveMain')) document.getElementById('btnApproveMain').textContent = "Approve & Create Portal";
        }
    };

    window.rejectLead = async (id) => {
        if(!confirm("Are you sure you want to reject this request? It will be moved to the Activity Logs.")) return;
        try {
            const leadRef = db.collection('auzent_leads').doc(id);
            const data = (await leadRef.get()).data();

            await db.collection('auzent_audit_logs').add({
                ...data,
                audit_action: 'Rejected',
                audit_timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await leadRef.delete();
            window.closeLeadModal();
            showToast("Request rejected and moved to logs.");
        } catch (err) {
            console.error(err);
        }
    };

    window.archiveProject = async () => {
        const idToArchive = currentEditingId || currentTestingId;
        if(!idToArchive) return;
        if(!confirm("Are you sure you want to archive this project? It will be removed from the active projects list.")) return;
        
        try {
            const docRef = db.collection('auzent_gateways').doc(idToArchive);
            const doc = await docRef.get();
            if(!doc.exists) return;

            await db.collection('auzent_audit_logs').add({
                ...doc.data(),
                audit_action: 'Completed & Archived',
                audit_timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            await docRef.delete();
            
            if(document.getElementById('mgmtModal')) document.getElementById('mgmtModal').classList.add('hidden');
            if(document.getElementById('testingMgmtModal')) document.getElementById('testingMgmtModal').classList.add('hidden');
            
            showToast("Project archived successfully.");
        } catch(err) {
            alert("Error: Could not archive the project.");
        }
    };

    window.openMgmtModal = async (id) => {
        currentEditingId = id;
        currentTestingId = null;
        const modal = document.getElementById('mgmtModal');
        const doc = await db.collection('auzent_gateways').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();

        currentEditingEmail = data.email || "";
        currentEditingName = data.name || "Client";
        currentEditingWA = data.whatsapp || data.v_client_phone || "";

        document.getElementById('modalClientName').textContent = data.name || 'Client Name';
        document.getElementById('modalProjectId').textContent = `ID: ${doc.id} | PIN: ${data.portalPin || 'N/A'}`;
        
        document.getElementById('mTotal').value = data.total_price || 0;
        document.getElementById('mPaid').value = data.paid_amount || 0;
        document.getElementById('mStatus').value = data.status || "Development in Progress";
        document.getElementById('mUrl').value = data.tunnel_url || "";
        document.getElementById('mPreviewActive').checked = data.is_preview_active || false;
        document.getElementById('mAssets').value = data.asset_link || "";

        const timerStatus = document.getElementById('mTimerStatus');
        if(timerStatus) {
            if (data.admin_locked) timerStatus.textContent = "Status: Locked";
            else if (data.timer_finished) timerStatus.textContent = "Status: Time Up, Locked";
            else if (data.timer_started_at) timerStatus.textContent = "Status: Timer is Running";
            else timerStatus.textContent = "Status: Waiting for Client";
        }

        document.getElementById('btnViewBlueprint').onclick = () => window.viewArchitectureBlueprint(id);
        document.getElementById('btnGenerateInvoice').onclick = () => window.generateAdminInvoice(id);
        
        const btnWa = document.getElementById('btnRemindWA');
        const btnEm = document.getElementById('btnRemindEmail');
        if (btnWa) btnWa.onclick = () => window.sendPaymentReminder(id, 'WA');
        if (btnEm) btnEm.onclick = () => window.sendPaymentReminder(id, 'EMAIL');

        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };

    window.closeMgmtModal = () => {
        const modal = document.getElementById('mgmtModal');
        if(modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    window.saveProjectChanges = async () => {
        const btn = event.target;
        if(btn) btn.textContent = "Saving...";
        const newStatus = document.getElementById('mStatus').value;
        
        await db.collection('auzent_gateways').doc(currentEditingId).update({
            total_price: Number(document.getElementById('mTotal').value),
            paid_amount: Number(document.getElementById('mPaid').value),
            status: newStatus,
            tunnel_url: document.getElementById('mUrl').value,
            is_preview_active: document.getElementById('mPreviewActive').checked,
            asset_link: document.getElementById('mAssets').value
        });
        
        await fetch('/.netlify/functions/notifyAdmin', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: 'WORKSPACE_UPDATED', email: currentEditingEmail, name: currentEditingName, status: newStatus })
        }).catch(e => console.log(e));

        window.closeMgmtModal();
        showToast("Project saved.");
        if(btn) btn.textContent = "Save Changes";

        if(currentEditingWA && confirm("Would you like to send a quick status update to the client on WhatsApp?")) {
            const cleanWA = currentEditingWA.replace(/\D/g, '');
            const waMsg = encodeURIComponent(`Hello ${currentEditingName},\n\nThe status of your Auzent project is now: *${newStatus}*.\n\nPlease log in to your portal to see more details.`);
            window.open(`https://wa.me/${cleanWA}?text=${waMsg}`, '_blank');
        }
    };

    window.startScopeTimer = async () => {
        await db.collection('auzent_gateways').doc(currentEditingId).update({
            timer_started_at: firebase.firestore.FieldValue.serverTimestamp(),
            timer_finished: false,
            admin_locked: false
        });
        document.getElementById('mTimerStatus').textContent = "Status: Timer Running";
        showToast("48-hour timer has started.");
    };

    window.forceLock = async () => {
        await db.collection('auzent_gateways').doc(currentEditingId).update({
            admin_locked: true
        });
        document.getElementById('mTimerStatus').textContent = "Status: Locked";
        showToast("Project details are now permanently locked.");
    };

    window.openTestingMgmtModal = async (id) => {
        currentTestingId = id;
        currentEditingId = null;
        const modal = document.getElementById('testingMgmtModal');
        const doc = await db.collection('auzent_gateways').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();

        document.getElementById('tmClientName').textContent = data.name || 'Client';
        document.getElementById('tmTaskId').textContent = `TASK ID: ${id}`;
        document.getElementById('tmTotal').value = data.total_price || 0;
        document.getElementById('tmPaid').value = data.paid_amount || 0;
        document.getElementById('tmStatus').value = data.status || "Payment Pending";

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    window.closeTestingMgmtModal = () => {
        document.getElementById('testingMgmtModal').classList.add('hidden');
        document.getElementById('testingMgmtModal').classList.remove('flex');
    };

    window.saveTestingOrderChanges = async () => {
        const newStatus = document.getElementById('tmStatus').value;
        await db.collection('auzent_gateways').doc(currentTestingId).update({
            total_price: Number(document.getElementById('tmTotal').value),
            paid_amount: Number(document.getElementById('tmPaid').value),
            status: newStatus
        });
        window.closeTestingMgmtModal();
        showToast("Testing order saved.");
    };

    window.viewTesterFeedbacks = async () => {
        const contentBox = document.getElementById('testerFeedbackContent');
        contentBox.innerHTML = '<p class="text-sm text-slate-500">Loading reports...</p>';
        document.getElementById('tfTaskId').textContent = `Task ID: ${currentTestingId}`;
        
        document.getElementById('testerFeedbackModal').classList.remove('hidden');
        document.getElementById('testerFeedbackModal').classList.add('flex');

        const snap = await db.collection('testing_feedback').where('taskId', '==', currentTestingId).get();
        if (snap.empty) {
            contentBox.innerHTML = '<p class="text-sm text-slate-500 p-4">No bug reports found yet.</p>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const fb = doc.data();
            const dateStr = fb.timestamp ? fb.timestamp.toDate().toLocaleDateString() : 'N/A';
            const jsonStr = encodeURIComponent(JSON.stringify(fb));

            html += `
                <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm relative flex gap-3">
                    <input type="checkbox" class="qa-checkbox mt-1 w-4 h-4 accent-blue-600 cursor-pointer" value="${jsonStr}">
                    <div class="flex-1">
                        <span class="absolute top-4 right-4 text-[9px] font-bold uppercase bg-slate-200 text-slate-600 px-2 py-1 rounded">${dateStr}</span>
                        <p class="text-[10px] text-purple-600 font-bold uppercase tracking-widest mb-1">${fb.bugCategory}</p>
                        <p class="text-xs text-[#0F172A] font-bold font-mono mb-3">Tester: ${fb.testerId}</p>
                        <p class="text-xs text-slate-600 mb-3 bg-white p-3 rounded border border-slate-200">${fb.detailedReview}</p>
                        <p class="text-[10px] text-slate-500 font-mono mb-3">📱 Device: ${fb.deviceDetails}</p>
                        ${fb.screenshotUrl ? `<a href="${fb.screenshotUrl}" target="_blank" class="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded font-bold uppercase tracking-widest inline-block hover:bg-blue-600 hover:text-white transition">View Screenshot</a>` : ''}
                    </div>
                </div>
            `;
        });
        contentBox.innerHTML = html;
    };

    window.generateQAPDF = () => {
        const checkboxes = document.querySelectorAll('.qa-checkbox:checked');
        if (checkboxes.length === 0) {
            alert("Please select at least one bug report to generate a PDF.");
            return;
        }

        let reportRows = '';
        checkboxes.forEach((box, index) => {
            const fb = JSON.parse(decodeURIComponent(box.value));
            const dateStr = fb.timestamp ? new Date(fb.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
            
            reportRows += `
                <tr>
                    <td><strong>#${index + 1}</strong><br><span style="font-size: 10px; color: #64748B;">${dateStr}</span></td>
                    <td><span style="color: #2563EB; text-transform: uppercase; font-size: 10px; font-weight: bold;">${fb.bugCategory}</span><br>${fb.detailedReview}</td>
                    <td><span style="font-family: monospace; font-size: 10px;">${fb.deviceDetails}</span></td>
                    <td>${fb.screenshotUrl ? `<a href="${fb.screenshotUrl}" target="_blank" style="color: #2563EB; font-weight: bold; text-decoration: none;">View</a>` : 'None'}</td>
                </tr>
            `;
        });

        const html = `
        <html>
        <head>
            <title>Bug_Report_${currentTestingId}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px 50px; color: #0F172A; background: #ffffff; }
                .header { text-align: center; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
                .brand { font-size: 24px; font-weight: 800; color: #0F172A; letter-spacing: 1px; }
                .title { font-size: 18px; color: #2563EB; text-transform: uppercase; margin: 10px 0; font-weight: 800; }
                .meta { font-size: 12px; color: #475569; font-weight: 600; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #0F172A; color: #ffffff; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; }
                td { padding: 15px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; line-height: 1.5; }
                .footer { margin-top: 50px; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 10px; color: #64748B; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand">THE AUZENT</div>
                <div class="title">App Testing & Bug Report</div>
                <div class="meta">TASK ID: ${currentTestingId} | DATE: ${new Date().toLocaleDateString()}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th width="10%">No.</th>
                        <th width="50%">Issue Details</th>
                        <th width="25%">Device Info</th>
                        <th width="15%">Screenshot</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportRows}
                </tbody>
            </table>
            <div class="footer">
                <p>This document contains official testing feedback generated by The Auzent.</p>
            </div>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 800);
    };

    window.viewArchitectureBlueprint = async (id) => {
        const doc = await db.collection('auzent_gateways').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();

        const allFields = {
            'web_goal': 'Main Goal',
            'web_audience': 'Target Audience',
            'web_pages': 'Total Pages',
            'web_refs': 'Reference Links',
            'web_theme': 'Design Style',
            'web_hosting': 'Hosting Status',
            'web_features': 'Required Features',
            'web_journey': 'User Journey',
            'app_name': 'App Name',
            'app_platform': 'App Platform',
            'app_screens': 'Total Screens',
            'app_audience': 'Target Audience',
            'app_purpose': 'App Purpose',
            'app_refs': 'Competitor Apps',
            'app_auth': 'Login Method',
            'app_admin': 'Admin Panel Needed',
            'app_features': 'Core Features',
            'app_hardware': 'Device Features Needed',
            'app_monetization': 'How to Make Money',
            'comp_mods': 'Changes Needed',
            'ui_design': 'Design Files',
            'api_reqs': 'Third-Party APIs',
            'content_status': 'Text & Images Status'
        };

        const webKeys = ['web_goal', 'web_audience', 'web_pages', 'web_refs', 'web_theme', 'web_hosting', 'web_features', 'web_journey', 'ui_design', 'api_reqs', 'content_status'];
        const appKeys = ['app_name', 'app_platform', 'app_screens', 'app_audience', 'app_purpose', 'app_refs', 'app_auth', 'app_admin', 'app_features', 'app_hardware', 'app_monetization', 'ui_design', 'api_reqs', 'content_status'];
        const compKeys = ['comp_mods'];

        let keysToShow = [];
        const pt = data.projectType;
        if (pt === 'web' || pt === 'website') keysToShow = webKeys;
        else if (pt === 'app') keysToShow = appKeys;
        else if (pt === 'ecosystem' || pt === 'both') keysToShow = [...webKeys, ...appKeys];
        else if (pt === 'component') keysToShow = compKeys;
        else keysToShow = Object.keys(allFields);

        let html = '';
        keysToShow.forEach(key => {
            const formattedKey = allFields[key] || key.toUpperCase();
            const val = data[key] ? `<span class="text-[#0F172A] font-semibold">${data[key]}</span>` : `<span class="text-red-500 italic">Not Provided</span>`;
            
            html += `
                <div class="mb-4 bg-white p-4 rounded-lg border border-slate-200">
                    <div class="text-blue-600 text-[10px] uppercase font-bold tracking-widest mb-1">■ ${formattedKey}</div>
                    <div class="text-sm">${val}</div>
                </div>`;
        });

        if(!html) html = `<p class="text-sm text-slate-500 p-4 text-center">The client has not saved any project details yet.</p>`;

        document.getElementById('blueprintContent').innerHTML = html;
        document.getElementById('blueprintViewModal').classList.remove('hidden');
        document.getElementById('blueprintViewModal').classList.add('flex');
    };

    window.generateAdminInvoice = async (id) => {
        const doc = await db.collection('auzent_gateways').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();
        
        let invoiceNo = data.invoice_no;
        if (!invoiceNo) {
            invoiceNo = `INV-${id}-${Math.floor(Math.random() * 10000)}`;
            await db.collection('auzent_gateways').doc(id).update({ invoice_no: invoiceNo });
        }

        const total = Number(data.total_price || 0);
        const paid = Number(data.paid_amount || 0);
        const balance = total - paid;
        
        const dateObj = new Date();
        const dateStr = dateObj.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = dateObj.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
        const clientPhone = data.whatsapp || data.v_client_phone || 'N/A';

        const html = `
        <html>
        <head>
            <title>Invoice_${invoiceNo}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@500;700&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px 60px; color: #0F172A; background: #ffffff; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563EB; padding-bottom: 20px; margin-bottom: 30px; }
                .brand { font-size: 28px; font-weight: 800; color: #0F172A; letter-spacing: 1px; }
                .sub-brand { font-size: 10px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
                .invoice-title { font-size: 32px; font-weight: 800; color: #2563EB; text-transform: uppercase; margin: 0; text-align: right; }
                .invoice-meta { text-align: right; font-size: 12px; color: #475569; font-family: 'JetBrains Mono', monospace; font-weight: 700; margin-top: 5px; }
                .details-grid { display: flex; justify-content: space-between; margin-bottom: 40px; background: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; }
                .details-box h3 { font-size: 10px; color: #2563EB; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-top: 0; margin-bottom: 5px; }
                .details-box p { font-size: 13px; font-weight: 600; margin: 2px 0; color: #0F172A; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #0F172A; color: #ffffff; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
                td { padding: 15px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; }
                .text-right { text-align: right; }
                .totals { float: right; width: 300px; }
                .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; font-weight: 600; }
                .totals-row.final { border-top: 2px solid #0F172A; font-size: 18px; font-weight: 800; color: #2563EB; margin-top: 5px; padding-top: 10px; }
                .footer { clear: both; margin-top: 80px; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 10px; color: #64748B; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="brand">THE AUZENT</div>
                    <div class="sub-brand">Software Solutions</div>
                    <div style="font-size: 11px; color: #475569; margin-top: 10px; font-weight: 600;">theauzent@gmail.com<br>https://theauzent.netlify.app</div>
                </div>
                <div>
                    <h1 class="invoice-title">INVOICE</h1>
                    <div class="invoice-meta">INVOICE NO: ${invoiceNo}<br>DATE: ${dateStr} ${timeStr}</div>
                </div>
            </div>

            <div class="details-grid">
                <div class="details-box">
                    <h3>Issued To</h3>
                    <p>${data.name || data.v_client_name || 'Client'}</p>
                    <p>${data.email || ''}</p>
                    <p>${clientPhone}</p>
                    <p style="font-weight: normal; margin-top: 4px;">${data.v_client_address || ''}</p>
                </div>
                <div class="details-box" style="text-align: right;">
                    <h3>Project Details</h3>
                    <p>Portal ID: ${id}</p>
                    <p>Type: ${data.projectType ? data.projectType.toUpperCase() : 'PROJECT'}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="text-right">Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Software Development & Services<br><span style="font-size: 10px; color: #64748B; font-weight: normal;">As per agreed project details</span></td>
                        <td class="text-right">₹${total.toLocaleString('en-IN')}</td>
                    </tr>
                </tbody>
            </table>

            <div class="totals">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>₹${total.toLocaleString('en-IN')}</span>
                </div>
                <div class="totals-row" style="color: #10B981;">
                    <span>Amount Paid:</span>
                    <span>- ₹${paid.toLocaleString('en-IN')}</span>
                </div>
                <div class="totals-row final">
                    <span>Balance Due:</span>
                    <span>₹${balance.toLocaleString('en-IN')}</span>
                </div>
            </div>

            <div class="footer">
                <p>This is an automated invoice generated securely by The Auzent.</p>
            </div>
        </body>
        </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 800);
    };

    window.sendPaymentReminder = async (id, method) => {
        const doc = await db.collection('auzent_gateways').doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();

        const total = Number(data.total_price || 0);
        const paid = Number(data.paid_amount || 0);
        const balance = total - paid;

        if (balance <= 0) {
            alert("The client has already paid in full. There is no pending balance.");
            return;
        }

        if (method === 'WA') {
            const phoneRaw = data.whatsapp || data.v_client_phone || "";
            const cleanWA = phoneRaw.replace(/\D/g, '');

            if (!cleanWA) {
                alert("We couldn't find the client's phone number.");
                return;
            }

            const msg = `Hello ${data.name || 'Client'},\n\nThis is a friendly reminder regarding the pending payment for your project *${id}*.\n\n*Payment Details:*\nTotal Cost: ₹${total.toLocaleString('en-IN')}\nAmount Paid: ₹${paid.toLocaleString('en-IN')}\n*Amount Pending: ₹${balance.toLocaleString('en-IN')}*\n\nYou can easily complete this payment safely via your Client Portal: https://theauzent.netlify.app/gateway.html\n\nPlease let us know if you need any assistance.\n\nBest regards,\nThe Auzent Team`;

            window.open(`https://wa.me/${cleanWA}?text=${encodeURIComponent(msg)}`, '_blank');
        } else if (method === 'EMAIL') {
            if (!data.email) {
                alert("We couldn't find the client's email address.");
                return;
            }
            const btn = document.getElementById('btnRemindEmail');
            const origText = btn.innerHTML;
            btn.innerHTML = "Sending...";
            try {
                const res = await fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        category: 'PAYMENT_REMINDER', 
                        email: data.email, 
                        name: data.name, 
                        portalId: id, 
                        total: total, 
                        paid: paid, 
                        balance: balance 
                    })
                });
                
                if (res.ok) {
                    showToast("Payment reminder email has been sent successfully.");
                } else {
                    alert("Error: Something went wrong while sending the email.");
                }
            } catch (e) {
                alert("Error: " + e.message);
            } finally {
                btn.innerHTML = origText;
            }
        }
    };

    window.viewMessageDetails = async (id, type) => {
        const col = type === 'CONTACT' ? 'auzent_support' : 'auzent_issues';
        const doc = await db.collection(col).doc(id).get();
        if(!doc.exists) return;
        const data = doc.data();

        document.getElementById('msgTag').textContent = type === 'CONTACT' ? 'Direct Message' : 'Issue Report';
        document.getElementById('msgSubject').textContent = data.name || data.email || 'Message';
        document.getElementById('msgEmail').textContent = data.email || 'Not Provided';
        document.getElementById('msgEmail').href = `mailto:${data.email}`;
        
        const platform = document.getElementById('msgPlatform');
        if (platform && data.platform_id) {
            platform.textContent = `📱 Via: ${data.platform} (${data.platform_id})`;
            platform.classList.remove('hidden');
        } else if(platform) {
            platform.classList.add('hidden');
        }

        document.getElementById('msgBody').textContent = data.message || data.description || '';

        const modal = document.getElementById('messageViewModal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        document.getElementById('btnResolveMsg').onclick = async () => {
            await db.collection(col).doc(id).delete();
            window.closeMessageModal();
            showToast("Message marked as resolved and removed.");
        };
        document.getElementById('btnDeleteMsg').onclick = async () => {
            if(confirm("Are you sure you want to delete this message forever?")) {
                await db.collection(col).doc(id).delete();
                window.closeMessageModal();
                showToast("Message deleted successfully.");
            }
        };
    };

    window.closeMessageModal = () => {
        const modal = document.getElementById('messageViewModal');
        if(modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    window.openCreateModal = (rawCol) => {
        let col = 'auzent_utilities'; 
        const modal = document.getElementById('createModal');
        document.getElementById('targetCollection').value = col;
        
        document.getElementById('createTitle').textContent = "Add New Developer Tool";
        
        const microBox = document.getElementById('microOnly');
        if(microBox) microBox.classList.remove('hidden');

        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };

    window.closeCreateModal = () => {
        const modal = document.getElementById('createModal');
        if(modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    const createForm = document.getElementById('createForm');
    if(createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const col = document.getElementById('targetCollection').value;
            const btn = e.target.querySelector('button');
            if(btn) btn.textContent = "Publishing...";

            const newData = {
                title: document.getElementById('cTitle').value,
                image_url: document.getElementById('cImage').value,
                live_link: document.getElementById('cLive').value,
                tech_stack: document.getElementById('cTech').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            const repoInput = document.getElementById('cRepo');
            if(repoInput) newData.repo_link = repoInput.value;

            try {
                const snap = await db.collection(col).get();
                const count = snap.size + 1;
                const customId = "TOOL-" + count.toString().padStart(2, '0');
                
                await db.collection(col).doc(customId).set(newData);
                
                showToast(`Tool added successfully.`);
                window.closeCreateModal();
                createForm.reset();
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                if(btn) btn.textContent = "Publish Tool";
            }
        });
    }

    window.switchTab = (tab) => {
        currentTab = tab;
        const tabs = ['leads', 'contacts', 'reports', 'workspaces', 'history'];

        tabs.forEach(t => {
            const btn = document.getElementById(`tab-${t}`);
            if(btn) btn.className = "text-sm font-bold text-[#475569] pb-2 hover:text-[#0F172A] transition-all whitespace-nowrap cursor-pointer";
        });
        
        const activeBtn = document.getElementById(`tab-${tab}`);
        if(activeBtn) activeBtn.className = "text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-2 transition-all whitespace-nowrap cursor-pointer";
        
        fetchData();
    };

    window.searchDashboard = (query) => {
        const term = query.toLowerCase();
        const cards = document.querySelectorAll('.searchable-card');
        cards.forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(term) ? 'flex' : 'none';
        });
    };

    function showToast(msg) {
        if(!liveToast || !toastMsg) return;
        toastMsg.textContent = msg;
        liveToast.classList.remove('translate-y-20', 'opacity-0');
        setTimeout(() => liveToast.classList.add('translate-y-20', 'opacity-0'), 4000);
    }
});