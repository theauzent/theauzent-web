// js/gateway.js

let currentWorkspaceId = null;
let workspaceUnsubscribe = null;
let countdownInterval = null;
let clientSecurityIP = "Hidden";
let fetchedDevice = navigator.userAgent;

function setProcessing(isProcessing) {
    const loader = document.getElementById('processing-loader');
    if (isProcessing) {
        if(loader) loader.classList.add('active');
        document.body.classList.add('cursor-wait', 'pointer-events-none');
    } else {
        if(loader) loader.classList.remove('active');
        document.body.classList.remove('cursor-wait', 'pointer-events-none');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Show/Hide Password Logic
    const togglePinBtn = document.getElementById('togglePinBtn');
    const clientPinInput = document.getElementById('clientPin');

    if (togglePinBtn && clientPinInput) {
        togglePinBtn.addEventListener('click', () => {
            if (clientPinInput.type === 'password') {
                clientPinInput.type = 'text';
                togglePinBtn.textContent = 'HIDE';
            } else {
                clientPinInput.type = 'password';
                togglePinBtn.textContent = 'SHOW';
            }
        });
    }

    // Direct Link to Terms Page (Fixing the Modal Issue)
    const viewCriteriaBtn = document.getElementById('viewCriteriaBtn');
    if (viewCriteriaBtn) {
        viewCriteriaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('terms.html', '_blank');
        });
    }

    // Login Form Logic
    const loginForm = document.getElementById('portalLoginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setProcessing(true);
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Logging in...';
            loginError.classList.add('hidden');

            let rawInputId = document.getElementById('clientId').value.trim().toUpperCase();
            if (!rawInputId.startsWith('AZ-')) {
                rawInputId = 'AZ-' + rawInputId.replace(/[^0-9]/g, '');
            }
            const clientPin = Number(clientPinInput.value.trim());

            try {
                let docRef = await db.collection('auzent_gateways').doc(rawInputId).get();
                let clientDoc = null;

                if (docRef.exists) {
                    clientDoc = docRef;
                } else {
                    const querySnapshot = await db.collection('auzent_gateways').where('portalId', '==', rawInputId).get();
                    if (!querySnapshot.empty) clientDoc = querySnapshot.docs[0];
                }

                if (clientDoc) {
                    const data = clientDoc.data();
                    const storedPin = data.portalPin !== undefined ? Number(data.portalPin) : Number(data.pin);

                    if (storedPin === clientPin) {
                        currentWorkspaceId = clientDoc.id; 
                        document.getElementById('login-view').classList.add('hidden');
                        document.getElementById('dashboard-view').classList.remove('hidden');
                        document.getElementById('dashboard-view').classList.add('flex');

                        document.getElementById('auth-status').innerHTML = `
                            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
                            <span class="text-xs text-emerald-600 font-mono font-bold tracking-tighter">Connected Safely</span>
                        `;
                        initLiveDashboard(clientDoc.id);
                    } else {
                        loginError.textContent = "Login Failed: Incorrect PIN.";
                        loginError.classList.remove('hidden');
                    }
                } else {
                    loginError.textContent = "Login Failed: Workspace ID not found.";
                    loginError.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Login Error:", error);
                loginError.textContent = "Error: Could not connect to the server.";
                loginError.classList.remove('hidden');
            } finally {
                submitBtn.textContent = 'Login';
                setProcessing(false);
            }
        });
    }

    // Feedback Form Logic
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setProcessing(true);
            const dataToSave = {
                portalId: currentWorkspaceId,
                rating: document.getElementById('fRating').value,
                review: document.getElementById('fReview').value,
                clientName: document.getElementById('v_client_name').value || 'Client',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection('auzent_testimonials').add(dataToSave);
                document.getElementById('feedbackForm').classList.add('hidden');
                document.getElementById('feedbackSuccess').classList.remove('hidden');
            } catch(err) {
                alert("Error: Could not save your review right now.");
            } finally {
                setProcessing(false);
            }
        });
    }

    // Maintenance Ticket Logic
    const maintenanceForm = document.getElementById('maintenanceForm');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setProcessing(true);
            const dataToSave = {
                email: document.getElementById('v_client_email').value || currentWorkspaceId,
                type: '[SUPPORT TICKET] ' + document.getElementById('mTicketType').value,
                description: document.getElementById('mTicketDesc').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection('auzent_issues').add(dataToSave);
                
                fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({...dataToSave, category: 'REPORT'})
                }).catch(()=>{});

                alert("Your support ticket has been sent successfully. Our team will look into it shortly.");
                maintenanceForm.reset();
            } catch(err) {
                alert("Error: Failed to send your ticket.");
            } finally {
                setProcessing(false);
            }
        });
    }
});

