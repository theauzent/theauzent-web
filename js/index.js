// js/index.js

/* ==========================================
   0. Global Processing Loader Logic
========================================== */
function toggleProcessing(show) {
    const loader = document.getElementById('processing-loader');
    if (loader) {
        if (show) { loader.classList.add('active'); } 
        else { loader.classList.remove('active'); }
    }
}

// Securely fetch client IP metadata
let userClientIP = "Metadata_Secured";
fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => userClientIP = data.ip)
    .catch(() => {});

/* ==========================================
   1. Dynamic Typewriter Effect
========================================== */
const words = [
    "Custom App & Web Solutions.", 
    "Fast & Secure Websites.", 
    "Private Client Portals.", 
    "Reliable Cloud Hosting.", 
    "Native Android Applications.",
    "Modern Web Development."
];

let i = 0; let j = 0; let currentWord = ""; let isDeleting = false;
const typewriterElement = document.getElementById('typewriter');

function type() {
    if (!typewriterElement) return; 
    
    currentWord = words[i];
    if (isDeleting) {
        typewriterElement.textContent = currentWord.substring(0, j - 1);
        j--;
    } else {
        typewriterElement.textContent = currentWord.substring(0, j + 1);
        j++;
    }

    if (!isDeleting && j === currentWord.length) {
        isDeleting = true;
        setTimeout(type, 2000); 
    } else if (isDeleting && j === 0) {
        isDeleting = false;
        i = (i + 1) % words.length;
        setTimeout(type, 500); 
    } else {
        setTimeout(type, isDeleting ? 40 : 80);
    }
}
type(); 

/* ==========================================
   2. Scroll Reveal Intersection Observer
========================================== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

/* ==========================================
   3. Modal Management & Links
========================================== */
window.openCriteriaModal = function() {
    // Redirect to terms page directly instead of opening a broken modal
    window.location.href = 'terms.html';
};

window.closeCriteriaModal = function() {
    // Maintained for compatibility if called anywhere else
    console.log("Criteria modal is now redirected to a dedicated page.");
};

/* ==========================================
   4. Firebase Integration & Content Injection
========================================== */
const gridNormal = document.getElementById('grid-normal');

window.scrollToForm = function(projectName, category) {
    const refInput = document.getElementById('leadReference');
    const typeSelect = document.getElementById('leadProjectType');
    const formSection = document.getElementById('intake-form');

    if (refInput && formSection) {
        if(category === 'component') {
            refInput.value = `Customize Tool: ${projectName}`;
            if(typeSelect) {
                typeSelect.value = "component"; 
                typeSelect.dispatchEvent(new Event('change'));
            }
        } else if (category === 'testing') {
            refInput.value = `Service Request: ${projectName}`;
            if(typeSelect) {
                typeSelect.value = "testing"; 
                typeSelect.dispatchEvent(new Event('change'));
            }
        } else {
            refInput.value = `Project Reference: ${projectName}`;
            if(typeSelect) {
                const lowerName = projectName.toLowerCase();
                if(lowerName.includes('app') || lowerName.includes('android') || lowerName.includes('ios')) {
                    typeSelect.value = "app";
                } else {
                    typeSelect.value = "website";
                }
                typeSelect.dispatchEvent(new Event('change'));
            }
        }
        setTimeout(() => { formSection.scrollIntoView({ behavior: 'smooth' }); }, 100);
    }
};

