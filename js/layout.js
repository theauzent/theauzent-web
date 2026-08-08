// js/layout.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. DYNAMIC HEADER INJECTION
    const headerEl = document.getElementById('auzent-header');
    if (headerEl) {
        headerEl.innerHTML = `
        <header class="fixed w-full top-0 z-[100] transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm" id="main-header">
            <div class="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between max-w-7xl">
                <a href="index.html" class="flex items-center gap-3 z-50">
                    <img src="assets/icon.svg" alt="The Auzent Logo" class="w-10 h-10 hover:scale-105 transition-transform" />
                    <span class="font-montserrat font-extrabold text-xl tracking-tight text-[#0F172A]">THE AUZENT</span>
                </a>
                
                <nav class="hidden md:flex items-center gap-8">
                    <a href="index.html#services" class="text-sm font-bold text-slate-600 hover:text-blue-600 transition uppercase tracking-widest">Services</a>
                    <a href="index.html#work" class="text-sm font-bold text-slate-600 hover:text-blue-600 transition uppercase tracking-widest">Work</a>
                    <a href="testing.html" class="text-sm font-bold text-slate-600 hover:text-blue-600 transition uppercase tracking-widest">QA Testing</a>
                    <a href="about.html" class="text-sm font-bold text-slate-600 hover:text-blue-600 transition uppercase tracking-widest">About</a>
                    <a href="gateway.html" class="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20 uppercase tracking-widest flex items-center gap-2">
                        <span>🔒</span> Client Portal
                    </a>
                </nav>

                <button id="mobile-menu-btn" class="md:hidden z-50 text-2xl text-slate-800 focus:outline-none cursor-pointer">
                    ☰
                </button>
            </div>
            
            <div id="mobile-menu" class="fixed inset-0 bg-white z-40 transform translate-x-full transition-transform duration-300 flex flex-col pt-24 px-6 pb-8 h-screen overflow-y-auto">
                <nav class="flex flex-col gap-6 text-center mt-10">
                    <a href="index.html#services" class="mobile-link text-xl font-bold text-slate-800 uppercase tracking-widest">Services</a>
                    <a href="index.html#work" class="mobile-link text-xl font-bold text-slate-800 uppercase tracking-widest">Work</a>
                    <a href="testing.html" class="mobile-link text-xl font-bold text-slate-800 uppercase tracking-widest">QA Testing</a>
                    <a href="about.html" class="mobile-link text-xl font-bold text-slate-800 uppercase tracking-widest">About</a>
                    <a href="gateway.html" class="mobile-link mt-4 px-6 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg uppercase tracking-widest flex justify-center items-center gap-2">
                        <span>🔒</span> Secure Portal
                    </a>
                </nav>
            </div>
        </header>`;

        // Mobile Menu Logic
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');
        let isMenuOpen = false;

        if (menuBtn && mobileMenu) {
            menuBtn.addEventListener('click', () => {
                isMenuOpen = !isMenuOpen;
                if (isMenuOpen) {
                    mobileMenu.classList.remove('translate-x-full');
                    menuBtn.textContent = '✕';
                    document.body.style.overflow = 'hidden';
                } else {
                    mobileMenu.classList.add('translate-x-full');
                    menuBtn.textContent = '☰';
                    document.body.style.overflow = '';
                }
            });

            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    isMenuOpen = false;
                    mobileMenu.classList.add('translate-x-full');
                    menuBtn.textContent = '☰';
                    document.body.style.overflow = '';
                });
            });
        }
    }

    // 2. DYNAMIC FOOTER INJECTION (WITH TELEGRAM ADDED)
    const footerEl = document.getElementById('auzent-footer');
    if (footerEl) {
        footerEl.innerHTML = `
        <footer class="bg-[#0F172A] border-t border-slate-800 pt-16 pb-8 relative z-10">
            <div class="container mx-auto px-4 sm:px-6 max-w-7xl">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
                    <div class="col-span-1 md:col-span-2 pr-0 md:pr-10">
                        <div class="flex items-center gap-3 mb-4">
                            <img src="assets/icon.svg" alt="Auzent Mark" class="w-8 h-8 opacity-80" />
                            <span class="font-montserrat font-extrabold text-lg text-white tracking-tight">THE AUZENT</span>
                        </div>
                        <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
                            Engineered for high-performance and scale. We build custom web solutions and fast Android applications to help your business grow.
                        </p>
                        <div class="flex gap-4">
                            <button onclick="openGlobalModal('contactModal')" class="px-5 py-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition text-xs font-bold uppercase tracking-widest cursor-pointer">Direct Message</button>
                            <button onclick="openGlobalModal('reportModal')" class="px-5 py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition text-xs font-bold uppercase tracking-widest cursor-pointer">Report Issue</button>
                        </div>
                    </div>
                    <div>
                        <h4 class="text-white font-bold mb-4 uppercase tracking-widest text-xs">Quick Links</h4>
                        <ul class="space-y-3 text-sm text-slate-400 font-mono">
                            <li><a href="index.html#services" class="hover:text-blue-400 transition">Our Services</a></li>
                            <li><a href="testing.html" class="hover:text-blue-400 transition">App Testing</a></li>
                            <li><a href="index.html#work" class="hover:text-blue-400 transition">Our Work</a></li>
                            <li><a href="gateway.html" class="hover:text-blue-400 transition text-emerald-400">Client Portal</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-white font-bold mb-4 uppercase tracking-widest text-xs">Company</h4>
                        <ul class="space-y-3 text-sm text-slate-400 font-mono">
                            <li><a href="about.html" class="hover:text-blue-400 transition">About Us</a></li>
                            <li><a href="privacy.html" class="hover:text-blue-400 transition">Privacy Policy</a></li>
                            <li><a href="terms.html" class="hover:text-blue-400 transition">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div class="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500">
                    <p>© ${new Date().getFullYear()} The Auzent. Built by <a href="https://www.linkedin.com/in/ashutoshkaushal1412" target="_blank" rel="noopener noreferrer" class="text-slate-400 hover:text-white underline">Ashutosh Kaushal</a>.</p>
                    <div class="flex flex-wrap gap-6">
                        <a href="https://github.com/theauzent" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">GITHUB</a>
                        <a href="https://youtube.com/@theauzent" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">YOUTUBE</a>
                        <a href="https://facebook.com/theauzent" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">FACEBOOK</a>
                        <a href="https://instagram.com/theauzent" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">INSTAGRAM</a>
                        <a href="https://t.me/theauzent" target="_blank" rel="noopener noreferrer" class="hover:text-white transition">TELEGRAM</a>
                    </div>
                </div>
            </div>
        </footer>`;
    }

    // 3. GLOBAL MODALS INJECTION & LOGIC
    if (!document.getElementById('contactModal')) {
        const modalsContainer = document.createElement('div');
        modalsContainer.innerHTML = `
        <div id="contactModal" class="fixed inset-0 z-[150] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="glass-card w-full max-w-md p-8 relative border-t-4 border-t-blue-600 bg-white shadow-2xl rounded-3xl">
            <button onclick="closeGlobalModal('contactModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-3xl font-bold cursor-pointer z-50">×</button>
            <h3 class="text-2xl font-montserrat font-bold text-[#0F172A] mb-2">Send a Message</h3>
            <p class="text-xs text-[#475569] mb-6">Send a secure message directly to our support team.</p>
            <form id="globalContactForm" class="space-y-4">
              <input type="text" id="gContactName" placeholder="Your Full Name *" required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-blue-600 outline-none transition" />
              <input type="email" id="gContactEmail" placeholder="Your Email Address *" required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-blue-600 outline-none transition" />
              <div class="flex gap-3">
                <select id="gContactPlatform" class="w-1/3 bg-slate-50 border border-slate-300 rounded-xl px-2 py-3 text-xs text-[#0F172A] focus:border-blue-600 outline-none cursor-pointer">
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Email">Email</option>
                </select>
                <input type="text" id="gContactId" placeholder="Number / Username *" required class="w-2/3 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-blue-600 outline-none transition" />
              </div>
              <textarea id="gContactMessage" rows="4" placeholder="How can we help you today? *" required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-blue-600 outline-none transition resize-none"></textarea>
              <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 mt-2 rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-widest text-xs">Send Message</button>
            </form>
          </div>
        </div>

        <div id="reportModal" class="fixed inset-0 z-[150] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="glass-card w-full max-w-md p-8 relative border-t-4 border-t-red-500 bg-white shadow-2xl rounded-3xl">
            <button onclick="closeGlobalModal('reportModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-3xl font-bold cursor-pointer z-50">×</button>
            <h3 class="text-2xl font-montserrat font-bold text-[#0F172A] mb-2">Report an Issue</h3>
            <p class="text-xs text-[#475569] mb-6">Found a bug or need help logging in? Let us know.</p>
            <form id="globalReportForm" class="space-y-4">
              <input type="email" id="gRepEmail" placeholder="Your Registered Email *" required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-red-500 outline-none transition" />
              <select id="gRepType" required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-red-500 outline-none transition cursor-pointer">
                <option value="" disabled selected>Select Issue Type *</option>
                <option value="Bug">Website Bug / Glitch</option>
                <option value="Payment">Payment Issue</option>
                <option value="Access">Portal Access Help</option>
                <option value="Other">Other Questions</option>
              </select>
              <textarea id="gRepDesc" rows="4" placeholder="Describe the problem in detail..." required class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:border-red-500 outline-none transition resize-none"></textarea>
              <button type="submit" class="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 font-bold py-3 mt-2 rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-widest text-xs">Submit Issue</button>
            </form>
          </div>
        </div>
        `;
        document.body.appendChild(modalsContainer);
    }

    window.openGlobalModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };

    window.closeGlobalModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    const contactForm = document.getElementById('globalContactForm');
    const reportForm = document.getElementById('globalReportForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const origText = btn.textContent;
            btn.textContent = 'Sending...';
            btn.disabled = true;

            const data = {
                name: document.getElementById('gContactName').value,
                email: document.getElementById('gContactEmail').value,
                platform: document.getElementById('gContactPlatform').value,
                platform_id: document.getElementById('gContactId').value,
                message: document.getElementById('gContactMessage').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('auzent_support').add(data);
                
                fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({...data, category: 'CONTACT'})
                }).catch(()=>{});

                btn.textContent = 'Message Sent!';
                btn.classList.replace('bg-blue-600', 'bg-emerald-500');
                contactForm.reset();
                setTimeout(() => {
                    closeGlobalModal('contactModal');
                    btn.textContent = origText;
                    btn.classList.replace('bg-emerald-500', 'bg-blue-600');
                    btn.disabled = false;
                }, 2000);
            } catch (err) {
                alert("Error sending message. Please try again.");
                btn.textContent = origText;
                btn.disabled = false;
            }
        });
    }

    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = reportForm.querySelector('button');
            const origText = btn.textContent;
            btn.textContent = 'Submitting...';
            btn.disabled = true;

            const data = {
                email: document.getElementById('gRepEmail').value,
                type: document.getElementById('gRepType').value,
                description: document.getElementById('gRepDesc').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('auzent_issues').add(data);
                
                fetch('/.netlify/functions/notifyAdmin', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({...data, category: 'REPORT'})
                }).catch(()=>{});

                btn.textContent = 'Issue Reported!';
                btn.classList.replace('text-red-600', 'text-emerald-600');
                btn.classList.replace('bg-red-50', 'bg-emerald-50');
                reportForm.reset();
                setTimeout(() => {
                    closeGlobalModal('reportModal');
                    btn.textContent = origText;
                    btn.classList.replace('text-emerald-600', 'text-red-600');
                    btn.classList.replace('bg-emerald-50', 'bg-red-50');
                    btn.disabled = false;
                }, 2000);
            } catch (err) {
                alert("Error submitting report. Please try again.");
                btn.textContent = origText;
                btn.disabled = false;
            }
        });
    }

    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 20) {
                header.classList.add('shadow-md', 'py-1');
            } else {
                header.classList.remove('shadow-md', 'py-1');
            }
        }
    });
});