function fetchClientIP() {
    fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
            clientSecurityIP = data.ip;
            const ipField = document.getElementById('v_client_ip');
            if (ipField) ipField.value = data.ip; 
        })
        .catch(e => {
            clientSecurityIP = "Hidden";
            if(document.getElementById('v_client_ip')) document.getElementById('v_client_ip').value = "Hidden";
        });
}

function fillFormFields(data) {
    const fieldMap = {
        'v_client_name': 'v_client_name', 'v_client_phone': 'v_client_phone', 'v_client_address': 'v_client_address',
        'web_goal': 'q_web_goal', 'web_audience': 'q_web_audience', 'web_refs': 'q_web_refs',
        'web_theme': 'q_web_theme', 'web_hosting': 'q_web_hosting', 'web_features': 'q_web_features',
        'web_journey': 'q_web_journey', 'app_name': 'q_app_name', 'app_platform': 'q_app_platform',
        'app_audience': 'q_app_audience', 'app_purpose': 'q_app_purpose', 'app_refs': 'q_app_refs',
        'app_auth': 'q_app_auth', 'app_admin': 'q_app_admin', 'app_features': 'q_app_features',
        'app_hardware': 'q_app_hardware', 'app_monetization': 'q_app_monetization',
        'comp_mods': 'q_comp_mods', 'web_pages': 'q_web_pages', 'app_screens': 'q_app_screens',
        'ui_design': 'q_ui_design', 'api_reqs': 'q_api_reqs', 'content_status': 'q_content_status'
    };
    
    if(document.getElementById('v_client_name') && !document.getElementById('v_client_name').value) document.getElementById('v_client_name').value = data.name || '';
    if(document.getElementById('v_client_email')) document.getElementById('v_client_email').value = data.email || '';
    if(document.getElementById('v_client_phone') && !document.getElementById('v_client_phone').value) document.getElementById('v_client_phone').value = data.whatsapp || '';

    Object.keys(fieldMap).forEach(key => {
        const el = document.getElementById(fieldMap[key]);
        if (el && data[key] && !el.value) el.value = data[key];
    });
    
    const termsCheck = document.getElementById('q_agreeTerms');
    if(termsCheck && data.terms_agreed === true) termsCheck.checked = true;
}