function createCard(project, category) {
    const rawTitle = project.title || 'Untitled Tool';
    const safeTitle = rawTitle.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const safeRepo = project.repo_link ? project.repo_link.replace(/'/g, "\\'") : '';
    const safeLive = project.live_link ? project.live_link.replace(/'/g, "\\'") : '';
    
    let platformTag = "UTILITY TOOL";
    if (project.projectType) platformTag = project.projectType.toUpperCase();
    else if (project.tech_stack && project.tech_stack.toLowerCase().includes('android')) platformTag = "ANDROID APP";

    const tagBadge = `<span class="inline-block bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded mb-2 border border-blue-200">${platformTag}</span>`;

    // Dynamically creating buttons based on availability of links
    let actionButtons = '<div class="flex flex-col gap-2 relative z-30 pointer-events-auto">';
    
    if (safeLive && safeLive !== '#' && safeLive !== '') {
        actionButtons += `<a href="${safeLive}" target="_blank" rel="noopener noreferrer" class="w-full px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all text-center">Live Preview</a>`;
    }
    
    if (safeRepo && safeRepo !== '#' && safeRepo !== '') {
        actionButtons += `<a href="${safeRepo}" target="_blank" rel="noopener noreferrer" class="w-full px-4 py-2 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-800 hover:text-white transition-all text-center">Get Source Code</a>`;
    }
    
    // Customization option always available
    actionButtons += `
        <button onclick="window.scrollToForm('${safeTitle}', 'component')" class="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all cursor-pointer">
            Need Customization?
        </button>
    </div>`;

    let idTag = `<div class="absolute top-4 left-4 z-[60] bg-white/95 backdrop-blur-md border border-slate-200 px-2.5 py-1 rounded-md text-xs font-bold text-blue-600 shadow-sm">${project.id || 'TOOL-00'}</div>`;
    
    let imageContent = project.image_url ? `<img src="${project.image_url}" alt="${rawTitle}" loading="lazy" class="w-full h-full object-cover relative z-10">` : 
      `<div class="absolute inset-0 bg-slate-100 flex items-center justify-center"><span class="text-[10px] font-mono text-slate-400 font-bold tracking-widest uppercase">Tool Module</span></div>`;

    return `
        <div class="glass-card p-6 flex flex-col justify-between h-full relative overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
            ${idTag}
            <div class="relative z-20 pointer-events-none">
                <div class="w-full h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden relative">${imageContent}</div>
                ${tagBadge}
                <h3 class="text-xl font-montserrat font-bold text-slate-900 mb-2">${rawTitle}</h3>
                <p class="text-sm text-blue-600 mb-4 font-mono tracking-wide">${project.tech_stack || 'Modern Tech Stack'}</p>
            </div>
            <div class="mt-2">${actionButtons}</div>
        </div>
    `;
}

if (typeof db !== 'undefined') {
    function sortAscending(a, b) {
        let t1 = a.timestamp && typeof a.timestamp.toMillis === 'function' ? a.timestamp.toMillis() : 0;
        let t2 = b.timestamp && typeof b.timestamp.toMillis === 'function' ? b.timestamp.toMillis() : 0;
        return t1 - t2; 
    }

    db.collection('auzent_utilities').onSnapshot((snap) => {
        let p = []; snap.forEach(d => p.push({ id: d.id, ...d.data() })); p.sort(sortAscending); 
        if(gridNormal) { gridNormal.innerHTML = p.map((x) => createCard(x, 'component')).join(''); }
    });
}

// Utility Live Search Filtering
const componentSearch = document.getElementById('component-search');
if (componentSearch) {
    componentSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('#grid-normal > div'); 
        cards.forEach(card => {
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
            const techStack = card.querySelector('p.font-mono') ? card.querySelector('p.font-mono').textContent.toLowerCase() : '';
            card.style.display = title.includes(searchTerm) || techStack.includes(searchTerm) ? 'flex' : 'none';
        });
    });
}

/* ==========================================
   5. Lead Intake & Support Form Routing
========================================== */
const leadForm = document.getElementById('leadForm');
const projectTypeSelect = document.getElementById('leadProjectType');
const budgetSelect = document.getElementById('leadBudget');
const timelineSelect = document.getElementById('leadTimeline');
const customBudgetInput = document.getElementById('leadCustomBudget');

