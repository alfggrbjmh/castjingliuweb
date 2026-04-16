// Konfigurasi Firebase Realtime Database
// Ganti bagian ini dengan konfigurasi asli dari Firebase Console Anda
const firebaseConfig = {
    apiKey: "GANTI_API_KEY",
    authDomain: "GANTI.firebaseapp.com",
    databaseURL: "https://GANTI-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "GANTI_PROJECT_ID",
    storageBucket: "GANTI.appspot.com",
    messagingSenderId: "GANTI",
    appId: "GANTI"
};

// Inisialisasi Firebase
window.isFirebaseSetup = firebaseConfig.apiKey !== "GANTI_API_KEY";
window.currentPostsList = window.currentPostsList || [];

if (window.isFirebaseSetup) {
    firebase.initializeApp(firebaseConfig);
    window.fbDB = firebase.database();
    window.postsRef = window.fbDB.ref('posts');
} else {
    window.fbDB = null;
    window.postsRef = null;
}

console.log(window.isFirebaseSetup ? "Firebase Cloud Aktif" : "Mode Lokal Aktif");

// ==========================================
// === LOGIKA INTI SOSIAL & INTERAKSI ===
// ==========================================

// 0. Fungsi Posting Utama (Dipindah ke sini agar aman)
window.submitPost = function() {
    const textArea = document.getElementById('postInputText');
    const activeUser = JSON.parse(localStorage.getItem('activeUser'));
    if (!activeUser) return;
    
    const textContent = textArea.value.trim();
    const pendingImage = window.pendingImage; // Diambil dari global
    const pendingLink = window.pendingLink;

    if (!textContent && !pendingImage && !pendingLink) {
        showToast('Tuliskan sesuatu dulu!', true);
        return;
    }

    const cleanContent = textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (window.isFirebaseSetup) {
        const submitBtn = document.getElementById('submitPostBtn');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Memposting...'; }

        postsRef.push({
            authorName: activeUser.username,
            authorAvatar: activeUser.avatar || '',
            content: cleanContent,
            image: pendingImage || null,
            link: pendingLink || null,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            likedBy: {},
            comments: {}
        }).then(() => {
            textArea.value = '';
            if (window.clearAttachments) window.clearAttachments();
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = 'Posting'; }
            showToast('Postingan dikirim!');
        });
    } else {
        let localDB = JSON.parse(localStorage.getItem('postsDB')) || [];
        const newLocalPost = {
            firebaseKey: 'local-' + Date.now(),
            authorName: activeUser.username,
            content: cleanContent,
            image: pendingImage || null,
            link: pendingLink || null,
            timestamp: Date.now(),
            likedBy: {},
            comments: {}
        };
        localDB.unshift(newLocalPost);
        localStorage.setItem('postsDB', JSON.stringify(localDB));
        textArea.value = '';
        if (window.clearAttachments) window.clearAttachments();
        if (window.renderPosts) window.renderPosts(localDB);
        showToast('Berhasil (Mode Lokal)');
    }
};

// 1. Notifikasi Toast Custom
window.showToast = function(message, isError = false) {
    const toast = document.createElement('div');
    const icon = isError ? '<i class="ph-fill ph-warning-circle" style="color:#ea4335; font-size:24px;"></i>' : '<i class="ph-fill ph-check-circle" style="color:var(--primary-teal); font-size:24px;"></i>';
    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
            ${icon}
            <span style="font-size:14px; font-weight:600; color:var(--text-dark);">${message}</span>
        </div>
    `;
    toast.style.position = 'fixed';
    toast.style.bottom = '40px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.background = 'var(--white)';
    toast.style.padding = '16px 24px';
    toast.style.borderRadius = '50px';
    toast.style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)';
    toast.style.border = '1px solid rgba(106, 208, 201, 0.2)';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

// 2. Kontrol Menu Titik 3
window.toggleMenu = function(menuId) {
    const el = document.getElementById(menuId);
    if(!el) {
        console.error("Menu tidak ditemukan:", menuId);
        return;
    }
    
    // Simpan status sebelum ditutup semua
    const isNowVisible = el.style.display === 'block';
    
    // Tutup SEMUA menu yang sedang terbuka agar tidak tumpang tindih
    document.querySelectorAll('[id^="menu-"]').forEach(m => m.style.display = 'none');
    document.querySelectorAll('[id^="post-menu-"]').forEach(m => m.style.display = 'none');
    
    // Jika tadinya tertutup, sekarang buka
    if (!isNowVisible) {
        el.style.display = 'block';
        // Pastikan menu muncul di tumpukan paling atas
        el.style.zIndex = "1000";
    }
};

// 3. Fitur Bagikan (Share)
window.shareLink = function(authorName) {
    const usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];
    const user = usersDB.find(u => u.username === authorName);
    let urlToShare = window.location.origin + window.location.pathname + "?komunitas_castorice_dari=" + encodeURIComponent(authorName);
    
    if (user && user.socialLink && user.socialLink.trim() !== '') {
        urlToShare = user.socialLink;
    }

    function executeCopy(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Tautan (${text}) berhasil disalin!`);
            }).catch(() => fallbackCopy(text));
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(`Tautan (${text}) berhasil disalin!`);
        } catch (err) {
            showToast('Browser tidak mendukung salin otomatis.', true);
        }
        document.body.removeChild(textArea);
    }

    executeCopy(urlToShare);
    document.querySelectorAll('[id^="menu-"]').forEach(m => m.style.display = 'none');
    document.querySelectorAll('[id^="post-menu-"]').forEach(m => m.style.display = 'none');
};