function initLiveDashboard(docId) {
    fetchClientIP();

    workspaceUnsubscribe = db.collection('auzent_gateways').doc(docId).onSnapshot((doc) => {
        if (!doc.exists) return;
        const data = doc.data();
        const currentStatus = data.status || 'Work Started';

        document.getElementById('dash-workspace-id').textContent = data.portalId || docId;
        document.getElementById('dash-status').textContent = currentStatus;
        
        const testingPanel = document.getElementById('testing-phase-panel');
        const handoverPanel = document.getElementById('handover-phase-panel');
        const maintenancePanel = document.getElementById('maintenance-phase-panel');
        const engineeringPanel = document.getElementById('engineering-phase-panel');
        const liveFeedPanel = document.getElementById('live-engineering-feed');

        if(testingPanel) testingPanel.classList.add('hidden');
        if(handoverPanel) handoverPanel.classList.add('hidden');
        if(maintenancePanel) maintenancePanel.classList.add('hidden');
        if(engineeringPanel) engineeringPanel.classList.remove('hidden');
        if(liveFeedPanel) liveFeedPanel.classList.remove('hidden');

        if (currentStatus === 'Testing Phase') {
            if(testingPanel) testingPanel.classList.remove('hidden');
        } else if (currentStatus.includes('Live') || currentStatus.includes('Completed')) {
            if(handoverPanel) {
                handoverPanel.classList.remove('hidden');
                const finalAssetBtn = document.getElementById('finalAssetBtn');
                if (finalAssetBtn && data.asset_link) {
                    finalAssetBtn.href = data.asset_link;
                    finalAssetBtn.classList.remove('hidden');
                }
            }
            if(engineeringPanel) engineeringPanel.classList.add('hidden');
            if(liveFeedPanel) liveFeedPanel.classList.add('hidden');
        } else if (currentStatus === 'Under Maintenance') {
            if(maintenancePanel) maintenancePanel.classList.remove('hidden');
            if(engineeringPanel) engineeringPanel.classList.add('hidden');
            if(liveFeedPanel) liveFeedPanel.classList.add('hidden');
        }

        const projectType = data.projectType || 'website'; 
        document.getElementById('display-project-type').textContent = projectType === 'both' || projectType === 'ecosystem' ? 'Full Website & App' : (projectType + ' Project');
        toggleSections(projectType);
        fillFormFields(data);

        const totalPrice = parseFloat(data.total_price || 0);
        const alreadyPaid = parseFloat(data.paid_amount || 0);
        document.getElementById('totalPrice').textContent = `₹${totalPrice.toLocaleString('en-IN')}`;

        let paidPercentage = 0;
        if (totalPrice > 0) paidPercentage = Math.round((alreadyPaid / totalPrice) * 100);

        const progressBar = document.getElementById('paymentProgressBar');
        const statusText = document.getElementById('paymentStatusText');
        const nextUnlockText = document.getElementById('nextUnlockText');

        if (progressBar && statusText) {
            progressBar.style.width = `${paidPercentage}%`;
            statusText.textContent = `${paidPercentage}% Paid (₹${alreadyPaid.toLocaleString('en-IN')})`;

            if (nextUnlockText) {
                const targetPreview = totalPrice * 0.60;
                const targetFinal = totalPrice;
                if (alreadyPaid < targetPreview) {
                    nextUnlockText.innerHTML = `Pay <span class="text-blue-600 font-bold">₹${(targetPreview - alreadyPaid).toLocaleString('en-IN')}</span> to unlock <br>Live Preview`;
                } else if (alreadyPaid < targetFinal) {
                    nextUnlockText.innerHTML = `Pay <span class="text-blue-600 font-bold">₹${(targetFinal - alreadyPaid).toLocaleString('en-IN')}</span> to unlock <br>Final Source Code`;
                } else {
                    nextUnlockText.innerHTML = `<span class="text-emerald-600 font-bold uppercase tracking-widest">All Payments Completed</span>`;
                }
            }

            const paymentInputArea = document.getElementById('paymentInputArea');
            if (paymentInputArea) {
                if (paidPercentage >= 100 || totalPrice === 0) {
                    paymentInputArea.classList.add('hidden');
                    document.getElementById('paymentArea')?.classList.add('hidden');
                } else {
                    paymentInputArea.classList.remove('hidden');
                }
            }
            
            const setupPayClick = (id, percentage) => {
                const el = document.getElementById(id);
                if(el) {
                    el.onclick = () => {
                        const targetAmt = totalPrice * percentage;
                        const needed = targetAmt - alreadyPaid;
                        if(needed > 0 && paymentInputArea && !paymentInputArea.classList.contains('hidden')) {
                            document.getElementById('customPayAmount').value = Math.ceil(needed);
                            document.getElementById('customPayAmount').classList.add('ring-2', 'ring-emerald-500');
                            setTimeout(() => document.getElementById('customPayAmount').classList.remove('ring-2', 'ring-emerald-500'), 500);
                        } else if (needed <= 0) {
                            alert("Notice: This payment step is already completed.");
                        }
                    };
                }
            };
            setupPayClick('clickPay30', 0.3);
            setupPayClick('clickPay60', 0.6);
            setupPayClick('clickPay100', 1.0);
        }

        const assetVault = document.getElementById('assetVaultContainer');
        if (assetVault) {
            if (data.asset_link && data.asset_link.trim() !== '') {
                assetVault.classList.remove('hidden');
                document.getElementById('assetDriveLink').href = data.asset_link;
            } else {
                assetVault.classList.add('hidden');
            }
        }

        const previewBtn = document.getElementById('openSecurePreviewBtn');
        if (previewBtn) {
            if (paidPercentage >= 60 && data.is_preview_active === true && data.tunnel_url && data.tunnel_url.trim() !== '') {
                previewBtn.classList.remove('pointer-events-none', 'opacity-50', 'bg-blue-600');
                previewBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-700');
                previewBtn.textContent = "Open Live Preview";
                previewBtn.onclick = () => { window.open(`preview.html?id=${docId}`, '_blank', 'width=1200,height=800,menubar=no,toolbar=no'); };
            } else {
                previewBtn.classList.add('pointer-events-none', 'opacity-50', 'bg-blue-600');
                previewBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-700');
                previewBtn.textContent = paidPercentage < 60 ? "Payment Pending for Preview" : "Waiting for Link...";
                previewBtn.onclick = null;
            }
        }

        setupTimerLogic(data);
    });
}