const budgetTiers = {
    website: [ { value: "5000-10000", label: "₹5,000 - ₹10,000" }, { value: "10000-20000", label: "₹10,000 - ₹20,000" }, { value: "20000+", label: "₹20,000+" } ],
    app: [ { value: "8000-15000", label: "₹8,000 - ₹15,000" }, { value: "15000-25000", label: "₹15,000 - ₹25,000" }, { value: "25000+", label: "₹25,000+" } ],
    ecosystem: [ { value: "15000-25000", label: "₹15,000 - ₹25,000" }, { value: "25000-40000", label: "₹25,000 - ₹40,000" }, { value: "40000+", label: "₹40,000+" } ],
    testing: [ { value: "2000-5000", label: "₹2,000 - ₹5,000 (Basic Test)" }, { value: "5000-10000", label: "₹5,000 - ₹10,000 (Full Audit)" } ],
    component: [ { value: "500-1500", label: "₹500 - ₹1,500" }, { value: "1500-3000", label: "₹1,500 - ₹3,000" } ]
};
const timelineTiers = {
    website: [ { value: "1-2 Weeks", label: "1 - 2 Weeks" }, { value: "2-4 Weeks", label: "2 - 4 Weeks" }, { value: "Flexible", label: "Flexible Schedule" } ],
    app: [ { value: "3-4 Weeks", label: "3 - 4 Weeks" }, { value: "1-2 Months", label: "1 - 2 Months" }, { value: "Flexible", label: "Flexible Schedule" } ],
    ecosystem: [ { value: "1-2 Months", label: "1 - 2 Months" }, { value: "2-3 Months", label: "2 - 3 Months" }, { value: "Flexible", label: "Flexible Schedule" } ],
    testing: [ { value: "2-4 Days", label: "2 - 4 Days" }, { value: "1 Week", label: "1 Week" } ],
    component: [ { value: "1-3 Days", label: "1 - 3 Days" }, { value: "Flexible", label: "Flexible Schedule" } ]
};

if (projectTypeSelect && budgetSelect && timelineSelect && customBudgetInput) {
    projectTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        budgetSelect.innerHTML = '<option value="" disabled selected>Select Estimated Budget Tier *</option>';
        if (budgetTiers[type]) budgetTiers[type].forEach(opt => budgetSelect.innerHTML += `<option value="${opt.value}">${opt.label}</option>`);
        budgetSelect.innerHTML += '<option value="custom">Define Custom Budget</option>';
        
        timelineSelect.innerHTML = '<option value="" disabled selected>Select Target Timeline *</option>';
        if (timelineTiers[type]) timelineTiers[type].forEach(opt => timelineSelect.innerHTML += `<option value="${opt.value}">${opt.label}</option>`);

        document.getElementById('leadCustomBudgetBox')?.classList.add('hidden');
    });
}

if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        // Security: Honeypot configuration
        const trap = document.getElementById('b_trap_main');
        if (trap && trap.value) return; 

        // Security: Cooldown execution
        const lastSub = localStorage.getItem('auzent_last_main');
        if (lastSub) {
            const timePassed = Date.now() - parseInt(lastSub);
            if (timePassed < 60000) { 
                const timeLeft = Math.ceil((60000 - timePassed) / 1000);
                alert(`Please wait ${timeLeft} seconds before submitting another request.`);
                return;
            }
        }

        const submitBtn = leadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;

        toggleProcessing(true);

        let finalBudget = document.getElementById('leadBudget').value;
        if(finalBudget === 'custom') finalBudget = "₹" + document.getElementById('leadCustomBudget').value;

        const leadData = {
            reference: document.getElementById('leadReference').value || 'Not provided',
            projectType: document.getElementById('leadProjectType').value, 
            features: document.getElementById('leadFeatures').value,
            name: document.getElementById('leadName').value,
            email: document.getElementById('leadEmail').value,
            whatsapp: document.getElementById('leadWhatsapp').value,
            budget: finalBudget,
            timeline: document.getElementById('leadTimeline').value,
            status: 'pending_review', 
            client_ip: userClientIP,
            client_device: navigator.userAgent,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('auzent_leads').add(leadData);
            localStorage.setItem('auzent_last_main', Date.now().toString());

            toggleProcessing(false);
            submitBtn.textContent = 'Project Details Saved!';
            submitBtn.classList.replace('bg-blue-600', 'bg-emerald-500');
            leadForm.reset();
            
            fetch('/.netlify/functions/notifyAdmin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...leadData, category: 'LEAD' })
            }).catch(()=>{});

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.classList.replace('bg-emerald-500', 'bg-blue-600');
                submitBtn.disabled = false;
            }, 3000);
        } catch (error) {
            toggleProcessing(false);
            submitBtn.textContent = 'Connection Error. Please try again.';
            submitBtn.disabled = false;
        }
    });
}