// 4. Salin Komentar
window.copyComment = function(elementId) {
    const el = document.getElementById('comment-text-' + elementId);
    if(!el) return;
    const textToCopy = el.innerText;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast("Komentar disalin ke Clipboard!");
        }).catch(() => fallbackLegacyCopy(textToCopy));
    } else {
        fallbackLegacyCopy(textToCopy);
    }

    function fallbackLegacyCopy(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        showToast("Komentar disalin!");
        document.body.removeChild(textArea);
    }
    document.querySelectorAll('[id^="menu-"]').forEach(m => m.style.display = 'none');
};

// Listener klik luar untuk tutup menu
document.addEventListener('click', function (e) {
    if (!e.target.closest('.comment-menu') && !e.target.closest('.post-menu-wrapper')) {
        document.querySelectorAll('[id^="menu-"]').forEach(m => m.style.display = 'none');
        document.querySelectorAll('[id^="post-menu-"]').forEach(m => m.style.display = 'none');
    }
});

// 5. Fungsi Like (Hybrid)
window.toggleLike = function(firebaseKey) {
    const activeUser = JSON.parse(localStorage.getItem('activeUser'));
    if (!activeUser) {
        showToast('Silakan login untuk memberikan Like!', true);
        return;
    }

    if (window.isFirebaseSetup && window.postsRef) {
        const likeRef = window.postsRef.child(firebaseKey).child('likedBy').child(activeUser.username);
        likeRef.once('value').then(snap => {
            if (snap.val()) likeRef.remove();
            else likeRef.set(true);
        });
    } else {
        let localDB = JSON.parse(localStorage.getItem('postsDB')) || [];
        const idx = localDB.findIndex(p => p.firebaseKey === firebaseKey);
        if (idx > -1) {
            if (!localDB[idx].likedBy) localDB[idx].likedBy = {};
            if (localDB[idx].likedBy[activeUser.username]) delete localDB[idx].likedBy[activeUser.username];
            else localDB[idx].likedBy[activeUser.username] = true;
            localStorage.setItem('postsDB', JSON.stringify(localDB));
            if(window.renderPosts) window.renderPosts(localDB);
        }
    }
};

// 6. Kirim Komentar (Hybrid)
window.submitInlineComment = function(firebaseKey) {
    const activeUser = JSON.parse(localStorage.getItem('activeUser'));
    if (!activeUser) {
        showToast('Silakan login untuk berkomentar!', true);
        return;
    }
    const inputEl = document.getElementById('commentInput_' + firebaseKey);
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    const cleanText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (window.isFirebaseSetup && window.postsRef) {
        window.postsRef.child(firebaseKey).child('comments').push({
            author: activeUser.username,
            text: cleanText
        }).then(() => { inputEl.value = ''; });
    } else {
        let localDB = JSON.parse(localStorage.getItem('postsDB')) || [];
        const idx = localDB.findIndex(p => p.firebaseKey === firebaseKey);
        if (idx > -1) {
            if (!localDB[idx].comments) localDB[idx].comments = {};
            const cId = 'c-' + Date.now();
            localDB[idx].comments[cId] = { author: activeUser.username, text: cleanText };
            localStorage.setItem('postsDB', JSON.stringify(localDB));
            inputEl.value = '';
            if(window.renderPosts) window.renderPosts(localDB);
        }
    }
};