function toggleSections(val) {
    const webSection = document.getElementById('webScopeSection');
    const appSection = document.getElementById('appScopeSection');
    const compSection = document.getElementById('compScopeSection');
    const sharedSection = document.getElementById('sharedScopeSection');
    const standardAssets = document.getElementById('standardAssetList');
    const componentAssets = document.getElementById('componentAssetList');
    const toolboxHeader = document.getElementById('toolboxHeader');
    const scopeTimerNotice = document.getElementById('scopeTimerNotice');
    
    const isWeb = (val === 'web' || val === 'website' || val === 'both' || val === 'ecosystem');
    const isApp = (val === 'app' || val === 'both' || val === 'ecosystem');
    const isComp = (val === 'component');
    const isProject = isWeb || isApp;

    if (sharedSection) sharedSection.classList.toggle('hidden', !isProject);
    if (webSection) webSection.classList.toggle('hidden', !isWeb);
    if (appSection) appSection.classList.toggle('hidden', !isApp);
    if (compSection) compSection.classList.toggle('hidden', val !== 'component');

    if (standardAssets) standardAssets.classList.toggle('hidden', isComp);
    if (componentAssets) componentAssets.classList.toggle('hidden', !isComp);

    if (toolboxHeader) toolboxHeader.textContent = isComp ? 'Project Files' : 'Secure File Upload';
    if (scopeTimerNotice) scopeTimerNotice.textContent = isComp ? '24 hours' : '48 hours';
}