// Global Support Handlers
const contactForm = document.getElementById('globalContactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const lastContact = localStorage.getItem('auzent_last_contact');
        if (lastContact) {
            const timePassed = Date.now() - parseInt(lastContact);
            if (timePassed < 60000) {
                const timeLeft = Math.ceil((60000 - timePassed) / 1000);
                alert(`Please wait ${timeLeft} seconds before sending another message.`);
                return;
            }
        }

        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "Sending...";
        btn.disabled = true;

        const data = {
            name: document.getElementById('gContactName').value,
            email: document.getElementById('gContactEmail').value,
            platform: document.getElementById('gContactPlatform').value,
            platform_id: document.getElementById('gContactId').value,
            message: document.getElementById('gContactMessage').value,
            status: 'unread',
            client_ip: userClientIP,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('auzent_support').add(data);
            localStorage.setItem('auzent_last_contact', Date.now().toString()); 
            
            fetch('/.netlify/functions/notifyAdmin', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, category: 'CONTACT' })
            }).catch(()=>{});

            btn.textContent = "Message Sent!";
            btn.classList.replace('bg-blue-600', 'bg-emerald-500');
            
            setTimeout(() => {
                contactForm.reset();
                closeGlobalModal('contactModal');
                btn.textContent = originalText;
                btn.classList.replace('bg-emerald-500', 'bg-blue-600');
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            btn.textContent = "Sending Failed. Try again.";
            btn.disabled = false;
        }
    });
}

const reportForm = document.getElementById('globalReportForm');
if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const lastReport = localStorage.getItem('auzent_last_report');
        if (lastReport) {
            const timePassed = Date.now() - parseInt(lastReport);
            if (timePassed < 60000) {
                const timeLeft = Math.ceil((60000 - timePassed) / 1000);
                alert(`Please wait ${timeLeft} seconds before reporting another issue.`);
                return;
            }
        }

        const btn = reportForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = "Submitting Issue...";
        btn.disabled = true;

        const data = {
            email: document.getElementById('gRepEmail').value,
            type: document.getElementById('gRepType').value,
            description: document.getElementById('gRepDesc').value,
            status: 'unresolved',
            client_ip: userClientIP,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('auzent_issues').add(data);
            localStorage.setItem('auzent_last_report', Date.now().toString()); 

            fetch('/.netlify/functions/notifyAdmin', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, category: 'REPORT' })
            }).catch(()=>{});

            btn.textContent = "Issue Reported Successfully";
            btn.classList.replace('bg-red-50', 'bg-emerald-500');
            btn.classList.replace('text-red-600', 'text-white');
            
            setTimeout(() => {
                reportForm.reset();
                closeGlobalModal('reportModal');
                btn.textContent = originalText;
                btn.classList.replace('bg-emerald-500', 'bg-red-50');
                btn.classList.replace('text-white', 'text-red-600');
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            btn.textContent = "Error Submitting";
            btn.disabled = false;
        }
    });
}

/* ==========================================
   6. Viewport Text Sizing Constraints
========================================== */
function setupShrinkToFit() {
    const box = document.getElementById('typewriter-box');
    const wrapper = document.getElementById('shrink-wrapper');
    const typewriterSpan = document.getElementById('typewriter');
    if (!box || !wrapper || !typewriterSpan) return;

    const adjustSize = () => {
        wrapper.style.transform = 'scale(1)';
        const scaleRatio = box.clientWidth / wrapper.scrollWidth;
        if (scaleRatio < 1) wrapper.style.transform = `scale(${scaleRatio * 0.98})`; 
    };

    new MutationObserver(adjustSize).observe(typewriterSpan, { childList: true, characterData: true, subtree: true });
    window.addEventListener('resize', adjustSize);
}
setupShrinkToFit();