// 7. Fitur Edit Postingan
window.editPost = function(firebaseKey) {
    const postsList = window.currentPostsList || JSON.parse(localStorage.getItem('postsDB')) || [];
    const post = postsList.find(p => p.firebaseKey === firebaseKey);
    if (!post) return;
    
    const oldContent = (post.content || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    
    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'editPostModal';
    modalWrapper.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10,25,47,0.4); backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; opacity: 0; transition: opacity 0.2s ease-out;";
    modalWrapper.innerHTML = `
        <div style="background: white; width: 100%; max-width: 500px; border-radius: 16px; box-shadow: 0 32px 64px rgba(0,0,0,0.15); overflow: hidden; transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);" id="editModalBox">
            <div style="padding: 16px 24px; border-bottom: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; background: #f8fafb;">
                <h3 style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 800;"><i class="ph-bold ph-pencil-simple" style="color: #1aa39a; margin-right: 6px;"></i> Edit Postingan</h3>
                <button onclick="closeEditModal()" style="background: none; border: none; font-size: 20px; color: #64748b; cursor: pointer;"><i class="ph-bold ph-x"></i></button>
            </div>
            <div style="padding: 24px;">
                <textarea id="editPostTextarea" style="width: 100%; height: 140px; padding: 16px; border: 2px solid rgba(26,163,154,0.15); border-radius: 12px; font-family: inherit; font-size: 14px; outline: none; resize: none; background: #fcfcfc; box-sizing: border-box;"></textarea>
            </div>
            <div style="padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.05); display: flex; justify-content: flex-end; gap: 12px; background: #f8fafb;">
                <button onclick="closeEditModal()" style="padding: 10px 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-weight: 600;">Batal</button>
                <button id="saveEditBtn" style="padding: 10px 20px; background: #1aa39a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;"><i class="ph-bold ph-check"></i> Simpan</button>
            </div>
        </div>`;
    
    document.body.appendChild(modalWrapper);
    requestAnimationFrame(() => {
        modalWrapper.style.opacity = '1';
        document.getElementById('editModalBox').style.transform = 'translateY(0)';
    });

    const textarea = document.getElementById('editPostTextarea');
    textarea.value = oldContent;
    textarea.focus();

    document.getElementById('saveEditBtn').onclick = function () {
        const newText = textarea.value.trim();
        if (newText !== '') {
            const cleanNew = newText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (window.isFirebaseSetup && window.postsRef) {
                window.postsRef.child(firebaseKey).update({ content: cleanNew }).then(() => {
                    closeEditModal();
                    showToast('Postingan diperbarui!');
                });
            } else {
                let localDB = JSON.parse(localStorage.getItem('postsDB')) || [];
                const idx = localDB.findIndex(p => p.firebaseKey === firebaseKey);
                if (idx > -1) {
                    localDB[idx].content = cleanNew;
                    localStorage.setItem('postsDB', JSON.stringify(localDB));
                    closeEditModal();
                    if(window.renderPosts) window.renderPosts(localDB);
                    showToast('Update Lokal Berhasil');
                }
            }
        }
    };
};

window.closeEditModal = function() {
    const modal = document.getElementById('editPostModal');
    if (modal) {
        modal.style.opacity = '0';
        document.getElementById('editModalBox').style.transform = 'translateY(20px)';
        setTimeout(() => modal.remove(), 200);
    }
};

// 8. Fitur Hapus Postingan
window.deletePost = function(firebaseKey) {
    if (confirm('Hapus postingan ini secara permanen?')) {
        if (window.isFirebaseSetup && window.postsRef) {
            window.postsRef.child(firebaseKey).remove().then(() => showToast('Terhapus dari Cloud'));
        } else {
            let localDB = JSON.parse(localStorage.getItem('postsDB')) || [];
            const filtered = localDB.filter(p => p.firebaseKey !== firebaseKey);
            localStorage.setItem('postsDB', JSON.stringify(filtered));
            showToast('Terhapus secara lokal');
            if(window.renderPosts) window.renderPosts(filtered);
        }
    }
};

// 9. Fitur Hapus Komentar
window.deleteComment = function(firebaseKey, commentKey) {
    if (confirm('Hapus komentar ini?')) {
        if (window.isFirebaseSetup && window.postsRef) {
            window.postsRef.child(firebaseKey).child('comments').child(commentKey).remove().then(() => showToast('Komentar terhapus'));
        } else {
            let localDB = JSON.parse(localStorage.getItem('postsDB')) || [];
            const idx = localDB.findIndex(p => p.firebaseKey === firebaseKey);
            if (idx > -1 && localDB[idx].comments) {
                delete localDB[idx].comments[commentKey];
                localStorage.setItem('postsDB', JSON.stringify(localDB));
                if(window.renderPosts) window.renderPosts(localDB);
                showToast('Komentar terhapus lokal');
            }
        }
    }
};