function setupTimerLogic(data) {
    const formInputs = document.querySelectorAll('#blueprintForm input, #blueprintForm select, #blueprintForm textarea');
    const saveBtn = document.getElementById('saveScopeBtn');
    const timerDisplay = document.getElementById('countdownTimer');
    const timerLabel = document.getElementById('timerLabel');
    const timerBadge = document.getElementById('timerBadge');

    const draftKey = `auzent_draft_${currentWorkspaceId}`;

    if (data.admin_locked === true || data.timer_finished === true) {
        timerDisplay.textContent = "LOCKED";
        timerLabel.textContent = "PROJECT DETAILS:";
        timerBadge.classList.replace('border-slate-200', 'border-red-500');
        timerDisplay.classList.replace('text-blue-600', 'text-red-500');
        
        if(saveBtn) saveBtn.classList.add('hidden');
        const termsArea = document.getElementById('q_agreeTerms');
        if(termsArea) termsArea.parentElement.classList.add('hidden');

        const pdfBtn = document.getElementById('downloadLockedPdfBtn');
        if(pdfBtn) {
            pdfBtn.classList.remove('hidden');
            pdfBtn.textContent = "Download PDF";
            pdfBtn.onclick = () => { generateProfessionalPDF(data); }; 
        }

        disableForm(formInputs, null);
        if (countdownInterval) clearInterval(countdownInterval);
        
        localStorage.removeItem(draftKey);
        return;
    }

    if (data.timer_started_at) {
        timerLabel.textContent = "LOCKS IN:";
        timerBadge.classList.replace('border-slate-200', 'border-blue-600');

        const startTime = data.timer_started_at.toDate().getTime();
        const hours = data.projectType === 'component' ? 24 : 48;
        const endTime = startTime + (hours * 60 * 60 * 1000);

        if (!countdownInterval) {
            countdownInterval = setInterval(async () => {
                const now = new Date().getTime();
                const distance = endTime - now;

                if (distance <= 0) {
                    clearInterval(countdownInterval);
                    timerDisplay.textContent = "00:00:00";
                    if (currentWorkspaceId) {
                        await db.collection('auzent_gateways').doc(currentWorkspaceId).update({ timer_finished: true });
                        await fetch('/.netlify/functions/notifyAdmin', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ category: 'BLUEPRINT_SUBMITTED', portalId: data.portalId || currentWorkspaceId, email: data.email })
                        }).catch(e=>console.log(e));
                    }
                    window.location.reload(); 
                } else {
                    let h = Math.floor(distance / (1000 * 60 * 60));
                    let m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    let s = Math.floor((distance % (1000 * 60)) / 1000);
                    timerDisplay.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
            }, 1000);
        }
    } else {
        timerDisplay.textContent = "NOT STARTED";
        timerDisplay.classList.add('text-slate-500', 'text-xs');
        timerDisplay.classList.remove('text-xl', 'text-blue-600');
        enableForm(formInputs, saveBtn);
    }

    const draftStr = localStorage.getItem(draftKey);
    if (draftStr && !data.admin_locked && !data.timer_finished) {
        try {
            const draft = JSON.parse(draftStr);
            formInputs.forEach(el => {
                if (draft[el.id] && el.id !== 'v_client_ip' && el.type !== 'checkbox') {
                    el.value = draft[el.id];
                }
            });
        } catch (e) {
            console.warn("Error: Could not load saved draft.");
        }
    }

    formInputs.forEach(el => {
        el.oninput = () => {
            if (data.admin_locked || data.timer_finished) return;
            const currentDraft = {};
            formInputs.forEach(input => {
                if (input.id && input.type !== 'checkbox' && input.id !== 'v_client_ip') {
                    currentDraft[input.id] = input.value;
                }
            });
            localStorage.setItem(draftKey, JSON.stringify(currentDraft));
        };
    });

    if (saveBtn) {
        saveBtn.onclick = () => {
            const form = document.getElementById('blueprintForm');
            const visibleInputs = Array.from(form.querySelectorAll('input, select, textarea')).filter(el => el.offsetParent !== null);

            for (let el of visibleInputs) {
                if (el.hasAttribute('required') && !el.value.trim() && el.type !== 'checkbox') {
                    el.reportValidity();
                    return;
                }
            }

            const agreeTerms = document.getElementById('q_agreeTerms'); 
            if (!agreeTerms || !agreeTerms.checked) {
                alert("Please agree to the Terms of Service to save your details.");
                return; 
            }

            const previewBox = document.getElementById('previewContentArea');
            let previewHTML = ``;
            visibleInputs.forEach(input => {
                if (input.type !== 'checkbox' && input.value.trim() !== '' && !input.id.startsWith('v_client')) {
                    let questionText = "";
                    let answerText = "";
                    if(input.tagName === 'SELECT') {
                        questionText = input.options[0].text;
                        answerText = input.options[input.selectedIndex].text;
                    } else {
                        questionText = input.placeholder || input.id;
                        answerText = input.value;
                    }
                    previewHTML += `<div class="mb-5"><div class="text-blue-600 text-[10px] uppercase font-bold mb-1">■ ${questionText}</div><div class="text-[#0F172A] bg-white p-3 rounded-lg border border-slate-200 shadow-sm">${answerText}</div></div>`;
                }
            });
            previewBox.innerHTML = previewHTML;
            
            document.getElementById('formPreviewModal').classList.remove('hidden');
            document.getElementById('formPreviewModal').classList.add('flex');

            document.getElementById('printPreviewBtn').onclick = () => generateProfessionalPDF(data);

            document.getElementById('confirmSaveBtn').onclick = async () => {
                const btn = document.getElementById('confirmSaveBtn');
                setProcessing(true);
                btn.textContent = 'Saving Details...';

                let finalScopeData = { 
                    terms_agreed: true, 
                    last_updated: firebase.firestore.FieldValue.serverTimestamp(),
                    v_client_name: document.getElementById('v_client_name').value,
                    v_client_phone: document.getElementById('v_client_phone').value,
                    v_client_address: document.getElementById('v_client_address').value,
                    v_client_ip: document.getElementById('v_client_ip').value,
                    v_client_device: fetchedDevice
                };

                const pt = data.projectType;
                if (pt === 'web' || pt === 'website' || pt === 'both' || pt === 'ecosystem') {
                    finalScopeData.web_goal = document.getElementById('q_web_goal').value;
                    finalScopeData.web_audience = document.getElementById('q_web_audience').value;
                    finalScopeData.web_refs = document.getElementById('q_web_refs').value;
                    finalScopeData.web_theme = document.getElementById('q_web_theme').value;
                    finalScopeData.web_hosting = document.getElementById('q_web_hosting').value;
                    finalScopeData.web_features = document.getElementById('q_web_features').value;
                    finalScopeData.web_pages = document.getElementById('q_web_pages').value;
                    finalScopeData.web_journey = document.getElementById('q_web_journey').value;
                    finalScopeData.ui_design = document.getElementById('q_ui_design').value;
                    finalScopeData.api_reqs = document.getElementById('q_api_reqs').value;
                    finalScopeData.content_status = document.getElementById('q_content_status').value;
                }
                if (pt === 'app' || pt === 'both' || pt === 'ecosystem') {
                    finalScopeData.app_name = document.getElementById('q_app_name').value;
                    finalScopeData.app_platform = document.getElementById('q_app_platform').value;
                    finalScopeData.app_audience = document.getElementById('q_app_audience').value;
                    finalScopeData.app_screens = document.getElementById('q_app_screens').value;
                    finalScopeData.app_purpose = document.getElementById('q_app_purpose').value;
                    finalScopeData.app_refs = document.getElementById('q_app_refs').value;
                    finalScopeData.app_auth = document.getElementById('q_app_auth').value;
                    finalScopeData.app_admin = document.getElementById('q_app_admin').value;
                    finalScopeData.app_features = document.getElementById('q_app_features').value;
                    finalScopeData.app_hardware = document.getElementById('q_app_hardware').value;
                    finalScopeData.app_monetization = document.getElementById('q_app_monetization').value;
                    finalScopeData.ui_design = document.getElementById('q_ui_design').value;
                    finalScopeData.api_reqs = document.getElementById('q_api_reqs').value;
                    finalScopeData.content_status = document.getElementById('q_content_status').value;
                }
                if (pt === 'component') {
                    finalScopeData.comp_mods = document.getElementById('q_comp_mods').value;
                }

                try {
                    await db.collection('auzent_gateways').doc(currentWorkspaceId).update(finalScopeData);
                    localStorage.removeItem(draftKey);

                    document.getElementById('formPreviewModal').classList.add('hidden');
                    saveBtn.textContent = 'Project Details Locked';
                    btn.textContent = '🔒 Lock Details';
                    setTimeout(() => saveBtn.textContent = 'Save Draft', 3000);
                } catch (error) {
                    btn.textContent = 'Error Saving Details';
                } finally {
                    setProcessing(false);
                }
            };
        };
    }
}

