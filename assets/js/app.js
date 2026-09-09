document.addEventListener('DOMContentLoaded', () => {
    // News Modal Logic (Moved to top for priority)
    const newsModal = document.getElementById('newsModal');
    const closeNewsModal = document.getElementById('closeNewsModal');
    const newsModalTitle = document.getElementById('newsModalTitle');
    const newsModalBadge = document.getElementById('newsModalBadge');
    const newsModalImage = document.getElementById('newsModalImage');
    const newsModalContent = document.getElementById('newsModalContent');

    document.querySelectorAll('.btn-read-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const data = btn.dataset;
            
            if(newsModalTitle) newsModalTitle.textContent = data.title;
            if(newsModalBadge) {
                newsModalBadge.textContent = data.badge;
                if(data.badge === 'Hardware') newsModalBadge.style.background = '#ffb700';
                else if(data.badge === 'Trending') newsModalBadge.style.background = '#ff4747';
                else if(data.badge === 'Retro') newsModalBadge.style.background = '#00d2ff';
                else newsModalBadge.style.background = 'var(--accent-primary)';
            }
            if(newsModalImage) newsModalImage.style.backgroundImage = `url('${data.image}')`;
            if(newsModalContent) newsModalContent.innerHTML = data.fullContent;
            
            if(newsModal) newsModal.classList.add('active');
        });
    });

    if(closeNewsModal) {
        closeNewsModal.addEventListener('click', () => {
            if(newsModal) newsModal.classList.remove('active');
        });
    }

    // Unified outside click handler for all modal overlays
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Security and formatting helpers
    const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));

    // Profile Data Management
    const defaultProfile = {
        name: "Tu Usuario",
        handle: "@tu_usuario",
        bio: "Apasionado por los RPGs y los eSports. Siempre buscando el siguiente nivel.",
        avatar: "https://ui-avatars.com/api/?name=Tu+Usuario&background=000&color=fff"
    };

    const loadProfile = () => {
        const profile = JSON.parse(localStorage.getItem('erg_profile')) || defaultProfile;
        
        const headerAvatar = document.getElementById('headerAvatar');
        const postAvatar = document.getElementById('postAreaAvatar');
        const profileAvatar = document.getElementById('profileBigAvatar');
        const profileName = document.getElementById('profileNameDisplay');
        const profileHandle = document.getElementById('profileHandleDisplay');
        const profileBio = document.getElementById('profileBioDisplay');
        const editAvatarPreview = document.getElementById('editAvatarPreview');
        const editName = document.getElementById('editName');
        const editHandle = document.getElementById('editHandle');
        const editBio = document.getElementById('editBio');
        const comPostAvatar = document.getElementById('comPostAreaAvatar');
        
        if(headerAvatar) headerAvatar.src = profile.avatar;
        if(postAvatar) postAvatar.src = profile.avatar;
        if(profileAvatar) profileAvatar.src = profile.avatar;
        if(editAvatarPreview) editAvatarPreview.src = profile.avatar;
        if(comPostAvatar) comPostAvatar.src = profile.avatar;
        
        if(profileName) profileName.innerHTML = `${escapeHTML(profile.name)} <i class="fa-solid fa-circle-check" style="color: var(--accent-primary); font-size: 16px;"></i>`;
        if(profileHandle) profileHandle.textContent = profile.handle.startsWith('@') ? escapeHTML(profile.handle) : `@${escapeHTML(profile.handle)}`;
        if(profileBio) profileBio.textContent = profile.bio;
        
        if(editName) editName.value = profile.name;
        if(editHandle) editHandle.value = profile.handle;
        if(editBio) editBio.value = profile.bio;
        
        // Role-Based UI Adjustments
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid) {
            statsGrid.style.display = profile.role === 'admin' ? 'grid' : 'none';
        }

        const adminLink = document.getElementById('adminPanelLink');
        const userSettingsLink = document.getElementById('userSettingsLink');
        
        if (adminLink) adminLink.style.display = profile.role === 'admin' ? 'block' : 'none';
        if (userSettingsLink) userSettingsLink.style.display = profile.role === 'admin' ? 'none' : 'block';

        return profile;
    };
    // Global Settings Application
    const applyGlobalSettings = () => {
        const settings = JSON.parse(localStorage.getItem('erg_settings')) || { theme: 'neon-blue', gamerCursor: false, glowEffect: true };
        const root = document.documentElement;
        
        // Theme
        if(settings.theme === 'vampire-red') root.style.setProperty('--accent-primary', '#ff003c');
        else if(settings.theme === 'cyberpunk-gold') root.style.setProperty('--accent-primary', '#ffb700');
        else if(settings.theme === 'emerald-green') root.style.setProperty('--accent-primary', '#00ff88');
        else root.style.setProperty('--accent-primary', '#00f3ff');

        // Cursor
        if(settings.gamerCursor) {
            document.body.classList.add('custom-cursor');
            const cursorUrl = 'url("https://cur.cursors-4u.net/games/gam-4/gam372.cur"), auto';
            document.body.style.cursor = cursorUrl;
            
            // Apply to all current and future interactive elements via head style for performance
            let style = document.getElementById('cursor-style');
            if (!style) {
                style = document.createElement('style');
                style.id = 'cursor-style';
                document.head.appendChild(style);
            }
            style.innerHTML = `* { cursor: ${cursorUrl} !important; } a, button, select, input, [role="button"] { cursor: url("https://cur.cursors-4u.net/games/gam-4/gam372.cur"), pointer !important; }`;
        } else {
            document.body.classList.remove('custom-cursor');
            const style = document.getElementById('cursor-style');
            if (style) style.remove();
            document.body.style.cursor = '';
        }

        // Glow Effect
        if(!settings.glowEffect) {
            root.style.setProperty('--glow-opacity', '0');
            document.body.classList.add('no-glow');
        } else {
            root.style.setProperty('--glow-opacity', '1');
            document.body.classList.remove('no-glow');
        }
    };
    applyGlobalSettings();

    let currentProfile = loadProfile();

    // Load local storage posts
    const loadPosts = () => {
        const savedPosts = JSON.parse(localStorage.getItem('erg_posts')) || [];
        const createPostWrapper = document.querySelector('.create-post-card');
        const injectTarget = createPostWrapper ? (createPostWrapper.closest('.feed-card') || createPostWrapper) : null;
        if(injectTarget && savedPosts.length > 0) {
            [...savedPosts].reverse().forEach((html, idx) => {
                // Ensure ID exists before injection
                if (!html.includes('data-post-id=')) {
                    const tempId = `post-legacy-${Date.now()}-${idx}`;
                    html = html.replace('<article class="post-card"', `<article class="post-card" data-post-id="${tempId}"`);
                }
                injectTarget.insertAdjacentHTML('afterend', html);
            });
        }
    };
    loadPosts();

    // Actualizar recuentos de comentarios en el DOM inicial
    const updateAllCommentCounts = () => {
        document.querySelectorAll('.post-card').forEach(post => {
            const postId = post.dataset.postId;
            if (postId) {
                const savedComments = JSON.parse(localStorage.getItem(`erg_comments_${postId}`)) || [];
                const countSpan = post.querySelector('.comment-btn span');
                if (countSpan) countSpan.textContent = savedComments.length;
            }
        });
    };
    updateAllCommentCounts();

    // Actualizador de estado de posts para que Likes y Comentarios no se borren
    const updatePostDOM = (postArticle) => {
        if(!postArticle) return;
        postArticle.style.animation = ''; // Limpiar animación residual
        
        if (postArticle.classList.contains('community-post')) {
            let comPosts = JSON.parse(localStorage.getItem('erg_com_posts')) || [];
            const cIndex = window.currentActiveCommunityIndex;
            // Get all community posts for current community to match index
            const comPostsForCurrent = comPosts.filter(p => p.communityIndex === cIndex);
            const allComPostsInDOM = Array.from(document.getElementById('comWallContainer').querySelectorAll('.community-post'));
            const localIndex = allComPostsInDOM.indexOf(postArticle);
            
            if (localIndex !== -1 && localIndex < comPostsForCurrent.length) {
                // Find actual post in global array using reference match or explicit identifier
                const globalIndex = comPosts.findIndex(p => p === comPostsForCurrent[localIndex]);
                if(globalIndex !== -1) {
                    comPosts[globalIndex].html = postArticle.outerHTML;
                    try { localStorage.setItem('erg_com_posts', JSON.stringify(comPosts)); } catch(e) {}
                }
            }
            return;
        }

        let savedPosts = JSON.parse(localStorage.getItem('erg_posts')) || [];
        const allPosts = Array.from(document.querySelectorAll('.post-card:not(.community-post)'));
        const index = allPosts.indexOf(postArticle);
        if (index !== -1 && index < savedPosts.length) {
            savedPosts[index] = postArticle.outerHTML;
            try {
                localStorage.setItem('erg_posts', JSON.stringify(savedPosts));
            } catch(e) {}
        }
    };


    const openMDIWindow = (id) => {
        const targetSec = document.getElementById(id);
        if(!targetSec) return;
        targetSec.classList.add('active');
        targetSec.classList.add('floating-window');
        
        // Z-index management
        document.querySelectorAll('.floating-window, .chat-modal').forEach(m => {
            if(parseInt(m.style.zIndex || 1000) >= 2001) m.style.zIndex = 1000; 
        });
        targetSec.style.zIndex = 2005;
        
        try {
            const savedPos = JSON.parse(localStorage.getItem(`erg_${id}_pos`));
            if (savedPos && savedPos.left && savedPos.top) {
                targetSec.style.left = savedPos.left;
                targetSec.style.top = savedPos.top;
            } else if (!targetSec.style.left) {
                const offset = Math.random() * 50;
                targetSec.style.left = (300 + offset) + 'px';
                targetSec.style.top = (100 + offset) + 'px';
            }
        } catch(e) {}
    };

    // Tab functionality for sidebar links (Normal Tabs)
    const sidebarItems = document.querySelectorAll('.sidebar-item:not(.custom-com-btn)');
    const feedSections = document.querySelectorAll('.feed-section:not(#visor-comunidad)');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const currentItem = e.currentTarget;
            const href = currentItem.getAttribute('href');
            
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                // Permitir navegación normal
                return;
            }

            e.preventDefault();
            
            sidebarItems.forEach(i => i.classList.remove('active'));
            currentItem.classList.add('active');
            
            const targetId = currentItem.getAttribute('data-target');
            if(targetId) {
                feedSections.forEach(section => {
                    if (section.id === targetId) {
                        section.classList.add('active');
                    } else {
                        section.classList.remove('active');
                    }
                });
            }
        });
    });

    // Dark/Light Theme Toggle
    const moonBtn = document.querySelector('.moon-btn');
    
    // Load persisted theme
    if (localStorage.getItem('erg_theme') === 'light') {
        document.body.classList.add('light-mode');
        if (moonBtn) {
            moonBtn.querySelector('i').className = 'fa-solid fa-sun';
        }
    }

    if (moonBtn) {
        moonBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const icon = moonBtn.querySelector('i');
            if (document.body.classList.contains('light-mode')) {
                icon.className = 'fa-solid fa-sun';
                localStorage.setItem('erg_theme', 'light');
            } else {
                icon.className = 'fa-solid fa-moon';
                localStorage.setItem('erg_theme', 'dark');
            }
        });
    }

    // Dropdowns (Bell & Avatar)
    const bellBtn = document.getElementById('bellBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const avatarBtn = document.getElementById('avatarBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    const toggleDropdown = (btn, dropdown) => {
        if(btn && dropdown) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents instant closing
                // Close others
                document.querySelectorAll('.dropdown-menu').forEach(d => {
                    if (d !== dropdown) d.classList.remove('show');
                });
                dropdown.classList.toggle('show');
            });
        }
    };
    toggleDropdown(bellBtn, notifDropdown);
    toggleDropdown(avatarBtn, profileDropdown);

    // Close Dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-wrapper')) {
            document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
        }
    });

    // Interacciones del Menú de Perfil
    const btnMiPerfil = document.getElementById('btnMiPerfil');
    if (btnMiPerfil) {
        btnMiPerfil.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
            
            // Navegar a perfil (Normal Tab)
            document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.feed-section:not(#visor-comunidad)').forEach(section => {
                if (section.id === 'perfil-usuario') {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Profile Settings Redirection
    const btnEditProfile = document.getElementById('btnEditProfile');
    if (btnEditProfile) {
        btnEditProfile.addEventListener('click', () => {
            window.location.href = 'auth/panel_control/usuario/index.html';
        });
    }

    const btnAjustes = document.getElementById('btnAjustes');
    if (btnAjustes) {
        btnAjustes.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'auth/panel_control/usuario/configuracion.html';
        });
    }

    // Additional handler removed to avoid redeclaration and conflict.
    // Dashboard btnMiPerfil already handles showing the profile section.

    const btnSalir = document.getElementById('btnSalir');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
             document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
             showToast('Cerrando sesión...', 'linear-gradient(135deg, var(--accent-secondary), #b026ff)');
             setTimeout(() => {
                 localStorage.clear();
                 window.location.href = 'auth/login.html';
             }, 1500);
        });
    }

    // Create Post Interactions & Toast
    const publishBtn = document.querySelector('.btn-publish');
    const postInput = document.querySelector('#postTextArea') || document.querySelector('.post-input');
    const toastContainer = document.getElementById('toast-container');
    
    if (publishBtn && postInput && toastContainer) {
        publishBtn.addEventListener('click', (e) => {
            if (e.target.closest('.empty-state')) return;

            const mediaInput = document.getElementById('mediaInput');
            const mediaFileName = document.getElementById('mediaFileName');
            const linkInput = document.getElementById('linkInput');
            const encuestaContainer = document.getElementById('encuestaContainer');
            
            const pollQ = document.getElementById('pollQuestionInput');
            const text = postInput.value.trim();
            const hasMedia = mediaInput && mediaInput.files.length > 0;
            const mediaUrl = hasMedia ? mediaInput.dataset.previewUrl : null;
            const mediaType = hasMedia ? mediaInput.dataset.fileType : '';
            const hasLink = linkInput && linkInput.value.trim() !== "";
            const hasPoll = encuestaContainer && encuestaContainer.style.display === 'flex' && 
                (Array.from(encuestaContainer.querySelectorAll('input.poll-option')).some(i => i.value.trim() !== "") || (pollQ && pollQ.value.trim() !== ""));

            if (text === "" && !hasMedia && !hasLink && !hasPoll) {
                showToast('Escribe algo o adjunta un archivo antes de publicar.', '#ff4d4d');
                return;
            }

            const postId = `post-${Date.now()}`;
            const postHTML = `
                <article class="post-card" data-post-id="${postId}" style="animation: toastSlideIn 0.4s ease forwards; background: var(--bg-secondary); border: 1px solid var(--accent-primary); box-shadow: 0 0 15px rgba(0, 243, 255, 0.1);">
                    <div class="post-header">
                        <img src="${currentProfile.avatar}" alt="User" class="post-avatar" style="object-fit: cover;">
                        <div class="post-info">
                            <h3>${escapeHTML(currentProfile.name)}</h3>
                            <span>Justo ahora • <i class="fa-solid fa-earth-americas"></i></span>
                        </div>
                        <div class="dropdown-wrapper" style="margin-left: auto;">
                            <button class="icon-btn post-options-btn"><i class="fa-solid fa-ellipsis"></i></button>
                            <div class="dropdown-menu" style="right: 0; left: auto; top: 100%; min-width: 120px;">
                                <div class="dropdown-item delete-post-btn" style="color: #ff4d4d;"><i class="fa-solid fa-trash-can"></i> Eliminar</div>
                            </div>
                        </div>
                    </div>
                    <div class="post-content">
                        ${text ? `<p style="margin-bottom: 5px;">${escapeHTML(text).replace(/\n/g, '<br>')}</p>` : ''}
                        ${hasLink ? `<a href="${escapeHTML(linkInput.value)}" target="_blank" style="color: var(--accent-primary); display: block; margin-top: 5px; word-break: break-all;"><i class="fa-solid fa-link"></i> ${escapeHTML(linkInput.value)}</a>` : ''}
                        ${hasPoll ? buildPollHTML(encuestaContainer) : ''}

                        ${hasMedia && mediaUrl ? `
                            <div style="margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-subtle);">
                                ${(mediaType && mediaType.startsWith('video')) ?
                                    `<video src="${mediaUrl}" controls style="width: 100%; max-height: 500px; object-fit: contain; display: block; background: #000;"></video>` :
                                    `<img src="${mediaUrl}" alt="Media adjunta" style="width: 100%; max-height: 500px; object-fit: contain; display: block; background: #000;">`
                                }
                            </div>
                        ` : (hasMedia ? `<div style="background: var(--bg-main); border-radius: 8px; padding: 20px; text-align: center; color: var(--accent-primary); margin: 0 20px 15px;"><i class="fa-solid fa-file" style="font-size: 30px; margin-bottom: 10px;"></i><br>Multimedia adjunta: ${escapeHTML(mediaFileName.textContent)}</div>` : '')}
                    </div>
                    <div class="post-footer">
                        <button class="action-btn like-btn"><i class="fa-regular fa-heart"></i> <span>0</span></button>
                        <button class="action-btn comment-btn"><i class="fa-regular fa-comment"></i> <span>0</span></button>
                        <button class="action-btn share-btn"><i class="fa-solid fa-share-nodes"></i> Compartir</button>
                    </div>
                </article>
            `;
            
            const createPostWrapper = document.querySelector('.create-post-card').closest('.feed-card') || document.querySelector('.create-post-card');
            if(createPostWrapper) {
                createPostWrapper.insertAdjacentHTML('afterend', postHTML);
                
                // Modificar el DOM HTML antes de guardar para quitar la animacion
                const savedHTML = postHTML.replace('animation: toastSlideIn 0.4s ease forwards;', '');
                
                let savedPosts = JSON.parse(localStorage.getItem('erg_posts')) || [];
                savedPosts.unshift(savedHTML);
                try {
                    localStorage.setItem('erg_posts', JSON.stringify(savedPosts));
                } catch(e) {
                    console.warn("Storage is full, the post will not survive a refresh if it's too big.");
                    // Optional toast if it fails (like when storing huge images)
                }
            }

            // Clean up UI
            postInput.value = '';
            if(mediaInput) mediaInput.value = '';
            if(document.getElementById('mediaPreviewContainer')) document.getElementById('mediaPreviewContainer').style.display = 'none';
            if(linkInput) linkInput.value = '';
            if(document.getElementById('enlaceInputContainer')) document.getElementById('enlaceInputContainer').style.display = 'none';
            if(encuestaContainer) {
                encuestaContainer.style.display = 'none';
                if(pollQ) pollQ.value = '';
                const extraOptions = encuestaContainer.querySelectorAll('.poll-option');
                extraOptions.forEach((opt, idx) => {
                    if(idx > 1) opt.remove(); // keep only first 2
                    else opt.value = '';
                });
            }
            
            showToast('¡Publicación creada con éxito!', 'linear-gradient(135deg, var(--accent-primary), #0051ff)');
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        });
    }

    // Toast generator function
    function showToast(message, background) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.background = background;
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
        toastContainer.appendChild(toast);

        // Remove after 3s
        setTimeout(() => {
            toast.classList.add('hiding');
            // Remove from DOM safely after animation completes
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Survey/Poll HTML Builder
    function buildPollHTML(container) {
        if (!container) return '';
        const pollQ = container.querySelector('#pollQuestionInput');
        const question = pollQ ? pollQ.value.trim() : '';
        const options = Array.from(container.querySelectorAll('.poll-option'))
            .map(opt => opt.value.trim())
            .filter(val => val !== '');
        
        if (!question && options.length === 0) return '';
        
        let html = `<div style="background: var(--bg-main); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 15px; margin-top: 15px;">`;
        if (question) {
            html += `<h4 style="margin-bottom: 15px; color: var(--text-primary); font-size: 15px;"><i class="fa-solid fa-square-poll-horizontal" style="color: var(--accent-primary); margin-right: 8px;"></i>${escapeHTML(question)}</h4>`;
        }
        
        html += `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        options.forEach(opt => {
            html += `<button style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px 15px; text-align: left; color: var(--text-primary); cursor: pointer; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;" onmouseover="this.style.borderColor='var(--accent-primary)'" onmouseout="this.style.borderColor='var(--border-subtle)'" onclick="this.style.borderColor='var(--accent-primary)'; this.style.background='var(--bg-tertiary)'; this.querySelector('.poll-pct').textContent='100%'; Array.from(this.parentNode.children).forEach(b => { if(b!==this) b.style.pointerEvents='none'; });">
                <span style="font-weight: 500;">${escapeHTML(opt)}</span>
                <span class="poll-pct" style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">0%</span>
            </button>`;
        });
        html += `</div></div>`;
        return html;
    }

    // Post Attachments Logic
    const btnMedia = document.getElementById('btnMedia');
    const mediaInput = document.getElementById('mediaInput');
    const mediaPreviewContainer = document.getElementById('mediaPreviewContainer');
    const mediaFileName = document.getElementById('mediaFileName');
    
    const btnEnlace = document.getElementById('btnEnlace');
    const enlaceInputContainer = document.getElementById('enlaceInputContainer');
    const linkInput = document.getElementById('linkInput');
    
    const btnEncuesta = document.getElementById('btnEncuesta');
    const encuestaContainer = document.getElementById('encuestaContainer');
    const addOptionBtn = document.getElementById('addOptionBtn');

    if(btnMedia) {
        btnMedia.addEventListener('click', () => {
            if(!btnMedia.classList.contains('active')) {
                mediaInput.click();
            } else {
                btnMedia.classList.remove('active');
                mediaPreviewContainer.style.display = 'none';
                mediaInput.value = '';
            }
        });
        
        mediaInput.addEventListener('change', (e) => {
            if(e.target.files.length > 0) {
                const file = e.target.files[0];
                mediaFileName.textContent = file.name;
                mediaInput.dataset.fileType = file.type;
                const reader = new FileReader();
                reader.onload = (event) => {
                    mediaInput.dataset.previewUrl = event.target.result;
                };
                reader.readAsDataURL(file);
                
                mediaPreviewContainer.style.display = 'block';
                btnMedia.classList.add('active');
            } else {
                mediaPreviewContainer.style.display = 'none';
                btnMedia.classList.remove('active');
                delete mediaInput.dataset.previewUrl;
                delete mediaInput.dataset.fileType;
            }
        });
    }

    if(btnEnlace) {
        btnEnlace.addEventListener('click', () => {
            btnEnlace.classList.toggle('active');
            enlaceInputContainer.style.display = btnEnlace.classList.contains('active') ? 'block' : 'none';
            if(btnEnlace.classList.contains('active')) linkInput.focus();
        });
    }

    if(btnEncuesta) {
        btnEncuesta.addEventListener('click', () => {
            btnEncuesta.classList.toggle('active');
            encuestaContainer.style.display = btnEncuesta.classList.contains('active') ? 'flex' : 'none';
        });
        
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', () => {
                const newOption = document.createElement('input');
                newOption.type = 'text';
                newOption.className = 'post-input poll-option';
                newOption.style.cssText = 'min-height: 35px; padding: 8px 12px; width: 100%;';
                newOption.placeholder = `Opción ${encuestaContainer.querySelectorAll('.poll-option').length + 1}`;
                encuestaContainer.insertBefore(newOption, addOptionBtn);
            });
        }
    }

    // Search Bar Logic
    const searchInput = document.querySelector('#searchInput');
    const searchBtn = document.querySelector('#searchBtn');
    
    const handleSearch = () => {
        if (!searchInput) return;
        const query = searchInput.value.trim().toLowerCase();
        
        if (query !== "") {
            // Buscar en Noticias, Cursos Y Posts de usuario
            const allCards = Array.from(document.querySelectorAll('#noticias .news-card, #cursos .news-card, .post-card'));
            
            // Buscar la primera carta que coincida
            const match = allCards.find(card => {
                const title = card.querySelector('h3')?.textContent.toLowerCase() || "";
                const text = card.querySelector('.post-content, p')?.textContent.toLowerCase() || "";
                return title.includes(query) || text.includes(query);
            });
            
            if (match) {
                searchInput.value = '';
                
                // Encontrar la pestaña padre
                const parentSection = match.closest('.feed-section') || document.getElementById('principal');
                const targetId = parentSection.id;
                
                // Activar la pestaña correcta
                document.querySelectorAll('.feed-section').forEach(sec => sec.classList.remove('active'));
                parentSection.classList.add('active');
                
                // Actualizar estilo en la barra lateral
                document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                const activeLink = document.querySelector(`.sidebar-item[data-target="${targetId}"]`);
                if(activeLink) activeLink.classList.add('active');
                
                // Hacer scroll fluido hasta la tarjeta
                match.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Aplicar un destello visual temporal
                match.style.transition = 'all 0.5s';
                const originalBorder = match.style.borderColor;
                match.style.borderColor = 'var(--accent-primary)';
                match.style.boxShadow = '0 0 30px rgba(0, 243, 255, 0.8)';
                
                setTimeout(() => {
                    match.style.borderColor = originalBorder;
                    match.style.boxShadow = '';
                }, 2000);
                
                showToast(`Encontrado: "${query}"`, 'linear-gradient(135deg, #00f3ff, #0051ff)');
            } else {
                showToast(`No se encontraron coincidencia para "${query}".`, '#ff4d4d');
            }
        } else {
            searchInput.focus();
        }
    };

    if (searchInput && searchBtn) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        searchBtn.addEventListener('click', handleSearch);
    }

    // --- Interacciones de Publicaciones (Likes, Comentarios, Compartir) ---
    // Usamos delegación de eventos para que funcione con posts nuevos y viejos
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Lógica de LIKE
        if (target.closest('.like-btn')) {
            const btn = target.closest('.like-btn');
            const icon = btn.querySelector('i');
            const countSpan = btn.querySelector('span');
            let count = parseInt(countSpan.textContent) || 0;
            
            if (icon.classList.contains('fa-regular')) {
                icon.className = 'fa-solid fa-heart';
                icon.style.color = '#ff2a5f';
                count++;
                btn.classList.add('liked');
            } else {
                icon.className = 'fa-regular fa-heart';
                icon.style.color = '';
                count--;
                btn.classList.remove('liked');
            }
            countSpan.textContent = count;
            
            // Persistir cambios
            const postArticle = btn.closest('.post-card');
            if (postArticle) {
                // Función local de guardado para evitar dependencias circulares o duplicados
                const savePostState = (el) => {
                    const isCom = el.classList.contains('community-post');
                    if (isCom) {
                        let comPosts = JSON.parse(localStorage.getItem('erg_com_posts')) || [];
                        const wall = document.getElementById('comWallContainer');
                        if(!wall) return;
                        const allInDOM = Array.from(wall.querySelectorAll('.community-post'));
                        const idx = allInDOM.indexOf(el);
                        if (idx !== -1) {
                            // Find matching post by content/index
                            const cIdx = window.currentActiveCommunityIndex;
                            const currentComPosts = comPosts.filter(p => p.communityIndex === cIdx);
                            if (idx < currentComPosts.length) {
                                const globalIdx = comPosts.indexOf(currentComPosts[idx]);
                                if (globalIdx !== -1) {
                                    comPosts[globalIdx].html = el.outerHTML;
                                    localStorage.setItem('erg_com_posts', JSON.stringify(comPosts));
                                }
                            }
                        }
                    } else {
                        let savedPosts = JSON.parse(localStorage.getItem('erg_posts')) || [];
                        const allPosts = Array.from(document.querySelectorAll('.post-card:not(.community-post)'));
                        const idx = allPosts.indexOf(el);
                        if (idx !== -1 && idx < savedPosts.length) {
                            savedPosts[idx] = el.outerHTML.replace('animation: toastSlideIn 0.4s ease forwards;', '');
                            localStorage.setItem('erg_posts', JSON.stringify(savedPosts));
                        }
                    }
                };
                savePostState(postArticle);
            }
        }

        // Lógica de COMENTARIOS (Abrir Modal)
        if (target.closest('.comment-btn')) {
            const btn = target.closest('.comment-btn');
            const postArticle = btn.closest('.post-card');
            const postId = postArticle.dataset.postId || 'static-unknown';
            window.currentPostId = postId;

            const commentModal = document.getElementById('commentModal');
            if (commentModal) {
                commentModal.classList.add('active');
                const commentList = document.getElementById('commentList');
                const emptyState = document.getElementById('commentsEmptyState');
                
                if (commentList && emptyState) {
                    commentList.innerHTML = '';
                    commentList.appendChild(emptyState);
                    
                    // Cargar comentarios guardados
                    const savedComments = JSON.parse(localStorage.getItem(`erg_comments_${postId}`)) || [];
                    if (savedComments.length > 0) {
                        emptyState.style.display = 'none';
                        savedComments.forEach(comment => {
                            const cHTML = `
                                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border-left: 3px solid var(--accent-primary); margin-top: 10px;">
                                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                                        <img src="${comment.avatar}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover;">
                                        <strong style="font-size: 13px;">${escapeHTML(comment.name)}</strong>
                                    </div>
                                    <p style="font-size: 13px; margin: 0;">${escapeHTML(comment.text)}</p>
                                </div>
                            `;
                            commentList.insertAdjacentHTML('beforeend', cHTML);
                        });
                    } else {
                        emptyState.style.display = 'flex';
                    }
                }
            }
        }

        // Lógica de COMPARTIR
        if (target.closest('.share-btn')) {
            showToast('Enlace copiado al portapapeles.', 'linear-gradient(135deg, var(--accent-primary), #00bbff)');
        }

        // Lógica de OPCIONES DE POST (Abrir dropdown)
        if (target.closest('.post-options-btn')) {
            const dropdown = target.closest('.dropdown-wrapper').querySelector('.dropdown-menu');
            dropdown.classList.toggle('show');
        }

        // Lógica de ELIMINAR POST
        if (target.closest('.delete-post-btn')) {
            const postArticle = target.closest('.post-card');
            if(confirm('¿Seguro que quieres borrar esta publicación?')) {
                postArticle.style.opacity = '0';
                postArticle.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    deletePost(postArticle);
                    postArticle.remove();
                    showToast('Publicación eliminada.', '#ff4d4d');
                }, 300);
            }
        }
    });

    // Añadir botón de reinicio global al menú de perfil vía JS para mayor limpieza
    const pDropdown = document.getElementById('profileDropdown');
    if (pDropdown) {
        // Evitar duplicados si el script se ejecuta varias veces
        if (!pDropdown.querySelector('.reset-project-item')) {
            const resetItem = document.createElement('div');
            resetItem.className = 'dropdown-item reset-project-item';
            resetItem.style.color = '#ff9800';
            resetItem.style.borderTop = '1px solid rgba(255,255,255,0.05)';
            resetItem.style.marginTop = '5px';
            resetItem.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reiniciar Proyecto';
            resetItem.addEventListener('click', () => {
                if(confirm('¿Estás seguro de que quieres reiniciar todo el proyecto? Se borrarán tus posts y configuraciones.')) {
                    localStorage.clear();
                    window.location.reload();
                }
            });
            pDropdown.appendChild(resetItem);
        }
    }

    const deletePost = (postArticle) => {
        const isCommunity = postArticle.classList.contains('community-post');
        if (isCommunity) {
            let comPosts = JSON.parse(localStorage.getItem('erg_com_posts')) || [];
            const allComPostsInDOM = Array.from(document.getElementById('comWallContainer').querySelectorAll('.community-post'));
            const localIndex = allComPostsInDOM.indexOf(postArticle);
            
            // Filter global posts to find the one matching the current community and its relative index
            const cIndex = window.currentActiveCommunityIndex;
            const comPostsForCurrent = comPosts.filter(p => p.communityIndex === cIndex);
            
            if (localIndex !== -1 && localIndex < comPostsForCurrent.length) {
                const targetObj = comPostsForCurrent[localIndex];
                const globalIndex = comPosts.indexOf(targetObj);
                if(globalIndex !== -1) {
                    comPosts.splice(globalIndex, 1);
                    localStorage.setItem('erg_com_posts', JSON.stringify(comPosts));
                }
            }
        } else {
            let savedPosts = JSON.parse(localStorage.getItem('erg_posts')) || [];
            const allPosts = Array.from(document.querySelectorAll('.post-card:not(.community-post)'));
            const index = allPosts.indexOf(postArticle);
            if (index !== -1) {
                savedPosts.splice(index, 1);
                localStorage.setItem('erg_posts', JSON.stringify(savedPosts));
            }
        }
    };

    // Cerrar Modal de Comentarios
    const closeCommentModal = document.getElementById('closeCommentModal');
    if (closeCommentModal) {
        closeCommentModal.addEventListener('click', () => {
            document.getElementById('commentModal').classList.remove('active');
        });
    }

    // Enviar Comentario (Simulado)
    const sendCommentBtn = document.getElementById('sendCommentBtn');
    const commentInput = document.getElementById('commentInput');
    if (sendCommentBtn && commentInput) {
        sendCommentBtn.addEventListener('click', () => {
            const text = commentInput.value.trim();
            if (!text || !window.currentPostId) return;

            const commentList = document.getElementById('commentList');
            const emptyState = document.getElementById('commentsEmptyState');
            if (emptyState) emptyState.style.display = 'none';

            const newComment = {
                name: currentProfile.name,
                avatar: currentProfile.avatar,
                text: text,
                timestamp: Date.now()
            };

            // Guardar en localStorage
            const postId = window.currentPostId;
            const savedComments = JSON.parse(localStorage.getItem(`erg_comments_${postId}`)) || [];
            savedComments.push(newComment);
            localStorage.setItem(`erg_comments_${postId}`, JSON.stringify(savedComments));

            const commentHTML = `
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border-left: 3px solid var(--accent-primary); margin-top: 10px;">
                    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                        <img src="${newComment.avatar}" style="width: 25px; height: 25px; border-radius: 50%; object-fit: cover;">
                        <strong style="font-size: 13px;">${escapeHTML(newComment.name)}</strong>
                    </div>
                    <p style="font-size: 13px; margin: 0;">${escapeHTML(newComment.text)}</p>
                </div>
            `;
            commentList.insertAdjacentHTML('beforeend', commentHTML);
            commentInput.value = '';
            
            // Actualizar conteo en el post del DOM
            const postArticle = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (postArticle) {
                const countSpan = postArticle.querySelector('.comment-btn span');
                if (countSpan) countSpan.textContent = savedComments.length;
                
                // Actualizar el HTML guardado en localStorage también
                const isCommunity = postArticle.classList.contains('community-post');
                if (!isCommunity) {
                    let savedPosts = JSON.parse(localStorage.getItem('erg_posts')) || [];
                    const allPostsInDOM = Array.from(document.querySelectorAll('.post-card:not(.community-post)'));
                    const index = allPostsInDOM.indexOf(postArticle);
                    if (index !== -1) {
                        savedPosts[index] = postArticle.outerHTML.replace('animation: toastSlideIn 0.4s ease forwards;', '');
                        localStorage.setItem('erg_posts', JSON.stringify(savedPosts));
                    }
                }
            }

            commentList.scrollTop = commentList.scrollHeight;
            showToast('Comentario publicado.', 'var(--accent-primary)');
        });
        
        commentInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') sendCommentBtn.click();
        });
    }

    // --- Create Community Logic ---
    const btnUploadComAvatar = document.getElementById('btnUploadComAvatar');
    const inputComAvatar = document.getElementById('inputComAvatar');
    const comAvatarPreviewContainer = document.getElementById('comAvatarPreviewContainer');
    const comAvatarPreviewImg = document.getElementById('comAvatarPreviewImg');
    const comAvatarFileName = document.getElementById('comAvatarFileName');
    const btnLaunchCommunity = document.getElementById('btnLaunchCommunity');
    
    // Community Form Elements
    const comFormName = document.getElementById('comFormName');
    const comFormCategory = document.getElementById('comFormCategory');
    const comFormDesc = document.getElementById('comFormDesc');
    
    let currentComAvatarData = null;
    let currentComBannerData = null;

    if(btnUploadComAvatar && inputComAvatar) {
        btnUploadComAvatar.addEventListener('click', () => inputComAvatar.click());
        inputComAvatar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    currentComAvatarData = ev.target.result;
                    comAvatarPreviewImg.src = currentComAvatarData;
                    comAvatarFileName.textContent = file.name;
                    comAvatarPreviewContainer.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const btnUploadComBanner = document.getElementById('btnUploadComBanner');
    const inputComBanner = document.getElementById('inputComBanner');
    const comBannerPreviewContainer = document.getElementById('comBannerPreviewContainer');
    const comBannerPreviewImg = document.getElementById('comBannerPreviewImg');
    const comBannerFileName = document.getElementById('comBannerFileName');

    if(btnUploadComBanner && inputComBanner) {
        btnUploadComBanner.addEventListener('click', () => inputComBanner.click());
        inputComBanner.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    currentComBannerData = ev.target.result;
                    comBannerPreviewImg.src = currentComBannerData;
                    comBannerFileName.textContent = file.name;
                    comBannerPreviewContainer.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    
    const loadCommunities = () => {
        const myComList = document.getElementById('myCommunitiesList');
        if(!myComList) return;
        
        const coms = JSON.parse(localStorage.getItem('erg_communities')) || [];
        if(coms.length > 0) {
            myComList.innerHTML = '';
            coms.forEach((com, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="sidebar-item custom-com-btn" data-target="visor-comunidad" data-comindex="${index}">
                    <img src="${com.avatar}" style="width: 20px; height: 20px; border-radius: 4px; object-fit: cover; margin-right: 8px;">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">${escapeHTML(com.name)}</span>
                </a>`;
                myComList.appendChild(li);
            });
            
            // Re-bind sidebar click logic for new elements
            const newComBtns = myComList.querySelectorAll('.custom-com-btn');
            newComBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
                    btn.classList.add('active');
                    
                    const targetId = btn.getAttribute('data-target');
                    openMDIWindow(targetId);
                    
                    // Populate Community Viewer
                    const cIndex = parseInt(btn.getAttribute('data-comindex'));
                    const cData = JSON.parse(localStorage.getItem('erg_communities'))[cIndex];
                    if(cData) {
                        document.getElementById('comViewName').textContent = cData.name;
                        document.getElementById('comViewCategory').textContent = cData.category;
                        document.getElementById('comViewDesc').textContent = cData.description;
                        document.getElementById('comViewAvatar').src = cData.avatar;
                        
                        if(cData.banner) {
                            document.getElementById('comViewCover').style.background = `url(${cData.banner}) center/cover no-repeat`;
                        } else {
                            const colors = ['linear-gradient(135deg, #0051ff, #9d00ff)', 'linear-gradient(135deg, #ff003c, #ff00e5)', 'linear-gradient(135deg, #0D8ABC, #00f3ff)', 'linear-gradient(135deg, #00ff88, #00bbff)'];
                            document.getElementById('comViewCover').style.background = colors[cIndex % colors.length];
                        }

                        window.currentActiveCommunityIndex = cIndex;
                        loadCommunityPosts(cIndex);
                    }
                });
            });
        }
    };
    loadCommunities();
    
    if(btnLaunchCommunity) {
        btnLaunchCommunity.addEventListener('click', () => {
            const nameStr = comFormName.value.trim();
            const catStr = comFormCategory.value.trim();
            const descStr = comFormDesc.value.trim();
            
            if(!nameStr || !catStr || !descStr) {
                showToast('Por favor llena todos los campos obligatorios para fundar la comunidad.', 'linear-gradient(135deg, #ff4d4d, #ff003c)');
                return;
            }
            
            const defAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameStr)}&background=2A2D35&color=00f3ff&font-size=0.4`;
            const comData = {
                name: nameStr,
                category: catStr,
                description: descStr,
                avatar: currentComAvatarData || defAvatar,
                banner: currentComBannerData
            };
            
            const coms = JSON.parse(localStorage.getItem('erg_communities')) || [];
            coms.push(comData);
            
            try {
                localStorage.setItem('erg_communities', JSON.stringify(coms));
                showToast(`¡Comunidad "${nameStr}" fundada con éxito!`, 'linear-gradient(135deg, var(--accent-primary), #00bbff)');
                
                comFormName.value = '';
                comFormCategory.value = '';
                comFormDesc.value = '';
                
                currentComAvatarData = null;
                comAvatarPreviewContainer.style.display = 'none';
                if(inputComAvatar) inputComAvatar.value = '';

                currentComBannerData = null;
                if(comBannerPreviewContainer) comBannerPreviewContainer.style.display = 'none';
                if(inputComBanner) inputComBanner.value = '';
                
                loadCommunities();
                
                // Simular click en la comunidad recién creada
                setTimeout(() => {
                    const newlyCreatedBtn = document.querySelector(`.custom-com-btn[data-comindex="${coms.length - 1}"]`);
                    if(newlyCreatedBtn) newlyCreatedBtn.click();
                }, 100);
            } catch(e) {
                showToast('Error: Ocupa demasiada memoria interna.', '#ff4d4d');
            }
        });
    }

    const loadCommunityPosts = (cIndex) => {
        const comWallContainer = document.getElementById('comWallContainer');
        const emptyState = document.getElementById('comWallEmptyState');
        if(!comWallContainer) return;

        // Limpiar posts existentes
        comWallContainer.querySelectorAll('.post-card:not(.community-post-never-remove)').forEach(p => p.remove());

        const comPosts = JSON.parse(localStorage.getItem('erg_com_posts')) || [];
        const filtered = comPosts.filter(p => p.communityIndex === cIndex);

        if (filtered.length > 0) {
            if (emptyState) emptyState.style.display = 'none';
            filtered.forEach(p => {
                comWallContainer.insertAdjacentHTML('beforeend', p.html);
            });
        } else {
            if (emptyState) emptyState.style.display = 'flex';
        }
    };

    const btnComPublish = document.getElementById('btnComPublish');
    const comPostTextArea = document.getElementById('comPostTextArea');

    if (btnComPublish && comPostTextArea) {
        btnComPublish.addEventListener('click', () => {
            const text = comPostTextArea.value.trim();
            if(!text) {
                showToast('Escribe algo para la comunidad.', '#ff4d4d');
                return;
            }

            const cIndex = window.currentActiveCommunityIndex;
            if(cIndex === undefined) return;

            const postHTML = `
                <article class="post-card community-post" style="animation: toastSlideIn 0.4s ease forwards; background: var(--bg-secondary); border: 1px solid var(--border-subtle); margin-top: 15px;">
                    <div class="post-header">
                        <img src="${currentProfile.avatar}" alt="User" class="post-avatar" style="object-fit: cover;">
                        <div class="post-info">
                            <h3>${escapeHTML(currentProfile.name)}</h3>
                            <span>Justo ahora • <i class="fa-solid fa-users"></i></span>
                        </div>
                        <div class="dropdown-wrapper" style="margin-left: auto;">
                            <button class="icon-btn post-options-btn"><i class="fa-solid fa-ellipsis"></i></button>
                            <div class="dropdown-menu" style="right: 0; left: auto; top: 100%; min-width: 120px;">
                                <div class="dropdown-item delete-post-btn" style="color: #ff4d4d;"><i class="fa-solid fa-trash-can"></i> Eliminar</div>
                            </div>
                        </div>
                    </div>
                    <div class="post-content">
                        <p style="margin-bottom: 5px;">${escapeHTML(text).replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="post-footer">
                        <button class="action-btn like-btn"><i class="fa-regular fa-heart"></i> <span>0</span></button>
                        <button class="action-btn comment-btn"><i class="fa-regular fa-comment"></i> <span>0</span></button>
                        <button class="action-btn share-btn"><i class="fa-solid fa-share-nodes"></i> Compartir</button>
                    </div>
                </article>
            `;

            let comPosts = JSON.parse(localStorage.getItem('erg_com_posts')) || [];
            comPosts.unshift({
                communityIndex: cIndex,
                html: postHTML.replace('animation: toastSlideIn 0.4s ease forwards;', '')
            });
            
            try {
                localStorage.setItem('erg_com_posts', JSON.stringify(comPosts));
                comPostTextArea.value = '';
                showToast('¡Publicación en la comunidad exitosa!', 'linear-gradient(135deg, var(--accent-primary), #0051ff)');
                loadCommunityPosts(cIndex);
            } catch(e) {
                showToast('Error de almacenamiento.', '#ff4d4d');
            }
        });
    }

    // Chat Modal Logic
    const chatBtn = document.getElementById('openChatBtn');
    const chatModal = document.getElementById('chatModal');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (chatBtn && chatModal && closeChatBtn) {
        chatBtn.addEventListener('click', () => chatModal.classList.toggle('active'));
        closeChatBtn.addEventListener('click', () => chatModal.classList.remove('active'));
    }

    // --- Draggable Modals Logic ---
    function makeDraggable(modal) {
        if (!modal) return;
        const header = modal.querySelector('.chat-header');
        if (!header) return;
        
        header.style.cursor = 'grab';
        
        let isDragging = false;
        let startX, startY;
        let initialLeft, initialTop;

        const onMouseDown = (e) => {
            // No arrastrar si se hace clic en un botón (ej. cerrar)
            if (e.target.closest('button')) return;
            
            isDragging = true;
            header.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            
            // Forzar las coordenadas a absolutas left/top
            const rect = modal.getBoundingClientRect();
            modal.style.left = rect.left + 'px';
            modal.style.top = rect.top + 'px';
            modal.style.right = 'auto'; // Anular right default del CSS
            modal.style.bottom = 'auto';
            
            initialLeft = rect.left;
            initialTop = rect.top;
            
            // Traer al frente
            document.querySelectorAll('.chat-modal').forEach(m => m.style.zIndex = 2000);
            modal.style.zIndex = 2001;
            
            e.preventDefault(); // Prevenir selección de texto
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            modal.style.left = (initialLeft + dx) + 'px';
            modal.style.top = (initialTop + dy) + 'px';
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
                
                // Guardar posición
                const pos = { left: modal.style.left, top: modal.style.top };
                try {
                    localStorage.setItem(`erg_${modal.id}_pos`, JSON.stringify(pos));
                } catch(e) {}
            }
        };

        header.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        // Restaurar posición guardada
        try {
            const savedPos = JSON.parse(localStorage.getItem(`erg_${modal.id}_pos`));
            if (savedPos && savedPos.left && savedPos.top) {
                modal.style.left = savedPos.left;
                modal.style.top = savedPos.top;
                modal.style.right = 'auto';
                modal.style.bottom = 'auto';
            }
        } catch(e) {}
    };

    // Logic for visor-comunidad static header
    const visorComunidad = document.getElementById('visor-comunidad');
    if (visorComunidad) {
        
        visorComunidad.querySelector('.window-close-btn').addEventListener('click', () => {
             visorComunidad.classList.remove('active');
             visorComunidad.classList.remove('floating-window');
             visorComunidad.classList.remove('minimized');
             
             // Volver a Principal para evitar una pantalla en blanco
             const hasActive = Array.from(document.querySelectorAll('.feed-section:not(#visor-comunidad)')).some(s => s.classList.contains('active'));
             if(!hasActive) {
                 const pTab = document.querySelector('.sidebar-item[data-target="principal"]');
                 if(pTab) pTab.click();
             }
        });

        const minimizeBtn = visorComunidad.querySelector('.window-minimize-btn');
        minimizeBtn.addEventListener('click', () => {
             visorComunidad.classList.toggle('minimized');
             const icon = minimizeBtn.querySelector('i');
             if (visorComunidad.classList.contains('minimized')) {
                 icon.className = 'fa-regular fa-square';
             } else {
                 icon.className = 'fa-solid fa-minus';
             }
        });

        makeDraggable(visorComunidad);
        
        visorComunidad.addEventListener('mousedown', () => {
            document.querySelectorAll('.floating-window, .chat-modal').forEach(m => {
                if(parseInt(m.style.zIndex || 1000) >= 2001) m.style.zIndex = 1000; 
            });
            visorComunidad.style.zIndex = 2005;
        });
    }

    // Clean up generic headers from other sections if they got injected in the previous step
    document.querySelectorAll('.feed-section:not(#visor-comunidad)').forEach(sec => {
        sec.style = ''; // clear absolutes if any
        sec.querySelectorAll('.chat-header.window-drag-handle').forEach(h => h.remove());
    });

    document.querySelectorAll('.chat-modal').forEach(modal => {
        makeDraggable(modal);
        modal.addEventListener('mousedown', () => {
            document.querySelectorAll('.floating-window, .chat-modal').forEach(m => {
                if(parseInt(m.style.zIndex || 1000) >= 2001) m.style.zIndex = 1000; 
            });
            modal.style.zIndex = 2005;
        });
    });

    // =========================================================
    // MODULO ACADEMIA GAMER (BACKEND EXPRESS EN PUERTO 3000)
    // =========================================================
    const API_BASE = "http://localhost:3000";
    const backendStatusBadge = document.getElementById('backendStatusBadge');
    const statusLabel = document.getElementById('statusLabel');
    const studentsListGrid = document.getElementById('studentsListGrid');
    const studentCountBadge = document.getElementById('studentCountBadge');
    const formAddStudent = document.getElementById('formAddStudent');
    const studentSearchInput = document.getElementById('studentSearchInput');
    const btnSearchStudent = document.getElementById('btnSearchStudent');
    const btnReloadStudents = document.getElementById('btnReloadStudents');

    // Modals
    const editStudentModal = document.getElementById('editStudentModal');
    const closeEditStudentModal = document.getElementById('closeEditStudentModal');
    const cancelEditStudentBtn = document.getElementById('cancelEditStudentBtn');
    const formEditStudent = document.getElementById('formEditStudent');

    // Helper: Rank CSS class
    const getRankClass = (rank) => {
        if (!rank) return 'rank-iniciado';
        const r = rank.toLowerCase().replace(/\s+/g, '-');
        return `rank-${r}`;
    };

    // Verificar Estado del Servidor
    const checkBackendStatus = async () => {
        if (!backendStatusBadge) return false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(`${API_BASE}/estudiantes`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                backendStatusBadge.className = 'backend-status-badge status-online';
                if (statusLabel) statusLabel.textContent = 'Backend Online (Puerto 3000)';
                return true;
            } else {
                throw new Error('Status not ok');
            }
        } catch (err) {
            backendStatusBadge.className = 'backend-status-badge status-offline';
            if (statusLabel) statusLabel.textContent = 'Backend Desconectado';
            return false;
        }
    };

    // Renderizar tarjetas de estudiantes
    const renderStudents = (students) => {
        if (!studentsListGrid) return;

        if (studentCountBadge) {
            studentCountBadge.textContent = students ? students.length : 0;
        }

        if (!students || students.length === 0) {
            studentsListGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
                    <i class="fa-solid fa-gamepad empty-icon" style="font-size: 40px; margin-bottom: 12px; color: var(--accent-primary);"></i>
                    <h3 style="margin-bottom: 5px; color: var(--text-primary);">No hay estudiantes registrados</h3>
                    <p style="color: var(--text-secondary); font-size: 13px;">Recluta nuevos jugadores con el formulario superior.</p>
                </div>
            `;
            return;
        }

        studentsListGrid.innerHTML = students.map(student => {
            const rankClass = getRankClass(student.rango);
            const avatarUrl = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.nombre)}&background=random`;
            const juegoDisplay = student.juego || 'General Gaming';
            
            return `
                <article class="student-card" data-student-id="${student.id}">
                    <div class="student-card-top">
                        <img src="${avatarUrl}" alt="${escapeHTML(student.nombre)}" class="student-card-avatar">
                        <div class="student-card-meta">
                            <h4 class="student-card-name" title="${escapeHTML(student.nombre)}">${escapeHTML(student.nombre)}</h4>
                            <span class="rank-tag ${rankClass}">${escapeHTML(student.rango || 'Iniciado')}</span>
                        </div>
                    </div>
                    <div class="student-card-body">
                        <div class="student-info-row">
                            <i class="fa-solid fa-id-badge"></i>
                            <span>ID #${student.id} • ${student.edad} años</span>
                        </div>
                        <div class="student-info-row">
                            <i class="fa-solid fa-envelope"></i>
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHTML(student.correo)}</span>
                        </div>
                        <div class="student-info-row">
                            <i class="fa-solid fa-gamepad" style="color: var(--accent-secondary);"></i>
                            <span>${escapeHTML(juegoDisplay)}</span>
                        </div>
                    </div>
                    <div class="student-card-actions">
                        <button class="btn-student-action btn-edit" data-id="${student.id}">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button class="btn-student-action btn-delete" data-id="${student.id}">
                            <i class="fa-solid fa-trash-can"></i> Retirar
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        // Listeners para botones de editar y eliminar
        studentsListGrid.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const student = students.find(s => s.id == id);
                if (student && editStudentModal) {
                    document.getElementById('editStudentId').value = student.id;
                    document.getElementById('editStudentName').value = student.nombre;
                    document.getElementById('editStudentAge').value = student.edad;
                    document.getElementById('editStudentEmail').value = student.correo;
                    document.getElementById('editStudentRank').value = student.rango || 'Diamante';
                    document.getElementById('editStudentGame').value = student.juego || '';
                    editStudentModal.classList.add('active');
                }
            });
        });

        studentsListGrid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm(`¿Estás seguro de eliminar al estudiante #${id}?`)) {
                    try {
                        const res = await fetch(`${API_BASE}/estudiantes/${id}`, { method: 'DELETE' });
                        const data = await res.json();
                        if (res.ok) {
                            showToast(data.mensaje || 'Estudiante eliminado.', '#ff4d4d');
                            loadStudents();
                        } else {
                            showToast(data.error || 'Error al eliminar', '#ff4d4d');
                        }
                    } catch (err) {
                        showToast('Error de conexión con el backend Express.', '#ff4d4d');
                    }
                }
            });
        });
    };

    // Cargar lista completa de estudiantes (GET /estudiantes)
    const loadStudents = async () => {
        const isOnline = await checkBackendStatus();
        if (!isOnline) {
            if (studentsListGrid) {
                studentsListGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1; padding: 40px 20px; text-align: center;">
                        <i class="fa-solid fa-triangle-exclamation empty-icon" style="font-size: 40px; margin-bottom: 12px; color: #ff4d4d;"></i>
                        <h3 style="margin-bottom: 5px; color: #ff4d4d;">Backend Desconectado</h3>
                        <p style="color: var(--text-secondary); font-size: 13px;">Asegúrate de ejecutar <code>node server.js</code> o <code>npm start</code> en la terminal.</p>
                    </div>
                `;
            }
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/estudiantes`);
            if (res.ok) {
                const students = await res.json();
                renderStudents(students);
            }
        } catch (err) {
            console.error('[ERG-ACADEMIA] Error al cargar estudiantes:', err);
        }
    };

    // Registrar nuevo estudiante (POST /estudiantes)
    if (formAddStudent) {
        formAddStudent.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('studentNameInput').value.trim();
            const edad = document.getElementById('studentAgeInput').value;
            const correo = document.getElementById('studentEmailInput').value.trim();
            const rango = document.getElementById('studentRankInput').value;
            const juego = document.getElementById('studentGameInput').value.trim() || 'General Gaming';

            try {
                const res = await fetch(`${API_BASE}/estudiantes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, edad, correo, rango, juego })
                });

                const data = await res.json();
                if (res.ok) {
                    showToast(data.mensaje || '¡Estudiante registrado con éxito!', 'linear-gradient(135deg, var(--accent-primary), #00bbff)');
                    formAddStudent.reset();
                    loadStudents();
                } else {
                    showToast(data.error || 'Error al registrar', '#ff4d4d');
                }
            } catch (err) {
                showToast('Error de conexión con el backend Express.', '#ff4d4d');
            }
        });
    }

    // Modal de edición de estudiante (PUT /estudiantes/:id)
    if (closeEditStudentModal) {
        closeEditStudentModal.addEventListener('click', () => editStudentModal.classList.remove('active'));
    }
    if (cancelEditStudentBtn) {
        cancelEditStudentBtn.addEventListener('click', () => editStudentModal.classList.remove('active'));
    }

    if (formEditStudent) {
        formEditStudent.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editStudentId').value;
            const nombre = document.getElementById('editStudentName').value.trim();
            const edad = document.getElementById('editStudentAge').value;
            const correo = document.getElementById('editStudentEmail').value.trim();
            const rango = document.getElementById('editStudentRank').value;
            const juego = document.getElementById('editStudentGame').value.trim();

            try {
                const res = await fetch(`${API_BASE}/estudiantes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, edad, correo, rango, juego })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast(data.mensaje || 'Estudiante actualizado con éxito.', 'linear-gradient(135deg, var(--accent-primary), #00ff88)');
                    editStudentModal.classList.remove('active');
                    loadStudents();
                } else {
                    showToast(data.error || 'Error al actualizar', '#ff4d4d');
                }
            } catch (err) {
                showToast('Error de conexión con el backend.', '#ff4d4d');
            }
        });
    }

    // Búsqueda en la Academia (GET /buscar?termino=...)
    const executeStudentSearch = async () => {
        if (!studentSearchInput) return;
        const query = studentSearchInput.value.trim();

        try {
            const url = query ? `${API_BASE}/buscar?termino=${encodeURIComponent(query)}` : `${API_BASE}/estudiantes`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.resultados || []);
                renderStudents(list);
                if (query) {
                    showToast(`Búsqueda: ${list.length} coincidencia(s)`, 'linear-gradient(135deg, var(--accent-primary), #0051ff)');
                }
            }
        } catch (err) {
            console.error('[ERG-ACADEMIA] Error en búsqueda:', err);
        }
    };

    if (btnSearchStudent) {
        btnSearchStudent.addEventListener('click', executeStudentSearch);
    }
    if (studentSearchInput) {
        studentSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeStudentSearch();
            }
        });
    }
    if (btnReloadStudents) {
        btnReloadStudents.addEventListener('click', () => {
            if (studentSearchInput) studentSearchInput.value = '';
            loadStudents();
            showToast('Lista de estudiantes actualizada.', 'var(--accent-primary)');
        });
    }

    // Inicializar comprobación de backend y carga cuando se navega a la sección
    document.querySelectorAll('.sidebar-item[data-target="estudiantes"]').forEach(item => {
        item.addEventListener('click', () => {
            loadStudents();
        });
    });

    // Carga inicial
    checkBackendStatus();
});

