import { lerp, getRandomFloat, getRandomInt } from '../util/util.js';

export class InfiniteGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.items = [];
        this.options = {
            gapX: 150,
            gapY: 150,
            itemWidth: 150,
            itemHeight: 235,
            ...options
        };

        this.scroll = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            lastX: 0,
            lastY: 0
        };

        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        
        // Audio setup for "bookish" haptic
        this.pageFlipSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1479/1479-preview.mp3');
        this.pageFlipSound.volume = 0.2;
        this.pageFlipSound.preload = 'auto';
        this.pageFlipSound.crossOrigin = 'anonymous';
        
        this.typingSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        this.typingSound.volume = 0.1;
        this.typingSound.preload = 'auto';
        this.typingSound.crossOrigin = 'anonymous';
        
        this.lastSoundTime = 0;
        this.audioEnabled = false;

        // Unlock audio on first user interaction
        const unlockAudio = () => {
            if (this.audioEnabled) return;
            
            const silentPlay = (audio) => {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                        this.audioEnabled = true;
                    }).catch(() => {
                        // Still locked or failed to load
                    });
                }
            };

            silentPlay(this.pageFlipSound);
            silentPlay(this.typingSound);
            
            if (this.audioEnabled) {
                window.removeEventListener('mousedown', unlockAudio);
                window.removeEventListener('touchstart', unlockAudio);
                window.removeEventListener('click', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
            }
        };
        window.addEventListener('mousedown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        
        this.calculateGridDimensions();
        this.galleryData = [];
        this.initModal();
        this.init();
    }

    initModal() {
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'modal-overlay hidden';
        this.modalOverlay.innerHTML = `
            <div class="modal-container notebook-paper">
                <div class="notebook-rings"></div>
                <div class="modal-header">
                    <div class="search-bar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <input type="text" placeholder="Search notes..." class="search-input">
                    </div>
                    <div class="header-actions">
                        <button class="share-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.6" y1="6.51" y2="10.49"/></svg>
                            Share
                        </button>
                        <div class="close-button-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x close-button"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                        </div>
                    </div>
                </div>
                <div class="modal-scroll-area">
                    <div class="modal-content">
                        <div class="formatting-bar">
                            <div class="save-status">Saving changes...</div>
                            <button class="formatting-btn" data-command="bold">B</button>
                            <button class="formatting-btn italic" data-command="italic">I</button>
                            <button class="formatting-btn underline" data-command="underline">U</button>
                            <button class="formatting-btn line-through" data-command="strikeThrough">S</button>
                            <div class="formatting-divider"></div>
                            <button class="formatting-btn" data-command="createLink">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-2"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 0 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
                            </button>
                            <button class="formatting-btn" data-command="insertUnorderedList">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                            </button>
                            <button class="formatting-btn" data-command="justifyLeft">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-align-left"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>
                            </button>
                            <button class="formatting-btn" data-command="insertImage">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            </button>
                            <button class="formatting-btn" data-command="formatBlock" data-value="pre">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-2"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                            </button>
                            <div class="formatting-divider"></div>
                            <button class="formatting-btn" data-command="formatBlock" data-value="blockquote">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 2.5 1 4.35 1 5.617A2 2 0 0 1 5 21c-1 0-2 0-2-1.072V19"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 2.5 1 4.35 1 5.617A2 2 0 0 1 17 21c-1 0-2 0-2-1.072V19"/></svg>
                            </button>
                        </div>
                        <h1 class="modal-book-title"></h1>
                        <h3 class="modal-book-author"></h3>
                        <div class="notebook-body" contenteditable="true">
                            <p>I started reading this because of the cover, but the content is much deeper. <span class="highlight-yellow searchable">The way the author describes the passage of time</span> really resonates with me.</p>
                            <p>Key strategies for understanding the plot:</p>
                            <ul>
                                <li><span class="highlight-blue searchable">Identity:</span> Who are we when no one is watching?</li>
                                <li><span class="highlight-yellow searchable">Action:</span> Small steps lead to massive transformations.</li>
                                <li><span class="highlight-blue searchable">Persistence:</span> The core theme of the third chapter.</li>
                            </ul>
                            <p>One specific quote I loved: <span class="highlight-yellow searchable">"Life is not a matter of holding good cards, but of playing a poor hand well."</span></p>
                            <p>Reflecting on the ending, I think the ambiguity is intentional. It forces the reader to <span class="highlight-blue searchable">confront their own biases</span> about the protagonist's choices.</p>
                            <p>Pro Tip: Re-read the intro after finishing. It changes everything!</p>
                        </div>
                        <div class="pagination-controls">
                            <div class="page-arrow prev">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                            </div>
                            <span class="page-number">Page 01 / 02</span>
                            <div class="page-arrow next">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modalOverlay);
        
        this.closeButton = this.modalOverlay.querySelector('.close-button-wrapper');
        this.closeButton.addEventListener('click', () => this.closeModal());

        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });

        // Search bar interaction
        const searchInput = this.modalOverlay.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const highlights = this.modalOverlay.querySelectorAll('.searchable');
            
            highlights.forEach(h => {
                const text = h.textContent.toLowerCase();
                if (query && text.includes(query)) {
                    h.classList.add('active-search');
                } else {
                    h.classList.remove('active-search');
                }
            });
        });

        // Simple arrows placeholder interaction
        this.modalOverlay.querySelector('.page-arrow.prev').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updatePageContent();
                this.modalOverlay.querySelector('.modal-scroll-area').scrollTop = 0;
            }
        });

        this.modalOverlay.querySelector('.page-arrow.next').addEventListener('click', () => {
            if (this.currentPage < this.maxPages) {
                this.currentPage++;
                this.updatePageContent();
                this.modalOverlay.querySelector('.modal-scroll-area').scrollTop = 0;
            }
        });

        // Formatting bar logic
        this.modalOverlay.querySelectorAll('.formatting-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const command = btn.dataset.command;
                const value = btn.dataset.value || null;

                if (command === 'createLink') {
                    const url = prompt('Enter the link URL:', 'https://');
                    if (url) document.execCommand(command, false, url);
                } else if (command === 'insertImage') {
                    const url = prompt('Enter the image URL:');
                    if (url) document.execCommand(command, false, url);
                } else {
                    document.execCommand(command, false, value);
                }
                
                this.updateFormattingState();
            });
        });

        // Save state logic
        const notebookBody = this.modalOverlay.querySelector('.notebook-body');
        const saveStatus = this.modalOverlay.querySelector('.save-status');
        let saveTimeout;

        notebookBody.addEventListener('keydown', (e) => {
            // Only play sound for character keys, space, backspace, etc.
            if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
                this.playTypingSound();
            }
        });

        notebookBody.addEventListener('input', () => {
            saveStatus.textContent = 'Saving changes...';
            saveStatus.classList.add('visible');
            
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveStatus.textContent = 'All changes saved';
                setTimeout(() => {
                    saveStatus.classList.remove('visible');
                }, 2000);
            }, 1000);
        });

        // Update active buttons on selection change
        document.addEventListener('selectionchange', () => {
            if (this.isModalOpen) {
                this.updateFormattingState();
            }
        });
    }

    updateFormattingState() {
        const buttons = this.modalOverlay.querySelectorAll('.formatting-btn');
        buttons.forEach(btn => {
            const command = btn.dataset.command;
            // Only update state for toggleable commands, and skip justifyLeft if it's too aggressive
            if (command && !['createLink', 'insertImage', 'formatBlock', 'justifyLeft'].includes(command)) {
                try {
                    if (document.queryCommandState(command)) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                } catch (e) {
                    btn.classList.remove('active');
                }
            } else if (command === 'justifyLeft') {
                // Only show active if it's explicitly set and not just the default
                // But execCommand alignment is tricky. We'll just let it be for now or remove active state.
                btn.classList.remove('active');
            }
        });
    }

    openModal(itemData) {
        const titleEl = this.modalOverlay.querySelector('.modal-book-title');
        const authorEl = this.modalOverlay.querySelector('.modal-book-author');
        const notebookBody = this.modalOverlay.querySelector('.notebook-body');
        const searchInput = this.modalOverlay.querySelector('.search-input');
        const pageNumber = this.modalOverlay.querySelector('.page-number');
        
        this.currentItemData = itemData;
        this.currentPage = 1;
        this.maxPages = 2; // Fake 2 pages for all

        titleEl.textContent = itemData.title;
        authorEl.textContent = "Note-taking";
        searchInput.value = '';
        pageNumber.textContent = `Page 01 / 02`;

        this.updatePageContent();
        
        this.modalOverlay.querySelectorAll('.searchable').forEach(h => h.classList.remove('active-search'));
        
        this.modalOverlay.classList.remove('hidden');
        this.modalOverlay.classList.add('flex');
        
        this.playBookSound();
        this.isModalOpen = true;
        document.body.style.overflow = 'hidden';
    }

    updatePageContent() {
        if (!this.currentItemData) return;
        const notebookBody = this.modalOverlay.querySelector('.notebook-body');
        const pageNumber = this.modalOverlay.querySelector('.page-number');
        const title = this.currentItemData.title.toLowerCase();
        
        pageNumber.textContent = `Page ${this.currentPage.toString().padStart(2, '0')} / ${this.maxPages.toString().padStart(2, '0')}`;

        if (this.currentPage === 1) {
            // Generate context-aware content for Page 1
            let content = '';
            if (title.includes('color') || title.includes('colour')) {
                content = `
                    <p>Reading about the <span class="highlight-yellow searchable">vibrancy of light</span>. The author argues that our perception of the world is entirely dictated by the spectrum we choose to acknowledge.</p>
                    <p>Key Observations:</p>
                    <ul>
                        <li><span class="highlight-blue searchable">Red Shifts:</span> Emotional acceleration in high-saturation environments.</li>
                        <li><span class="highlight-yellow searchable">Neural Harmony:</span> How specific palettes can induce deep meditative states.</li>
                    </ul>
                    <p>Conclusion: We don't see colors; we feel them.</p>
                `;
            } else if (title.includes('design') || title.includes('art')) {
                content = `
                    <p>A deep dive into <span class="highlight-blue searchable">minimalist structures</span>. The core thesis is that subtracted space is more valuable than added ornament.</p>
                    <p>Principles found:</p>
                    <ul>
                        <li><span class="highlight-yellow searchable">Rhythm:</span> The visual silence between elements.</li>
                        <li><span class="highlight-blue searchable">Purity:</span> Stripping a concept down to its skeletal truth.</li>
                    </ul>
                    <p>Pro Tip: Apply these rules to lifestyle, not just visuals.</p>
                `;
            } else if (title.includes('tech') || title.includes('digital')) {
                content = `
                    <p>The boundary between <span class="highlight-yellow searchable">human and machine</span> is blurring. These notes cover the ethics of persistent connectivity.</p>
                    <ul>
                        <li><span class="highlight-blue searchable">The Feed:</span> Dopamine loops and cognitive degradation.</li>
                        <li><span class="highlight-yellow searchable">Analog Rebirth:</span> Why we crave physical paper in a glass world.</li>
                    </ul>
                    <p>Reflecting on the chapter "The Silent Singularity" — it's already happened.</p>
                `;
            } else {
                content = `
                    <p>A fascinating journey through <span class="highlight-yellow searchable">hidden narratives</span>. This volume challenges everything I thought I knew about the subject.</p>
                    <ul>
                        <li><span class="highlight-blue searchable">Identity:</span> Who are we when the masks are stripped away?</li>
                        <li><span class="highlight-yellow searchable">Momentum:</span> Small choices leading to infinite deviations.</li>
                    </ul>
                    <p>The quote on page 142 changed my perspective: <span class="highlight-blue searchable">"Wisdom is identifying the pattern before the outcome."</span></p>
                `;
            }
            notebookBody.innerHTML = content;
        } else {
            // Page 2 - Random thoughts or continuations
            notebookBody.innerHTML = `
                <p>Continuing from the previous chapter... <span class="highlight-yellow searchable">The secondary implications</span> of the theory are even more radical.</p>
                <p>Additional Notes:</p>
                <ul>
                    <li>The <span class="highlight-blue searchable">Historical Context</span> suggests a cyclical nature to these events.</li>
                    <li>We must account for the <span class="highlight-yellow searchable">External Variables</span> mentioned in the appendix.</li>
                    <li>"Silence is the most profound argument." - Page 204</li>
                </ul>
                <p>Final thought for today: How much of our perspective is inherited vs earned?</p>
                <p><em>Pro Tip: Check the references in the back for more depth.</em></p>
            `;
        }
    }

    closeModal() {
        this.modalOverlay.classList.remove('flex');
        this.modalOverlay.classList.add('hidden');
        this.isModalOpen = false;
        document.body.style.overflow = 'hidden';
    }

    async fetchData() {
        try {
            const url = '/api/gallery';
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch gallery data: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data || data.length === 0) {
                this.galleryData = [];
                return;
            }

            this.galleryData = data.map(item => ({
                title: item.title || 'Untitled',
                author: item.author || 'Note-taking',
                image: item.image || ''
            })).filter(item => item.image);

        } catch (error) {
            console.error('Error fetching gallery data:', error);
            this.galleryData = [];
        }
    }

    async init() {
        await this.fetchData();
        this.createGrid();
        this.addEventListeners();
        this.render();
    }

    createGrid() {
        if (!this.galleryData || this.galleryData.length === 0) return;
        
        const totalItems = this.options.columns * this.options.rows;
        
        for (let i = 0; i < totalItems; i++) {
            const id = `item-${i}`;
            
            // Cycle through gallery data
            const dataIndex = i % this.galleryData.length;
            const itemData = this.galleryData[dataIndex];
            
            const blurb = itemData.title;
            let imageName = itemData.image;

            // Ensure .png extension if missing
            if (imageName && !imageName.toLowerCase().endsWith('.png') && !imageName.startsWith('http')) {
                imageName += '.png';
            }
            
            const imageUrl = imageName.startsWith('http') 
                ? imageName 
                : `https://byspouzbijpkvclztxru.supabase.co/storage/v1/object/public/lorem-picsum/${imageName}?t=${Date.now()}`;
            
            this.addItem({ id, imageUrl, blurb, itemData });
        }
    }

    playBookSound() {
        if (!this.audioEnabled) return;
        const now = Date.now();
        if (now - this.lastSoundTime > 80) {
            try {
                const sound = this.pageFlipSound.cloneNode();
                sound.volume = 0.2;
                sound.play().catch(() => {});
            } catch (e) {}
            this.lastSoundTime = now;
        }
    }

    playTypingSound() {
        if (!this.audioEnabled) return;
        try {
            const sound = this.typingSound.cloneNode();
            sound.volume = 0.05;
            sound.play().catch(() => {});
        } catch (e) {}
    }

    calculateGridDimensions() {
        // Ensure the grid is always larger than the screen + buffer
        this.options.columns = Math.ceil(window.innerWidth / (this.options.itemWidth + this.options.gapX)) + 2;
        this.options.rows = Math.ceil(window.innerHeight / (this.options.itemHeight + this.options.gapY)) + 2;
    }

    addItem({ id, imageUrl, blurb, itemData, isNew = false }) {
        const el = document.createElement('div');
        el.className = 'grid-item group';
        el.dataset.id = id;

        el.innerHTML = `
            <div class="book-items">
                <div class="main-book-wrap">
                    <div class="book-cover">
                        <div class="book-inside"></div>
                        <div class="book-image">
                            <img src="${imageUrl}" alt="" draggable="false" referrerPolicy="no-referrer" 
                                 onload="this.classList.add('loaded'); this.parentElement.classList.add('is-loaded')"
                                 onerror="this.onerror=null; this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; this.parentElement.classList.add('is-loaded')">
                            <div class="effect"></div>
                            <div class="light"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid-item-caption">${blurb}</div>
        `;

        this.container.appendChild(el);

        // Add Hover/Dimming effect
        el.addEventListener('mouseenter', () => {
            this.container.classList.add('has-hover');
        });

        el.addEventListener('mouseleave', () => {
            this.container.classList.remove('has-hover');
        });

        el.addEventListener('touchstart', () => {
            this.container.classList.add('has-hover');
        }, { passive: true });

        el.addEventListener('touchend', () => {
            this.container.classList.remove('has-hover');
        }, { passive: true });

        // Add sound effect to the cover
        const bookCover = el.querySelector('.book-cover');
        if (bookCover) {
            // Also play on click for mobile/touch users
            bookCover.addEventListener('click', () => {
                this.playBookSound();
                this.openModal(itemData);
            });
        }

        const item = {
            el,
            id,
            blurb,
            width: this.options.itemWidth,
            height: this.options.itemHeight,
            x: 0,
            y: 0,
            // Initial grid position
            gridX: (this.items.length % this.options.columns) * (this.options.itemWidth + this.options.gapX),
            gridY: Math.floor(this.items.length / this.options.columns) * (this.options.itemHeight + this.options.gapY)
        };

        if (isNew) {
            el.style.opacity = '0';
            setTimeout(() => el.style.opacity = '1', 100);
        }

        this.items.push(item);
    }


    getDefaultBlurb() {
        const phrases = [
            "Lorem ipsum dolor sit amet",
            "Lorem ipsum dolor sit\namet dolor",
            "Lorem ipsum dolor",
            "Lorem ipsum dolor sit\namet dolor sit amet",
            "Lorem ipsum dolor sit",
            "Lorem ipsum dolor amet\ndolor"
        ];
        return phrases[getRandomInt(0, phrases.length - 1)];
    }

    addEventListeners() {
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        window.addEventListener('touchstart', this.onMouseDown.bind(this));
        window.addEventListener('touchmove', this.onMouseMove.bind(this));
        window.addEventListener('touchend', this.onMouseUp.bind(this));

        window.addEventListener('wheel', this.onWheel.bind(this));
        window.addEventListener('resize', this.onResize.bind(this));
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.hasInteracted = true;
        const pos = this.getEventPos(e);
        this.startPos.x = pos.x;
        this.startPos.y = pos.y;
        this.scroll.lastX = this.scroll.targetX;
        this.scroll.lastY = this.scroll.targetY;
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const pos = this.getEventPos(e);
        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;
        
        this.scroll.targetX = this.scroll.lastX + dx;
        this.scroll.targetY = this.scroll.lastY + dy;
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        this.hasInteracted = true;
        this.scroll.targetX -= e.deltaX;
        this.scroll.targetY -= e.deltaY;
    }

    onResize() {
        // On resize, we might need more items if the screen got bigger
        const prevItemsCount = this.items.length;
        this.calculateGridDimensions();
        
        if (!this.galleryData || this.galleryData.length === 0) return;
        
        const newTotal = this.options.columns * this.options.rows;
        
        if (newTotal > prevItemsCount) {
            for (let i = prevItemsCount; i < newTotal; i++) {
                const id = `item-${i}`;
                
                // Cycle through gallery data
                const dataIndex = i % this.galleryData.length;
                const itemData = this.galleryData[dataIndex];
                
                const blurb = itemData.title;
                let imageName = itemData.image;

                // Ensure .png extension if missing
                if (imageName && !imageName.toLowerCase().endsWith('.png') && !imageName.startsWith('http')) {
                    imageName += '.png';
                }
                
                const imageUrl = imageName.startsWith('http') 
                    ? imageName 
                    : `https://byspouzbijpkvclztxru.supabase.co/storage/v1/object/public/lorem-picsum/${imageName}?t=${Date.now()}`;
                
                this.addItem({ id, imageUrl, blurb, itemData });
            }
        }
    }

    async refresh() {
        // Simple artificial delay and re-init/onResize logic
        return new Promise(resolve => {
            setTimeout(() => {
                this.onResize();
                resolve();
            }, 600);
        });
    }

    getEventPos(e) {
        return {
            x: e.touches ? e.touches[0].clientX : e.clientX,
            y: e.touches ? e.touches[0].clientY : e.clientY
        };
    }

    render() {
        if (this.isModalOpen) {
            requestAnimationFrame(this.render.bind(this));
            return;
        }

        this.scroll.x = lerp(this.scroll.x, this.scroll.targetX, 0.1);
        this.scroll.y = lerp(this.scroll.y, this.scroll.targetY, 0.1);

        const itemTotalWidth = this.options.itemWidth + this.options.gapX;
        const itemTotalHeight = this.options.itemHeight + this.options.gapY;
        const gridWidth = this.options.columns * itemTotalWidth;
        const gridHeight = this.options.rows * itemTotalHeight;

        this.items.forEach((item, index) => {
            // Calculate static grid position if not already set
            const gridX = (index % this.options.columns) * itemTotalWidth;
            const gridY = Math.floor(index / this.options.columns) * itemTotalHeight;

            // Calculate position with infinite wrap
            let x = (gridX + this.scroll.x) % gridWidth;
            let y = (gridY + this.scroll.y) % gridHeight;

            // Handle negative modulo and wrap around viewport
            if (x < -this.options.itemWidth) x += gridWidth;
            if (y < -this.options.itemHeight) y += gridHeight;
            if (x > gridWidth - this.options.itemWidth) x -= gridWidth;
            if (y > gridHeight - this.options.itemHeight) y -= gridHeight;

            item.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });

        requestAnimationFrame(this.render.bind(this));
    }
}