function disableForm(inputs, btn) {
    inputs.forEach(el => { el.disabled = true; el.classList.add('opacity-60', 'cursor-not-allowed', 'bg-slate-100'); });
    if (btn) { btn.disabled = true; btn.classList.add('hidden'); }
}
function enableForm(inputs, btn) {
    inputs.forEach(el => { el.disabled = false; el.classList.remove('opacity-60', 'cursor-not-allowed', 'bg-slate-100'); });
    if (btn) { btn.disabled = false; btn.classList.remove('hidden'); }
}

const generateUPIBtn = document.getElementById('generateUPIBtn');
const MY_UPI_ID = "theauzent@upi"; 
const RECEIVER_NAME = "The Auzent";

if (generateUPIBtn) {
    generateUPIBtn.addEventListener('click', async () => {
        if (!currentWorkspaceId) return;

        const customAmountInput = document.getElementById('customPayAmount');
        const amountToPay = parseFloat(customAmountInput.value);
        const senderNameInput = document.getElementById('paymentSenderName');
        const senderName = senderNameInput ? senderNameInput.value.trim() : "";

        if (senderNameInput && !senderName) { alert("Please enter the Sender's Bank Account Name."); return; }
        if (!amountToPay || amountToPay <= 0) { alert("Please enter a valid amount to pay."); return; }

        const doc = await db.collection('auzent_gateways').doc(currentWorkspaceId).get();
        const data = doc.data();

        const totalAgreedPrice = parseFloat(data.total_price || 0);
        const alreadyPaid = parseFloat(data.paid_amount || 0);
        const remainingBalance = totalAgreedPrice - alreadyPaid;

        if (amountToPay > remainingBalance) {
            alert(`Error: Maximum pending amount is ₹${remainingBalance.toLocaleString('en-IN')}.`);
            return;
        }

        const paymentArea = document.getElementById('paymentArea');
        const dynamicAmount = document.getElementById('dynamicAmount');

        paymentArea.classList.remove('hidden');
        document.getElementById('qrCodePlaceholder').classList.remove('hidden');
        document.getElementById('upiDeepLink').classList.remove('hidden');

        dynamicAmount.textContent = `₹${amountToPay.toLocaleString('en-IN')}`;
        const upiString = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(RECEIVER_NAME)}&am=${amountToPay}&cu=INR`;

        document.getElementById('upiDeepLink').href = upiString;
        document.getElementById('upiDeepLink').textContent = "Pay Using UPI App";

        document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}&color=000000&bgcolor=ffffff`;
        document.getElementById('qrImage').classList.remove('hidden');

        const MY_WHATSAPP = "919028882522";
        const whatsappProofBtn = document.getElementById('whatsappProofBtn');
        if (whatsappProofBtn) {
            const waMsg = `Hi Auzent,\n\nWorkspace ID: *${data.portalId || currentWorkspaceId}*\nI have completed a payment of ₹${amountToPay.toLocaleString('en-IN')} from the account name *${senderName}*.\n\nPayment proof is attached below:`;
            whatsappProofBtn.textContent = "Confirm Payment on WhatsApp ➔";
            whatsappProofBtn.href = `https://wa.me/${MY_WHATSAPP}?text=${encodeURIComponent(waMsg)}`;
        }
    });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (workspaceUnsubscribe) workspaceUnsubscribe();
        currentWorkspaceId = null;
        window.location.reload();
    });
}

function generateProfessionalPDF(data) {
    const printWindow = window.open('', '_blank');
    const projectType = data.projectType || 'Software';
    const workspaceId = data.portalId || 'AZ-XXXX';
    
    const clientName = document.getElementById('v_client_name') ? document.getElementById('v_client_name').value : (data.name || 'Client');
    const clientEmail = data.email || 'N/A';
    
    const visibleInputs = Array.from(document.querySelectorAll('#blueprintForm input, #blueprintForm select, #blueprintForm textarea'))
        .filter(el => el.offsetParent !== null && el.type !== 'checkbox' && !el.id.startsWith('v_client'));

    let pdfContent = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="assets/icon.svg" alt="Auzent Logo" style="width: 50px; height: 50px; margin-bottom: 10px;" />
            <h1>YOUR PROJECT DETAILS</h1>
            <div class="meta">WORKSPACE ID: <strong>${workspaceId}</strong> | DATE ISSUED: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            <div style="font-size: 10px; color: #64748B; margin-top: 5px; font-weight: 700;">Email: theauzent@gmail.com | Website: https://theauzent.netlify.app</div>
        </div>
        
        <div class="identity-box">
            <strong>CLIENT DETAILS</strong><br>
            Name: ${clientName} &nbsp;|&nbsp; Email: ${clientEmail}
        </div>

        <div class="type-box">PROJECT TYPE: <span>${projectType.toUpperCase()} DEVELOPMENT</span></div>
    `;
    
    visibleInputs.forEach(input => {
        if (input.value.trim() !== '') {
            let questionText = "";
            let answerText = "";
            if(input.tagName === 'SELECT') {
                questionText = input.options[0].text;
                answerText = input.options[input.selectedIndex].text;
            } else {
                questionText = input.placeholder || input.id;
                answerText = input.value;
            }
            pdfContent += `<div class="qa-block"><div class="q">${questionText}</div><div class="a">${answerText}</div></div>`;
        }
    });

    pdfContent += `
        <div style="margin-top: 60px; text-align: center; border-top: 2px dashed #E2E8F0; padding-top: 20px; page-break-inside: avoid;">
            <p style="font-size: 12px; font-weight: 800; color: #0F172A; margin: 0;">This is a computer-generated document and does not require a physical signature.</p>
            <p style="font-size: 10px; color: #64748B; margin-top: 5px;">Your agreement is safely recorded in our system.</p>
        </div>
    `;

    printWindow.document.write(`
        <html>
        <head>
            <title>Project_Details_${workspaceId}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=JetBrains+Mono:wght@500&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px 60px; color: #0F172A; line-height: 1.6; background: #ffffff; }
                h1 { color: #0F172A; font-size: 22px; font-weight: 800; text-transform: uppercase; margin: 0 0 5px 0; letter-spacing: 1px; }
                .meta { font-size: 10px; color: #64748B; font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
                
                .identity-box { border: 1px dashed #94A3B8; padding: 15px; margin-bottom: 30px; font-size: 12px; color: #0F172A; border-radius: 6px; background: #F8FAFC; text-align: center; }
                .type-box { border: 1px solid #2563EB; padding: 15px; margin-bottom: 30px; text-align: center; background: #EFF6FF; color: #2563EB; border-radius: 8px; }
                .type-box span { font-size: 16px; display: block; margin-top: 5px; font-weight: 800; color: #0F172A; }
                
                .qa-block { margin-bottom: 20px; page-break-inside: avoid; }
                .q { font-size: 10px; color: #2563EB; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px; }
                .a { font-size: 13px; color: #334155; font-weight: 500; background: #F8FAFC; padding: 12px 16px; border-radius: 6px; border: 1px solid #E2E8F0; }
                
                .footer { margin-top: 50px; text-align: center; padding-top: 20px; page-break-inside: avoid; }
                .links a { color: #64748B; text-decoration: none; margin: 0 10px; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            </style>
        </head>
        <body>
            ${pdfContent}
            <div class="footer">
                <div class="links">
                    <a href="https://theauzent.netlify.app">WEBSITE</a>
                    <a href="https://youtube.com/@theauzent">YOUTUBE</a>
                    <a href="https://instagram.com/theauzent">INSTAGRAM</a>
                    <a href="https://t.me/theauzent">TELEGRAM</a>
                    <a href="https://github.com/theauzent">GITHUB</a>
                </div>
                <p style="font-size: 9px; margin-top: 10px; color: #94A3B8;">&copy; ${new Date().getFullYear()} The Auzent. Confidential Project Details.</p>
            </div>
        </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 800);
}