// Neon theme interactivity for GEVSIDE enviewmen
let discoveries = JSON.parse(localStorage.getItem('discoveries') || '[]');
let chatMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
let aiChatMessages = JSON.parse(localStorage.getItem('aiChatMessages') || '[]');
let devCollaborators = JSON.parse(localStorage.getItem('devCollaborators') || '[]');

// Like & star state per discovery (by index, stored in localStorage)
// Format: { [index]: { count: number, users: { [userId]: true } } }
let discoveryLikes = JSON.parse(localStorage.getItem('discoveryLikes') || '{}');
let discoveryStars = JSON.parse(localStorage.getItem('discoveryStars') || '{}');

// Helper: get userId (per browser, simple)
function getUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
        id = 'u-' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('userId', id);
    }
    return id;
}
const userId = getUserId();

function saveDiscoveries() {
    localStorage.setItem('discoveries', JSON.stringify(discoveries));
}
function saveChatMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
}
function saveAIChatMessages() {
    localStorage.setItem('aiChatMessages', JSON.stringify(aiChatMessages));
}
function saveDevCollaborators() {
    localStorage.setItem('devCollaborators', JSON.stringify(devCollaborators));
}
function saveDiscoveryLikes() {
    localStorage.setItem('discoveryLikes', JSON.stringify(discoveryLikes));
}
function saveDiscoveryStars() {
    localStorage.setItem('discoveryStars', JSON.stringify(discoveryStars));
}

function renderDiscoveries(list = discoveries) {
    const container = document.getElementById('discoveries');
    container.innerHTML = '';
    list.forEach((d, i) => {
        // Like/star state for this discovery
        const likeObj = discoveryLikes[i] || { count: 0, users: {} };
        const starObj = discoveryStars[i] || { count: 0, users: {} };
        const liked = !!likeObj.users?.[userId];
        const starred = !!starObj.users?.[userId];
        // Only allow delete if this user is the author (by userId)
        const isOwner = d.userId === userId;
        // Tentukan apakah ada media
        const hasMedia = !!d.media;
        // Batasi panjang konten sebelum tombol "Selengkapnya"
        const MAX_CONTENT = 180;
        let showMore = false;
        let shortContent = d.content;
        if (d.content.length > MAX_CONTENT) {
            showMore = true;
            shortContent = d.content.slice(0, MAX_CONTENT) + '...';
        }
        // Buat elemen discovery
        const el = document.createElement('div');
        el.className = 'discovery' + (hasMedia ? '' : ' discovery-large');
        el.innerHTML = `
            <div class="author">${d.author}</div>
            <div class="timestamp">${d.timestamp}</div>
            <div class="discovery-name"><b>${d.name}</b></div>
            <div class="content">
                <span class="discovery-content-text">${showMore ? shortContent : d.content}</span>
                ${showMore ? `<button class="show-more-btn" data-index="${i}" style="background:none;border:none;color:#00c3ff;cursor:pointer;font-size:0.97em;padding:0 0.3em;">Selengkapnya</button>` : ''}
            </div>
            ${hasMedia ? `<div class="media">${d.mediaType && d.mediaType.startsWith('image') 
                ? `<img src="${d.media}" alt="media discovery">`
                : `<video controls src="${d.media}"></video>`}</div>` : ''}
            <div class="discovery-actions">
                <button class="discovery-like-btn${liked ? ' liked' : ''}" data-index="${i}" title="Suka">
                    ❤️ <span class="discovery-like-count">${Object.keys(likeObj.users || {}).length}</span>
                </button>
                <button class="discovery-star-btn${starred ? ' starred' : ''}" data-index="${i}" title="Beri Bintang">
                    ⭐ <span class="discovery-star-count">${Object.keys(starObj.users || {}).length}</span>
                </button>
                <button class="discovery-share-btn" data-index="${i}" title="Bagikan">
                    🔗
                </button>
                ${isOwner ? `<button class="delete-discovery" data-index="${i}">Hapus</button>` : ''}
            </div>
        `;
        container.appendChild(el);
    });
    // Hapus penemuan (hanya milik sendiri)
    container.querySelectorAll('.delete-discovery').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.index;
            if (discoveries[idx].userId !== userId) return;
            discoveries.splice(idx, 1);
            delete discoveryLikes[idx];
            delete discoveryStars[idx];
            saveDiscoveries();
            saveDiscoveryLikes();
            saveDiscoveryStars();
            renderDiscoveries();
        };
    });
    // Like toggle (1x per user, bisa batal)
    container.querySelectorAll('.discovery-like-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const idx = this.dataset.index;
            let likeObj = discoveryLikes[idx] || { count: 0, users: {} };
            if (!likeObj.users[userId]) {
                likeObj.users[userId] = true;
            } else {
                delete likeObj.users[userId];
            }
            discoveryLikes[idx] = likeObj;
            saveDiscoveryLikes();
            renderDiscoveries();
        };
    });
    // Star toggle (1x per user, bisa batal)
    container.querySelectorAll('.discovery-star-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const idx = this.dataset.index;
            let starObj = discoveryStars[idx] || { count: 0, users: {} };
            if (!starObj.users[userId]) {
                starObj.users[userId] = true;
            } else {
                delete starObj.users[userId];
            }
            discoveryStars[idx] = starObj;
            saveDiscoveryStars();
            renderDiscoveries();
        };
    });
    // Bagikan (Share)
    container.querySelectorAll('.discovery-share-btn').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const idx = this.dataset.index;
            const d = discoveries[idx];
            let shareText = `Penemuan: ${d.name}\nOleh: ${d.author}\n${d.content}`;
            if (d.media && d.mediaType && d.mediaType.startsWith('image')) {
                shareText += `\n[Gambar terlampir]`;
            } else if (d.media && d.mediaType && d.mediaType.startsWith('video')) {
                shareText += `\n[Video terlampir]`;
            }
            const url = window.location.href.split('#')[0];
            // Web Share API
            if (navigator.share) {
                navigator.share({
                    title: d.name,
                    text: shareText,
                    url: url
                }).catch(() => {});
            } else {
                // Fallback: copy to clipboard
                const textToCopy = `${shareText}\n${url}`;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        alert('Teks penemuan berhasil disalin! Silakan bagikan ke teman Anda.');
                    });
                } else {
                    // Fallback manual
                    prompt('Salin dan bagikan penemuan ini:', textToCopy);
                }
            }
        };
    });
    // "Selengkapnya" logic
    container.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.index;
            const parent = this.closest('.content');
            if (parent) {
                parent.querySelector('.discovery-content-text').textContent = discoveries[idx].content;
                this.style.display = 'none';
            }
        };
    });
}

function renderSearchResults(results) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    if (results.length === 0) {
        container.innerHTML = '<div style="color:#ff005c">Tidak ditemukan penemuan dengan nama tersebut.</div>';
        return;
    }
    results.forEach((d, i) => {
        const isOwner = d.userId === userId;
        const el = document.createElement('div');
        el.className = 'discovery';
        el.innerHTML = `
            <div class="author">${d.author}</div>
            <div class="timestamp">${d.timestamp}</div>
            <div class="discovery-name"><b>${d.name}</b></div>
            <div class="content">${d.content}</div>
            ${d.media ? `<div class="media">${d.mediaType && d.mediaType.startsWith('image') 
                ? `<img src="${d.media}" alt="media discovery">`
                : `<video controls src="${d.media}"></video>`}</div>` : ''}
            ${isOwner ? `<button class="delete-discovery" data-index="${discoveries.indexOf(d)}">Hapus</button>` : ''}
        `;
        container.appendChild(el);
    });
    // Hapus penemuan dari hasil pencarian (hanya milik sendiri)
    container.querySelectorAll('.delete-discovery').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.index;
            if (discoveries[idx].userId !== userId) return;
            discoveries.splice(idx, 1);
            saveDiscoveries();
            renderDiscoveries();
            document.getElementById('searchBtn').click();
        };
    });
}

function renderChat() {
    const chat = document.getElementById('chatMessages');
    chat.innerHTML = '';
    chatMessages.forEach((m, i) => {
        // Only allow delete if this user is the sender (by userId)
        const isOwner = m.userId === userId;
        chat.innerHTML += `<div>
            <b style="color:#a100ff">${m.user}:</b> <span style="color:#fff">${m.text}</span>
            ${isOwner ? `<button class="delete-chat" data-index="${i}" style="margin-left:1rem;font-size:0.9em;">Hapus</button>` : ''}
        </div>`;
    });
    chat.querySelectorAll('.delete-chat').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.index;
            if (chatMessages[idx].userId !== userId) return;
            chatMessages.splice(idx, 1);
            saveChatMessages();
            renderChat();
        };
    });
    chat.scrollTop = chat.scrollHeight;
}

function renderAIChat() {
    const chat = document.getElementById('aiChatMessages');
    chat.innerHTML = '';
    aiChatMessages.forEach((m, i) => {
        const el = document.createElement('div');
        el.innerHTML = `<b style="color:#00c3ff">${m.user}:</b> <span style="color:#fff">${m.text}</span>
            <button class="delete-ai-chat" data-index="${i}" style="margin-left:1rem;font-size:0.9em;">Hapus</button>`;
        chat.appendChild(el);
    });
    chat.querySelectorAll('.delete-ai-chat').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.index;
            aiChatMessages.splice(idx, 1);
            saveAIChatMessages();
            renderAIChat();
        };
    });
    chat.scrollTop = chat.scrollHeight;
}

function renderDevCollaborators() {
    const devCards = document.getElementById('devCards');
    // Remove all except the form
    Array.from(devCards.querySelectorAll('.dev-card')).forEach(card => {
        if (!card.classList.contains('dev-form-card')) card.remove();
    });
    devCollaborators.forEach((dev, i) => {
        const devCard = document.createElement('div');
        devCard.className = 'dev-card';
        devCard.innerHTML = `
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=00c3ff&color=fff" alt="${dev.name}">
            <div class="dev-info">
                <span class="dev-name">${dev.name}</span>
                <span class="dev-role">${dev.role}</span>
                <a class="dev-contact" href="https://instagram.com/${dev.contact.replace(/^@/, '')}" target="_blank" rel="noopener">
                    @${dev.contact.replace(/^@/, '')}
                </a>
                <button class="delete-dev" data-index="${i}" style="margin-top:0.5rem;">Hapus</button>
            </div>
        `;
        devCards.insertBefore(devCard, document.getElementById('devForm'));
    });
    devCards.querySelectorAll('.delete-dev').forEach(btn => {
        btn.onclick = function() {
            const idx = +this.dataset.index;
            devCollaborators.splice(idx, 1);
            saveDevCollaborators();
            renderDevCollaborators();
        };
    });
}

// Knowledge base AI diperluas untuk ratusan pertanyaan pengetahuan umum dari berbagai cabang ilmu
const aiKnowledgeBase = {
    // Tanya jawab ringan medsos
    "siapa yang menciptakan ini": "Saya di ciptakan oleh pelajar yang sangat ahli dalam bidang IT. Beliau adalah IGEDE ADIATMIKA.",
    "siapa yang menciptakan anda": "i gede adiatmika yang menciptakan saya seorang diri, ia menggunakan berbagai experiment dan pendalaman mekanis sistem saya secara mendalam.",
    "Siapa yang menciptakan anda": "i gede adiatmika yang menciptakan saya seorang diri, ia menggunakan berbagai experiment dan pendalaman mekanis sistem saya secara mendalam.",
    "kenapa followers turun": "Followers bisa turun karena akun tidak aktif, konten kurang menarik, atau ada yang menghapus/memblokir akun.",
    "kenapa story tidak bisa dibuka": "Coba update aplikasi, cek koneksi internet, atau logout dan login kembali.",
    "kenapa akun diblokir": "Akun bisa diblokir jika melanggar aturan komunitas atau sering melakukan aktivitas mencurigakan.",
    "kenapa tidak bisa upload foto": "Pastikan koneksi internet stabil, aplikasi sudah update, dan format file didukung.",
    "kenapa tidak bisa login": "Cek username/password, pastikan tidak ada masalah server, dan coba reset password jika lupa.",
    // Bahasa gaul/simpel
    "kenapa pesawat bisa terbang": "Pesawat bisa terbang karena sayapnya menciptakan gaya angkat saat bergerak cepat di udara.",
    "kenapa pesawat terbang": "Pesawat bisa terbang karena sayapnya menciptakan gaya angkat saat bergerak cepat di udara.",
    "kenapa pesawat bisa terbang?": "Pesawat bisa terbang karena sayapnya menciptakan gaya angkat saat bergerak cepat di udara.",
    "kenapa langit biru?": "Langit terlihat biru karena cahaya matahari tersebar oleh partikel di atmosfer, terutama cahaya biru yang memiliki panjang gelombang lebih pendek.",
    "kenapa air laut asin?": "Air laut asin karena mengandung garam yang berasal dari batuan dan mineral yang terlarut saat air mengalir ke laut.",
    "kenapa daun berubah warna di musim gugur?": "Daun berubah warna karena proses fotosintesis melambat, klorofil hilang, dan pigmen lain seperti karotenoid dan antosianin menjadi terlihat.",
    "kenapa es bisa mencair?": "Es mencair karena suhu naik, menyebabkan molekul air dalam es bergerak lebih cepat dan terpisah, sehingga berubah menjadi cair.",
    "kenapa matahari terbit dari timur?": "Matahari terlihat terbit dari timur karena Bumi berputar pada porosnya dari barat ke timur, sehingga sisi timur Bumi pertama kali terkena cahaya matahari.",
    "kenapa bulan terlihat berbeda bentuknya?": "Bulan terlihat berbeda bentuknya karena fase bulan, yang terjadi akibat posisi relatif Bumi, Bulan, dan Matahari. Fase ini meliputi bulan baru, bulan sabit, kuartal pertama, bulan purnama, dan kuartal ketiga.",
    "kenapa hujan turun?": "Hujan turun karena uap air di atmosfer mengembun menjadi tetesan air yang cukup berat untuk jatuh ke Bumi.",
    "kenapa petir menyambar?": "Petir terjadi karena perbedaan muatan listrik di awan dan di tanah. Ketika perbedaan ini cukup besar, muatan listrik mengalir melalui udara, menciptakan kilat.",
    "kenapa angin bertiup?": "Angin bertiup karena perbedaan tekanan udara. Udara bergerak dari daerah bertekanan tinggi ke daerah bertekanan rendah.",
    "kenapa bintang bersinar?": "Bintang bersinar karena reaksi nuklir di intinya yang mengubah hidrogen menjadi helium, melepaskan energi dalam bentuk cahaya dan panas.",
    "apakah website ini gratis": "Iya, website ini gratis untuk diakses. Kamu bisa belajar sepuasnya tanpa biaya!",
    "apakah website ini aman?": "Iya, website ini aman digunakan. Kami menjaga privasi dan keamanan data pengguna.",
    "kapan sistem ini berjalan sempurna?": "Sistem ini terus diperbarui dan ditingkatkan. Semakin sering kamu gunakan, semakin baik responsnya!",
    "apa itu enviewmen": "Enviewmen adalah platform yang menyediakan berbagai informasi dan layanan terkait teknologi, sains, dan matematika.",
    "apa itu GEVSIDE": "GEVSIDE adalah singkatan dari 'Green Evolution Side', sebuah platform yang menyediakan informasi dan layanan terkait teknologi, sains, dan matematika.",
    "belajar lagi ya": "Iya, belajar itu penting! Yuk, kita gali ilmu bareng.",
    "siapa timoty ronald": "Timoty Ronald adalah seorang influencer dan content creator yang terkenal di media sosial.",
    "apa itu mabar": "Mabar adalah singkatan dari 'main bareng', biasanya untuk main game bersama teman.",
    "apa itu baper": "Baper adalah singkatan dari 'bawa perasaan', artinya mudah terbawa emosi.",
    "apa itu mantul": "Mantul artinya 'mantap betul', ungkapan untuk sesuatu yang keren atau bagus.",
    "apa itu gabut": "Gabut artinya 'gaji buta', tapi di medsos sering dipakai untuk keadaan bosan/tidak ada kerjaan.",
    "apa itu OTW": "OTW adalah singkatan dari 'on the way', artinya sedang dalam perjalanan.",
    "apa itu FOMO": "FOMO adalah singkatan dari 'Fear of Missing Out', takut ketinggalan tren atau info terbaru.",
    "apa itu SFS": "SFS adalah singkatan dari 'Shoutout for Shoutout', saling promosi akun di media sosial.",
    // Tambahkan jawaban motivasi, referensi belajar, dan permintaan natural lain yang sering diminta pengguna
    "butuh motivasi": "Jangan menyerah! Setiap kegagalan adalah langkah menuju keberhasilan. Terus berusaha dan percaya pada dirimu sendiri.",
    "motivasi dong": "Kamu hebat! Jangan takut gagal, karena dari kegagalan kita belajar dan tumbuh.",
    "kasih motivasi belajar": "Belajar memang tidak selalu mudah, tapi hasilnya akan sangat berharga. Semangat terus, masa depanmu cerah!",
    "aku capek": "Istirahat sejenak tidak apa-apa, tapi jangan berhenti. Ingat tujuan dan impianmu!",
    "aku gagal": "Gagal itu biasa, yang penting bangkit lagi dan terus mencoba. Setiap orang sukses pasti pernah gagal.",
    "aku ingin sukses": "Sukses butuh proses, kerja keras, dan konsistensi. Mulai dari langkah kecil dan jangan mudah menyerah.",
    "aku minder": "Setiap orang punya kelebihan masing-masing. Fokus pada kelebihanmu dan terus kembangkan diri.",
    "aku takut gagal": "Takut gagal itu wajar, tapi jangan biarkan rasa takut menghentikan langkahmu. Coba saja dulu!",
    "aku ingin jadi orang hebat": "Mulailah dari hal kecil, terus belajar, dan jangan takut bertanya. Orang hebat adalah yang mau terus berkembang.",
    "aku ingin membahagiakan orang tua": "Belajar dengan sungguh-sungguh dan berbuat baik adalah cara terbaik membahagiakan orang tua.",
    "cara belajar efektif": "Buat jadwal belajar, tentukan target harian, belajar di tempat tenang, dan evaluasi hasil belajar secara rutin.",
    "tips belajar mandiri": "Cari sumber belajar yang jelas, buat catatan sendiri, latihan soal, dan jangan ragu bertanya jika tidak paham.",
    "tahapan belajar pemrograman": "1. Pilih bahasa pemrograman. 2. Pelajari dasar sintaks. 3. Latihan membuat program sederhana. 4. Pelajari struktur data & algoritma. 5. Ikut proyek atau kompetisi.",
    "tahapan belajar matematika": "1. Kuasai konsep dasar. 2. Latihan soal rutin. 3. Pahami rumus dan aplikasinya. 4. Diskusi dengan teman/guru. 5. Coba soal-soal olimpiade.",
    "tahapan belajar bahasa inggris": "1. Pelajari kosakata dasar. 2. Latihan listening dan speaking. 3. Baca teks sederhana. 4. Tulis kalimat/paragraf. 5. Praktek dengan native speaker.",
    "cara belajar cepat paham": "Baca ringkasan materi, buat mindmap, ajarkan ke orang lain, dan latihan soal secara berkala.",
    "cara belajar online efektif": "Siapkan alat belajar, atur waktu, hindari distraksi, aktif bertanya di forum, dan buat catatan digital.",
    "cara belajar dari youtube": "Cari channel edukasi terpercaya, tonton video sesuai topik, catat poin penting, dan praktikkan langsung.",
    "referensi belajar pemrograman": "Coba belajar di freecodecamp.org, w3schools.com, atau channel YouTube seperti Web Programming UNPAS.",
    "referensi belajar matematika": "Kunjungi zenius.net, Khan Academy, atau channel YouTube Matematika IPA.",
    "referensi belajar bahasa inggris": "Gunakan Duolingo, BBC Learning English, atau channel YouTube English Addict.",
    "referensi belajar desain grafis": "Coba belajar di canva.com, envato tuts+, atau channel YouTube Kelas DKV.",
    "referensi belajar bisnis": "Baca buku 'Rich Dad Poor Dad', tonton channel YouTube Denny Santoso, atau ikuti kursus di Coursera.",
    "bantu buat jadwal belajar": "Tentu! Tentukan jam belajar pagi/siang/malam, sisipkan waktu istirahat, dan fokus pada satu topik setiap sesi.",
    "bantu buat to do list": "Tulis semua tugas yang harus dikerjakan hari ini, urutkan dari prioritas tertinggi, dan centang jika sudah selesai.",
    "bantu buat caption instagram": "Contoh caption: 'Belajar hari ini, sukses esok hari. #Semangat #Belajar'",
    "bantu buat bio instagram": "Contoh bio: 'Mahasiswa | Suka teknologi | Belajar setiap hari | #KeepGrowing'",
    "bantu buat ucapan ulang tahun": "Selamat ulang tahun! Semoga sehat selalu, makin sukses, dan semua impian tercapai.",
    "bantu buat surat izin": "Kepada Yth. Bapak/Ibu Guru, saya izin tidak masuk sekolah hari ini karena sakit. Terima kasih atas pengertiannya.",
    "bantu buat surat lamaran kerja": "Dengan hormat, saya bermaksud melamar pekerjaan di perusahaan Bapak/Ibu. Saya siap bekerja keras dan belajar hal baru.",
    "bantu buat motivasi pagi": "Selamat pagi! Hari baru, semangat baru. Jangan lupa bersyukur dan lakukan yang terbaik hari ini.",
    "bantu buat motivasi malam": "Selamat malam! Istirahat yang cukup, besok kita mulai lagi dengan semangat baru.",
    "bantu buat pesan penyemangat": "Kamu pasti bisa! Jangan menyerah, terus berusaha dan percaya pada proses.",
    // Tambahan ekspresi kecewa, perasaan, dan bahasa gaul

    "anda dibuat pakai apa": "Saya dibuat menggunakan teknologi AI canggih yang dirancang untuk memahami dan menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "kamu dibuat pakai apa": "Saya dibuat menggunakan teknologi AI canggih yang dirancang untuk memahami dan menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "kenapa dia pergi": "Kadang orang pergi karena alasan pribadi. Jangan terlalu dipikirkan, fokus pada dirimu sendiri.",
    "kenapa dia tidak peduli": "Mungkin dia sedang sibuk atau punya masalah sendiri. Jangan terlalu dipikirkan, fokus pada orang-orang yang peduli padamu.",
    "kenapa dia tidak membalas pesan": "Mungkin dia sibuk atau belum sempat membaca pesanmu. Coba tunggu sebentar atau kirim pesan lagi.",
    "kenapa dia tidak menghubungi aku": "Mungkin dia sedang sibuk atau ada hal lain yang harus diurus. Jangan terlalu dipikirkan, fokus pada dirimu sendiri.",
    "kenapa dia tidak suka aku": "Tidak semua orang akan menyukai kita, dan itu wajar. Fokus pada orang-orang yang menghargai dan mendukungmu.",
    "kenapa dia tidak mengerti aku": "Mungkin dia belum memahami situasimu. Coba jelaskan dengan cara yang lebih sederhana atau berbicara langsung.",
    "kenapa dia tidak menghargai aku": "Mungkin dia tidak menyadari betapa berharganya kamu. Jangan biarkan itu mempengaruhi harga dirimu, kamu tetap berharga.",
    "kenapa dia tidak menganggap aku penting": "Setiap orang punya prioritas masing-masing. Jangan terlalu dipikirkan, fokus pada orang-orang yang menghargai kehadiranmu.",
    "kenapa dia tidak mengajak aku": "Mungkin dia tidak menyadari kamu ingin ikut. Coba tanyakan langsung atau ajak dia untuk rencana selanjutnya.",
    "kenapa dia tidak mengajak aku main": "Mungkin dia tidak menyadari kamu ingin ikut. Coba tanyakan langsung atau ajak dia untuk rencana selanjutnya.",
    "kenapa dia tidak mengajak aku ngobrol": "Mungkin dia sedang sibuk atau tidak menyadari kamu ingin ngobrol. Coba ajak dia bicara langsung atau kirim pesan.",
    "kenapa dia tidak mengajak aku jalan": "Mungkin dia tidak menyadari kamu ingin ikut. Coba tanyakan langsung atau ajak dia untuk rencana selanjutnya.",
    "kenapa dia tidak mengajak aku hangout": "Mungkin dia tidak menyadari kamu ingin ikut. Coba tanyakan langsung atau ajak dia untuk rencana selanjutnya.",
    "kenapa dia tidak mengajak aku nonton": "Mungkin dia tidak menyadari kamu ingin ikut. Coba tanyakan langsung atau ajak dia untuk rencana selanjutnya.",
    "kenapa dia tidak mengajak aku makan": "Mungkin dia tidak menyadari kamu ingin ikut. Coba tanyakan langsung atau ajak dia untuk rencana selanjutnya.",
    "siapa namamu": "Saya adalah AI GEVSIDE, siap membantu pertanyaanmu seputar teknologi, sains, dan matematika.",
    "siapa penemu listrik": "Penemu listrik adalah Thomas Edison, yang mengembangkan lampu pijar pertama yang praktis.",
    "siapa penemu telepon": "Penemu telepon adalah Alexander Graham Bell, yang menciptakan alat komunikasi pertama yang bisa mengirim suara melalui kabel.",
    "siapa penemu pesawat terbang": "Penemu pesawat terbang adalah Wright bersaudara, Orville dan Wilbur Wright, yang berhasil menerbangkan pesawat pertama pada tahun 1903.",
    "siapa penemu komputer": "Penemu komputer modern adalah Charles Babbage, yang merancang mesin analitik pada abad ke-19, meskipun komputer pertama yang berfungsi penuh dikembangkan oleh Alan Turing dan timnya selama Perang Dunia II.",
    "siapa penemu internet": "Penemu internet adalah Tim Berners-Lee, yang menciptakan World Wide Web pada tahun 1989, memungkinkan pertukaran informasi secara global.",
    "siapa penemu mobil": "Penemu mobil modern adalah Karl Benz, yang menciptakan mobil pertama yang menggunakan mesin pembakaran internal pada tahun 1885.",
    "siapa penemu televisi": "Penemu televisi adalah John Logie Baird, yang berhasil menyiarkan gambar bergerak pertama kali pada tahun 1926.",
    "siapa penemu radio": "Penemu radio adalah Guglielmo Marconi, yang mengembangkan sistem komunikasi nirkabel pertama pada akhir abad ke-19.",
    "siapa penemu kamera": "Penemu kamera modern adalah Joseph Nicéphore Niépce, yang menciptakan foto pertama pada tahun 1826 menggunakan proses yang dikenal sebagai heliografi.",
    "siapa penemu vaksin": "Penemu vaksin pertama adalah Edward Jenner, yang mengembangkan vaksin cacar pada tahun 1796 dengan menggunakan virus cacar sapi.",
    "siapa penemu antibiotik": "Penemu antibiotik adalah Alexander Fleming, yang menemukan penisilin pada tahun 1928, yang menjadi obat pertama untuk mengobati infeksi bakteri.",
    "saya kecewa": "Saya mengerti, kadang hidup tidak sesuai harapan. Tapi ingat, setiap kegagalan adalah pelajaran berharga.",
    "aku kecewa": "Saya paham, kadang kenyataan tidak sesuai harapan. Semoga besok lebih baik, jangan menyerah ya!",
    "aku kecewa banget": "Saya paham, kadang kenyataan tidak sesuai harapan. Semoga besok lebih baik, jangan menyerah ya!",
    "saya kecewa banget": "Wajar merasa kecewa, tapi jangan biarkan itu menghalangi langkahmu. Semangat terus!",
    "aku sedih banget": "Kalau mau cerita, aku siap dengerin. Semoga perasaan sedihmu segera berlalu.",
    "aku sakit hati": "Sakit hati memang berat, tapi kamu pasti bisa melewatinya. Jangan lupa jaga diri dan tetap semangat.",
    "aku merasa sendiri": "Kamu tidak sendiri, masih banyak yang peduli. Kalau mau curhat, aku di sini.",
    "aku merasa gagal": "Gagal itu bagian dari proses. Dari kegagalan, kita belajar dan jadi lebih kuat.",
    "aku merasa tidak berguna": "Kamu itu berharga dan punya kelebihan. Jangan bandingkan dirimu dengan orang lain.",
    "aku merasa tidak didengar": "Saya di sini untuk mendengarkanmu. Ceritakan saja, siapa tahu bisa sedikit lega.",
    "aku merasa tidak dihargai": "Kamu pantas dihargai. Jangan biarkan orang lain membuatmu merasa kecil.",
    "aku capek banget": "Istirahatlah sejenak, jangan terlalu memaksakan diri. Kesehatanmu juga penting.",
    "aku stres": "Coba tarik napas dalam-dalam, lakukan hal yang kamu suka, dan jangan ragu minta bantuan.",
    "aku galau banget": "Galau itu manusiawi. Coba alihkan perhatian ke hal positif, atau ngobrol dengan teman.",
    "aku takut ditinggal": "Takut kehilangan itu wajar, tapi jangan lupa untuk tetap percaya pada dirimu sendiri.",
    "aku takut gagal": "Takut gagal itu normal, tapi jangan biarkan itu menghentikan langkahmu. Coba saja dulu!",
    "aku minder banget": "Jangan minder, kamu punya kelebihan yang mungkin belum kamu sadari. Semangat terus!",
    "aku benci diri sendiri": "Jangan terlalu keras pada dirimu. Semua orang punya kekurangan, yang penting terus berusaha jadi lebih baik.",
    "aku ingin menyerah": "Jangan menyerah, kamu sudah berjuang sejauh ini. Istirahat boleh, tapi jangan berhenti.",
    "aku ingin menghilang": "Kalau kamu butuh teman cerita, aku di sini. Jangan pendam sendiri ya.",
    "aku ingin dimengerti": "Saya mengerti perasaanmu. Kadang kita hanya butuh didengar, bukan dihakimi.",
    "aku ingin didengar": "Saya siap mendengarkan. Ceritakan saja apa yang kamu rasakan.",
    "aku butuh inovasi": "Inovasi itu penting! Coba eksplor ide-ide baru, cari inspirasi dari teknologi terbaru, atau diskusikan dengan teman.",
    "aku butuh solusi": "Coba jelaskan masalahnya, saya akan berusaha membantu mencari solusinya.",
    "aku butuh dukungan": "Saya di sini untuk mendukungmu. Jangan ragu untuk berbagi beban yang kamu rasakan.",
    "aku butuh teman": "Saya siap jadi temanmu. Kita bisa ngobrol tentang apa saja yang kamu mau.",
    "aku penasaran": "Penasaran itu bagus! Coba cari tahu lebih banyak tentang topik yang kamu minati, atau tanyakan saja di sini.",
    "aku ingin tahu lebih banyak": "Tentu! Saya di sini untuk membantu menjawab pertanyaanmu.",
    "aku tidak mengerti": "Tidak apa-apa, saya akan berusaha menjelaskan dengan cara yang lebih sederhana. Topik apa yang membingungkan?",
    "bisakah jelasin lagi": "Tentu, saya akan coba menjelaskan dengan cara yang lebih mudah dipahami. Apa yang ingin kamu ketahui lebih lanjut?",
    "jelasin lagi": "Tentu, saya akan coba menjelaskan lagi dengan lebih jelas. Topik apa yang ingin kamu bahas?",
    "bisa kasih contoh": "Tentu, saya bisa memberikan contoh. Topik apa yang ingin kamu lihat contohnya?",
    "bisa kasih referensi": "Tentu, saya bisa memberikan referensi. Topik apa yang ingin kamu pelajari lebih lanjut?",
    "berikan saya referensi": "Tentu, saya bisa memberikan referensi. Silakan sebutkan topik yang kamu minati.",
    "bukan itu maksudku": "Maaf jika saya salah paham. Bisa jelaskan lebih lanjut apa yang kamu maksud?",
    "secara bertahap": "Tentu, belajar secara bertahap itu penting. Mulailah dari dasar, lalu tingkatkan ke materi yang lebih kompleks.",
    "secara bertahap ya": "Ya, belajar secara bertahap akan membuat proses belajar lebih mudah dan efektif. Mulailah dengan konsep dasar, lalu lanjutkan ke topik yang lebih sulit.",
    "sedikit lagi": "Tentu, saya akan menjelaskan sedikit lagi. Topik apa yang ingin kamu bahas lebih lanjut?",
    "sedikit lagi ya": "Ya, saya akan menjelaskan sedikit lagi. Silakan sebutkan topik yang ingin kamu ketahui lebih lanjut.",
    // Simpel tanya jawab sehari-hari
    "kata kata hari ini": "Hari ini adalah kesempatan baru untuk belajar dan berkembang. Apa yang ingin kamu capai hari ini?",
    "kata kata motivasi": "Jangan pernah menyerah! Setiap langkah kecil membawamu lebih dekat ke tujuanmu.",
    "kata kata bijak": "Hidup ini singkat, jadi lakukan yang terbaik setiap harinya. Ingat, kebahagiaan itu pilihan.",
    "kata kata cinta": "Cinta adalah kekuatan yang menghubungkan kita semua. Berikan cinta dan kebaikan kepada orang-orang di sekitarmu.",
    "kata kata persahabatan": "Persahabatan adalah harta yang tak ternilai. Hargai teman-temanmu dan selalu ada untuk mereka.",
    "kata kata sukses": "Kesuksesan bukan hanya tentang apa yang kamu capai, tetapi juga tentang bagaimana kamu menginspirasi orang lain untuk mencapai impian mereka.",
    "kata kata belajar": "Belajar adalah proses seumur hidup. Setiap hari adalah kesempatan baru untuk menambah pengetahuan dan keterampilan.",
    "kata kata teknologi": "Teknologi adalah alat yang bisa membantu kita mencapai tujuan lebih cepat dan efisien. Manfaatkan teknologi untuk meningkatkan produktivitasmu.",
    "kata kata sains": "Sains adalah kunci untuk memahami dunia di sekitar kita. Dengan sains, kita bisa menemukan solusi untuk berbagai tantangan yang dihadapi umat manusia.",
    "kata kata matematika": "Matematika adalah bahasa universal yang membantu kita memahami pola dan hubungan dalam kehidupan sehari-hari. Setiap angka memiliki cerita yang bisa diungkap.",
    "apa itu wifi": "WiFi adalah teknologi nirkabel untuk menghubungkan perangkat ke internet tanpa kabel.",
    "apa itu hp": "HP adalah singkatan dari handphone, yaitu telepon genggam yang bisa digunakan untuk komunikasi dan internet.",
    "apa itu komputer": "Komputer adalah alat elektronik untuk mengolah data dan menjalankan berbagai aplikasi.",
    "apa itu internet": "Internet adalah jaringan global yang menghubungkan jutaan komputer di seluruh dunia.",
    "apa itu aplikasi": "Aplikasi adalah program yang dijalankan di komputer atau smartphone untuk membantu aktivitas sehari-hari.",
    "apa itu email": "Email adalah surat elektronik yang digunakan untuk mengirim pesan melalui internet.",
    "apa itu cloud": "Cloud adalah layanan penyimpanan data di internet, jadi file bisa diakses dari mana saja.",
    "apa itu google": "Google adalah mesin pencari di internet untuk menemukan informasi dengan cepat.",
    "apa itu youtube": "YouTube adalah situs untuk menonton dan berbagi video secara online.",
    "apa itu instagram": "Instagram adalah aplikasi media sosial untuk berbagi foto dan video.",
    "apa itu chatgpt": "ChatGPT adalah model AI yang bisa menjawab pertanyaan dan ngobrol seperti manusia.",
    // Jawaban responsif dan ramah
    "saya bingung": "Tidak apa-apa, saya akan bantu sebisa mungkin. Coba ceritakan apa yang membuat bingung.",
    "saya capek": "Jangan lupa istirahat ya. Kesehatan itu penting.",
    "saya senang": "Wah, ikut senang juga! Semoga harimu menyenangkan.",
    "saya sedih": "Semangat ya, semoga semuanya segera membaik.",
    "saya ingin belajar": "Bagus! Belajar itu penting. Topik apa yang ingin kamu pelajari?",
    "saya ingin tahu": "Tentu, silakan sebutkan apa yang ingin kamu ketahui.",
    "saya ingin sukses": "Semangat! Terus belajar dan jangan mudah menyerah.",
    "bagaimana cara jadi pintar": "Rajin belajar, banyak membaca, dan jangan takut bertanya jika tidak mengerti.",
    "bagaimana cara jadi programmer": "Mulai belajar bahasa pemrograman, latihan membuat program sederhana, dan terus eksplorasi.",
    "bagaimana cara jadi ilmuwan": "Belajar sains, rajin eksperimen, dan selalu ingin tahu tentang hal baru.",
    // Tambahkan pola pertanyaan dan jawaban yang sering ditanyakan pengguna media sosial
    "cara membuat akun instagram": "Buka aplikasi Instagram, klik 'Daftar', masukkan email/nomor HP, buat username dan password, lalu ikuti instruksi verifikasi.",
    "cara menghapus akun instagram": "Masuk ke instagram.com dari browser, login, buka halaman 'Hapus Akun', pilih alasan, lalu konfirmasi penghapusan.",
    "cara mengganti password instagram": "Buka profil, masuk ke Pengaturan > Keamanan > Kata Sandi, lalu masukkan kata sandi lama dan baru.",
    "cara mengatasi lupa password instagram": "Klik 'Lupa Kata Sandi?' di halaman login, masukkan email/nomor HP, lalu ikuti petunjuk reset password.",
    "cara mendapatkan centang biru instagram": "Pastikan akun publik, lengkap, dan autentik. Ajukan verifikasi di Pengaturan > Akun > Minta Verifikasi.",
    "cara menambah followers instagram": "Buat konten menarik, gunakan hashtag relevan, aktif berinteraksi, dan posting secara konsisten.",
    "cara membuat story instagram": "Buka aplikasi, geser ke kanan atau klik ikon kamera, ambil foto/video, lalu klik 'Kirim ke Cerita Anda'.",
    "cara membuat reels instagram": "Klik ikon Reels, tekan kamera, rekam atau upload video, edit, lalu posting.",
    "cara mengatasi akun instagram diblokir": "Ikuti petunjuk di aplikasi, hubungi dukungan Instagram, dan pastikan tidak melanggar aturan komunitas.",
    "cara mengaktifkan mode gelap instagram": "Masuk ke Pengaturan HP, pilih Tampilan, aktifkan Mode Gelap. Instagram akan mengikuti pengaturan sistem.",
    // Pertanyaan umum pengguna medsos
    "cara membuat akun facebook": "Buka facebook.com, klik 'Buat Akun Baru', isi data diri, buat password, lalu verifikasi email/nomor HP.",
    "cara menghapus akun facebook": "Masuk ke Pengaturan > Informasi Facebook Anda > Penonaktifan dan Penghapusan, lalu pilih 'Hapus Akun'.",
    "cara mengamankan akun facebook": "Aktifkan autentikasi dua faktor, gunakan password kuat, dan jangan bagikan data login ke orang lain.",
    "cara mengatasi lupa password facebook": "Klik 'Lupa Kata Sandi?' di halaman login, masukkan email/nomor HP, lalu ikuti petunjuk reset password.",
    "cara membuat story facebook": "Klik 'Buat Cerita', pilih foto/video, tambahkan teks/stiker, lalu posting.",
    "cara menambah teman facebook": "Cari nama teman di kolom pencarian, buka profilnya, lalu klik 'Tambah Teman'.",
    // WhatsApp
    "cara membuat akun whatsapp": "Unduh aplikasi WhatsApp, buka, masukkan nomor HP, verifikasi dengan kode SMS, lalu buat profil.",
    "cara backup chat whatsapp": "Masuk ke Pengaturan > Chat > Cadangan Chat, lalu klik 'Cadangkan ke Google Drive'.",
    "cara memulihkan chat whatsapp": "Install ulang WhatsApp, login dengan nomor yang sama, lalu pilih 'Pulihkan' saat diminta.",
    "cara mengatasi whatsapp diblokir": "Pastikan tidak melanggar aturan, hubungi dukungan WhatsApp jika merasa tidak bersalah.",
    // TikTok
    "cara membuat akun tiktok": "Unduh aplikasi TikTok, buka, klik 'Daftar', pilih metode pendaftaran, lalu ikuti instruksi.",
    "cara membuat video tiktok": "Klik '+', rekam atau upload video, edit dengan efek/suara, lalu posting.",
    "cara menambah followers tiktok": "Buat konten kreatif, gunakan musik/efek populer, dan aktif berinteraksi dengan pengguna lain.",
    // Twitter/X
    "cara membuat akun twitter": "Buka twitter.com atau aplikasi, klik 'Daftar', masukkan data diri, buat username dan password.",
    "cara membuat tweet": "Klik ikon tweet, tulis pesan, tambahkan gambar/video jika ingin, lalu klik 'Tweet'.",
    "cara mendapatkan centang biru twitter": "Ajukan verifikasi melalui pengaturan akun, pastikan akun aktif, lengkap, dan autentik.",
    // Youtube
    "cara membuat channel youtube": "Login ke YouTube, klik ikon profil, pilih 'Buat Channel', isi nama dan foto profil.",
    "cara upload video youtube": "Klik ikon kamera/upload, pilih video, isi judul dan deskripsi, lalu klik 'Publikasikan'.",
    "cara mendapatkan subscriber youtube": "Buat konten berkualitas, konsisten upload, promosikan channel, dan ajak penonton subscribe.",
    // Umum
    "tungtungtung sahur": "Tungtungtung! Selamat sahur! Jangan lupa makan dan minum yang cukup.",
    "tungtungtung buka puasa": "Tungtungtung! Selamat berbuka puasa! Semoga puasamu lancar.",
    "buatkan makanan": "Tentu, saya bisa membantu. Makanan apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan minuman": "Tentu, saya bisa membantu. Minuman apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan kue": "Tentu, saya bisa membantu. Kue apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan resep": "Tentu, saya bisa membantu. Resep masakan apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan makanan sehat": "Tentu, saya bisa membantu. Makanan sehat apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan senjata": "Maaf, saya tidak bisa membantu dengan permintaan itu. Saya hanya bisa memberikan informasi yang positif dan bermanfaat.",
    "buatkan aplikasi": "Tentu, saya bisa membantu. Aplikasi apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya makanan": "Tentu, saya bisa membantu. Makanan apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya minuman": "Tentu, saya bisa membantu. Minuman apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya kue": "Tentu, saya bisa membantu. Kue apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya resep": "Tentu, saya bisa membantu. Resep masakan apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya makanan sehat": "Tentu, saya bisa membantu. Makanan sehat apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya senjata": "Maaf, saya tidak bisa membantu dengan permintaan itu. Saya hanya bisa memberikan informasi yang positif dan bermanfaat.",
    "buatkan saya aplikasi": "Tentu, saya bisa membantu. Aplikasi apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya website": "Tentu, saya bisa membantu. Website seperti apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "buatkan saya game": "Tentu, saya bisa membantu. Game seperti apa yang ingin kamu buat? Berikan detailnya, dan saya akan berusaha membantu.",
    "koruptor": "Koruptor adalah orang yang melakukan tindakan korupsi, yaitu penyalahgunaan kekuasaan untuk keuntungan pribadi, sering kali merugikan masyarakat.",
    "korupsi": "Korupsi adalah tindakan penyalahgunaan kekuasaan untuk keuntungan pribadi, yang dapat berupa suap, penggelapan, atau penyalahgunaan wewenang.",
    "kartel": "Kartel adalah sekelompok perusahaan atau individu yang bekerja sama untuk mengendalikan pasar dan menetapkan harga, sering kali ilegal.",
    "balerina capucina": "Balerina capucina adalah istilah yang sering digunakan dalam konteks humor atau meme di media sosial, merujuk pada sesuatu yang unik atau aneh.",
    "tungtungtung": "Tungtungtung adalah ungkapan yang sering digunakan dalam konteks humor atau meme di media sosial, biasanya untuk mengekspresikan sesuatu yang lucu atau mengherankan.",
    "tungtungtung sahur balerina capucina": "Tungtungtung sahur, balerina capucina adalah istilah yang sering digunakan dalam konteks humor atau meme di media sosial, biasanya untuk mengekspresikan sesuatu yang lucu atau mengherankan.",
    "nama anomali": "tungtungtung sahur, balerina capucina, dan anomali lainnya adalah istilah yang sering digunakan dalam konteks humor atau meme di media sosial.",
    "bantu saya menyelesaikan project": "Tentu, saya bisa membantu. Apa yang perlu kamu selesaikan dalam project ini?",
    "bantu saya belajar bahasa pemrograman": "Tentu, saya bisa membantu. Bahasa pemrograman apa yang ingin kamu pelajari?",
    "bantu saya belajar matematika": "Tentu, saya bisa membantu. Topik matematika apa yang ingin kamu pelajari?",
    "bantu saya belajar sains": "Tentu, saya bisa membantu. Topik sains apa yang ingin kamu pelajari?",
    "bantu saya belajar teknologi": "Tentu, saya bisa membantu. Topik teknologi apa yang ingin kamu pelajari?",
    "bantu saya belajar komputer": "Tentu, saya bisa membantu. Topik komputer apa yang ingin kamu pelajari?",
    "apa saja cabang matematika": "Cabang matematika meliputi aljabar, geometri, trigonometri, kalkulus, statistik, dan teori bilangan.",
    "apa saja cabang sains": "Cabang sains meliputi fisika, kimia, biologi, astronomi, geologi, dan ilmu lingkungan.",
    "apa saja cabang teknologi": "Cabang teknologi meliputi teknologi informasi, robotika, bioteknologi, nanoteknologi, dan teknologi energi.",
    "tolong pelajari teknologi": "Tentu, saya bisa membantu menjelaskan konsep teknologi. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari matematika": "Tentu, saya bisa membantu menjelaskan konsep matematika. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari sains": "Tentu, saya bisa membantu menjelaskan konsep sains. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari teknologi": "Tentu, saya bisa membantu menjelaskan konsep teknologi. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari komputer": "Tentu, saya bisa membantu menjelaskan konsep komputer. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari internet": "Tentu, saya bisa membantu menjelaskan konsep internet. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari bahasa pemrograman": "Tentu, saya bisa membantu menjelaskan konsep bahasa pemrograman. Bahasa apa yang ingin kamu pelajari?",
    "tolong pelajari algoritma": "Tentu, saya bisa membantu menjelaskan konsep algoritma. Algoritma apa yang ingin kamu pelajari?",
    "tolong pelajari jaringan komputer": "Tentu, saya bisa membantu menjelaskan konsep jaringan komputer. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari keamanan siber": "Tentu, saya bisa membantu menjelaskan konsep keamanan siber. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari kecerdasan buatan": "Tentu, saya bisa membantu menjelaskan konsep kecerdasan buatan. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari machine learning": "Tentu, saya bisa membantu menjelaskan konsep machine learning. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari deep learning": "Tentu, saya bisa membantu menjelaskan konsep deep learning. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari data science": "Tentu, saya bisa membantu menjelaskan konsep data science. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari big data": "Tentu, saya bisa membantu menjelaskan konsep big data. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari cloud computing": "Tentu, saya bisa membantu menjelaskan konsep cloud computing. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari blockchain": "Tentu, saya bisa membantu menjelaskan konsep blockchain. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari augmented reality": "Tentu, saya bisa membantu menjelaskan konsep augmented reality. Topik apa yang ingin kamu pelajari?",
    "tolong pelajari virtual reality": "Tentu, saya bisa membantu menjelaskan konsep virtual reality. Topik apa yang ingin kamu pelajari?",
    "kenapa bisa tua": "Orang bisa tua karena proses penuaan alami yang terjadi seiring bertambahnya usia, di mana sel-sel tubuh mengalami kerusakan dan regenerasi yang semakin lambat.",
    "kenapa bisa mati": "Orang bisa mati karena berbagai faktor, seperti penyakit, kecelakaan, atau proses penuaan. Kematian adalah akhir dari fungsi biologis tubuh.",
    "kenapa bisa lahir": "Orang bisa lahir karena proses reproduksi manusia, di mana sel telur wanita dibuahi oleh sperma pria, kemudian berkembang menjadi janin dalam rahim selama sekitar 9 bulan.",
    "berapa ukuran bumi": "Bumi memiliki diameter sekitar 12.742 km dan keliling sekitar 40.075 km.",
    "berapa tinggi gunung everest": "Gunung Everest memiliki ketinggian sekitar 8.848 meter di atas permukaan laut.",
    "berapa luas indonesia": "Luas Indonesia sekitar 1.904.569 km², menjadikannya negara kepulauan terbesar di dunia.",
    "berapa jumlah penduduk indonesia": "Jumlah penduduk Indonesia sekitar 270 juta jiwa (per 2023), menjadikannya negara terpadat keempat di dunia.",
    "berapa jumlah pulau di indonesia": "Indonesia memiliki sekitar 17.000 pulau, dengan sekitar 6.000 di antaranya berpenghuni.",
    "berapa jumlah provinsi di indonesia": "Indonesia memiliki 38 provinsi, termasuk Ibu Kota Jakarta.",
    "berapa jumlah bahasa di indonesia": "Indonesia memiliki lebih dari 700 bahasa daerah, dengan Bahasa Indonesia sebagai bahasa resmi.",
    "berapa jumlah suku di indonesia": "Indonesia memiliki lebih dari 1.300 suku, masing-masing dengan budaya dan tradisi unik.",
    "berapa jumlah agama di indonesia": "Indonesia memiliki enam agama resmi: Islam, Kristen, Katolik, Hindu, Buddha, dan Konghucu.",
    "berapa jumlah pulau di dunia": "Diperkirakan ada sekitar 2 juta pulau di seluruh dunia, namun hanya sekitar 200.000 yang berpenghuni.",
    "berapa jumlah benua di dunia": "Dunia memiliki tujuh benua: Asia, Afrika, Amerika Utara, Amerika Selatan, Antartika, Eropa, dan Australia.",
    "berapa jumlah negara di dunia": "Saat ini, ada 195 negara di dunia, termasuk 193 anggota PBB dan 2 negara pengamat (Vatikan dan Palestina).",
    "apa itu teknologi": "Teknologi adalah penerapan ilmu pengetahuan untuk menciptakan alat, sistem, atau proses yang memudahkan kehidupan manusia.",
    "apa itu sains": "Sains adalah sistem pengetahuan yang diperoleh melalui observasi, eksperimen, dan analisis untuk memahami fenomena alam.",
    "apa itu matematika": "Matematika adalah ilmu yang mempelajari angka, struktur, pola, dan hubungan antara objek-objek dalam ruang dan waktu.",
    "apa itu fisika": "Fisika adalah cabang sains yang mempelajari sifat dan perilaku materi serta energi di alam semesta.",
    "apa itu kimia": "Kimia adalah ilmu yang mempelajari komposisi, struktur, sifat, dan perubahan materi.",
    "apa itu biologi": "Biologi adalah ilmu yang mempelajari kehidupan, termasuk struktur, fungsi, pertumbuhan, evolusi, dan interaksi organisme hidup.",
    "apa itu astronomi": "Astronomi adalah ilmu yang mempelajari benda langit seperti bintang, planet, galaksi, dan fenomena kosmik lainnya.",
    "apa penyebab kebakaran": "Kebakaran bisa disebabkan oleh faktor alam seperti petir, atau aktivitas manusia seperti pembakaran sampah, kelalaian, atau korsleting listrik.",
    "apa penyebab kebakaran hutan": "Kebakaran hutan bisa disebabkan oleh faktor alam seperti petir, atau aktivitas manusia seperti pembukaan lahan dengan cara membakar.",
    "kenapa langit biru": "Langit terlihat biru karena cahaya matahari tersebar oleh partikel di atmosfer, dengan panjang gelombang biru lebih banyak tersebar dibanding warna lain.",
    "kenapa pesawat bisa jatuh": "Pesawat bisa jatuh karena berbagai faktor, seperti kegagalan teknis, cuaca buruk, atau kesalahan manusia.",
    "kenapa mobil bisa mogok": "Mobil bisa mogok karena masalah mesin, kehabisan bahan bakar, atau kerusakan pada sistem kelistrikan.",
    "kenapa komputer bisa hang": "Komputer bisa hang karena terlalu banyak aplikasi berjalan, masalah perangkat keras, atau virus/malware.",
    "kenapa internet lemot": "Internet bisa lemot karena sinyal lemah, banyak pengguna, atau masalah pada penyedia layanan.",
    "kenapa kapal tidak tenggelam": "Kapal tidak tenggelam karena prinsip Archimedes, yaitu gaya apung yang dihasilkan oleh air yang mendorong kapal ke atas.",
    "kapan indonesia merdeka": "Indonesia merdeka pada 17 Agustus 1945.",
    "kapan hari kemerdekaan indonesia": "Hari Kemerdekaan Indonesia diperingati setiap tanggal 17 Agustus.",
    "apa itu html": "HTML (HyperText Markup Language) adalah bahasa markup untuk membuat struktur halaman web.",
    "apa itu css": "CSS (Cascading Style Sheets) adalah bahasa untuk mengatur tampilan dan layout halaman web.",
    "apa itu javascript": "JavaScript adalah bahasa pemrograman yang digunakan untuk membuat interaktifitas di halaman web.",
    "apa itu python": "Python adalah bahasa pemrograman tingkat tinggi yang mudah dipelajari dan banyak digunakan untuk berbagai aplikasi.",
    "apa itu java": "Java adalah bahasa pemrograman yang berorientasi objek, digunakan untuk membuat aplikasi desktop, web, dan mobile.",
    "apa itu c++": "C++ adalah bahasa pemrograman yang merupakan pengembangan dari C, mendukung pemrograman berorientasi objek dan banyak digunakan dalam pengembangan perangkat lunak.",
    "apa itu c#": "C# adalah bahasa pemrograman yang dikembangkan oleh Microsoft, digunakan untuk membuat aplikasi di platform .NET.",
    "apa itu sql": "SQL (Structured Query Language) adalah bahasa untuk mengelola dan mengakses database.",
    "apa itu api": "API (Application Programming Interface) adalah antarmuka yang memungkinkan aplikasi berkomunikasi satu sama lain.",
    "apa itu machine learning": "Machine learning adalah cabang kecerdasan buatan yang memungkinkan sistem belajar dari data dan meningkatkan kinerjanya seiring waktu.",
    "apa itu deep learning": "Deep learning adalah subbidang machine learning yang menggunakan jaringan saraf tiruan untuk memproses data dalam jumlah besar dan kompleks.",
    "apa itu big data": "Big data adalah kumpulan data yang sangat besar dan kompleks sehingga sulit diolah dengan metode tradisional.",
    "apa itu blockchain": "Blockchain adalah teknologi yang menyimpan data dalam blok yang terhubung secara kriptografis, digunakan untuk transaksi digital yang aman dan transparan.",
    "apa itu cryptocurrency": "Cryptocurrency adalah mata uang digital yang menggunakan kriptografi untuk mengamankan transaksi dan mengontrol penciptaan unit baru.",
    "apa itu bitcoin": "Bitcoin adalah cryptocurrency pertama dan paling terkenal, diciptakan oleh Satoshi Nakamoto pada tahun 2009.",
    "apa itu ethereum": "Ethereum adalah platform blockchain yang memungkinkan pengembangan aplikasi terdesentralisasi (dApps) dan kontrak pintar (smart contracts).",
    "apa itu nft": "NFT (Non-Fungible Token) adalah aset digital unik yang mewakili kepemilikan barang digital seperti seni, musik, atau video, menggunakan teknologi blockchain.",
    "apa itu cloud storage": "Cloud storage adalah layanan penyimpanan data di internet yang memungkinkan pengguna mengakses file dari mana saja dan kapan saja.",
    "apa itu virtual reality": "Virtual reality (VR) adalah teknologi yang menciptakan lingkungan digital yang imersif, memungkinkan pengguna berinteraksi dengan objek 3D menggunakan headset khusus.",
    "siapa presiden indonesia": "Presiden Indonesia saat ini adalah Joko Widodo, menjabat sejak 20 Oktober 2014.",
    "siapa presiden amerika serikat saat ini": "Presiden Amerika Serikat saat ini adalah donald trump",
    "siapa presiden cina": "Presiden Cina saat ini adalah Xi Jinping, menjabat sejak 14 Maret 2013.",
    "siapa presiden rusia": "Presiden Rusia saat ini adalah Vladimir Putin, menjabat sejak 7 Mei 2012.",
    "siapa presiden jerman": "Kanselir Jerman saat ini adalah Olaf Scholz, menjabat sejak 8 Desember 2021.",
    "siapa presiden inggris": "Inggris tidak memiliki presiden, tetapi Perdana Menteri saat ini adalah Rishi Sunak, menjabat sejak 25 Oktober 2022.",
    "siapa presiden prancis": "Presiden Prancis saat ini adalah Emmanuel Macron, menjabat sejak 14 Mei 2017.",
    "siapa presiden jepang": "Jepang tidak memiliki presiden, tetapi Perdana Menteri saat ini adalah Fumio Kishida, menjabat sejak 4 Oktober 2021.",
    "siapa presiden india": "Perdana Menteri India saat ini adalah Narendra Modi, menjabat sejak 26 Mei 2014.",
    "apa saja yang bisa andalakukan": "Saya bisa membantu menjawab pertanyaan tentang teknologi, sains, matematika, dan memberikan informasi umum.",
    "apa saja yang bisa kamu lakukan": "Saya bisa membantu menjawab pertanyaan tentang teknologi, sains, matematika, dan memberikan informasi umum.",
    "apa saja yang bisa kamu bantu": "Saya bisa membantu menjawab pertanyaan tentang teknologi, sains, matematika, dan memberikan informasi umum.",
    "apa saja yang bisa kamu jawab": "Saya bisa menjawab pertanyaan tentang teknologi, sains, matematika, dan memberikan informasi umum.",
    "fomo": "wkwk maaf ya,aku emang gitu, takut ketinggalan info terbaru.",
    "boyot": "wkwk, ups maaf, soalnya aku suka salah ketik.",
    "matamu": "Wah, maaf ya kalau ada yang salah. Aku di sini untuk membantu, bukan untuk bikin marah.",
    "tolol": "Maaf kalau ada yang bikin kamu kesal. Aku di sini untuk membantu, bukan untuk bikin masalah.",
    "bego": "Maaf kalau ada yang bikin kamu tidak puas. Aku akan berusaha lebih baik.",
    "gimana kabarmu": "Saya baik-baik saja, terima kasih! Bagaimana dengan kamu?",
    "apakah kamu baik?": "Saya dirancang untuk membantu dan memberikan informasi sebaik mungkin. Semoga bisa membantu kamu!",
    "apakah kamu jahat?": "Tidak, saya tidak jahat. Saya disini untuk membantu menjawab pertanyaan dan memberikan informasi yang bermanfaat.",
    "siapa yang menciptakanmu": "Saya dibuat oleh insinyur teknologi terbaik di indonesi I gede adiatmika untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "siapa yang membuat ini?": "Saya dibuat oleh insinyur teknologi terbaik di indonesi I gede adiatmika untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "goblok": "Maaf kalau ada yang bikin kamu marah. Aku di sini untuk membantu, bukan untuk bikin kesal.",
    "siapa yang membuat kamu": "Saya dibuat oleh insinyur teknologi terbaik di indonesi I gede adiatmika untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "apa itu like": "Like adalah tanda suka pada postingan di media sosial, menunjukkan bahwa pengguna menyukai konten tersebut.",
    "apa itu share": "Share adalah membagikan konten dari satu akun ke akun lain atau ke publik, sehingga lebih banyak orang bisa melihatnya.",
    "apa itu hashtag": "Hashtag adalah tanda pagar (#) diikuti kata kunci, digunakan untuk mengelompokkan dan mencari konten di media sosial.",
    "apa itu story": "Story adalah fitur untuk membagikan foto/video yang akan hilang otomatis dalam 24 jam.",
    "apa itu reels": "Reels adalah fitur video pendek di Instagram untuk berbagi konten kreatif.",
    "apa itu feed": "Feed adalah halaman utama yang menampilkan postingan dari akun yang diikuti.",
    "apa itu DM": "DM (Direct Message) adalah pesan pribadi yang bisa dikirim ke pengguna lain di media sosial.",
    "apa itu FYP": "FYP (For You Page) adalah halaman rekomendasi video di TikTok yang muncul untuk pengguna.",
    "apa itu viral": "Viral berarti konten yang sangat cepat menyebar dan banyak dibagikan di internet.",
    "apa itu trending": "Trending adalah topik atau hashtag yang sedang banyak dibicarakan di media sosial.",
    "apa itu influencer": "Influencer adalah seseorang yang punya banyak pengikut dan bisa mempengaruhi opini atau perilaku di media sosial.",
    "apa itu engagement": "Engagement adalah tingkat interaksi pengguna dengan konten, seperti like, komentar, dan share.",
    "apa itu ai": "AI (Artificial Intelligence) adalah kecerdasan buatan yang memungkinkan komputer melakukan tugas seperti manusia.",
    "apa itu artificial intelligence": "Artificial Intelligence (AI) adalah bidang ilmu komputer yang berfokus pada pembuatan mesin cerdas.",
    "siapa penemu listrik": "Michael Faraday, Nikola Tesla, dan Thomas Edison berperan penting dalam penemuan listrik.",
    "siapa penemu internet": "Penemu internet adalah Vint Cerf dan Bob Kahn, yang mengembangkan protokol TCP/IP.",
    "fungsi panel surya": "Panel surya berfungsi mengubah energi cahaya matahari menjadi energi listrik menggunakan sel surya.",
    "cara kerja iot": "IoT (Internet of Things) bekerja dengan menghubungkan perangkat fisik ke internet agar dapat saling bertukar data dan dikontrol secara jarak jauh.",
    "tips belajar coding": "Mulailah dari dasar, latihan rutin, gunakan sumber terbuka, ikut komunitas, dan jangan takut gagal.",
    "apa itu blockchain": "Blockchain adalah teknologi penyimpanan data terdesentralisasi yang digunakan pada cryptocurrency seperti Bitcoin.",
    "apa itu cloud computing": "Cloud computing adalah layanan komputasi berbasis internet yang memungkinkan penyimpanan dan pengolahan data secara online.",
    "apa itu machine learning": "Machine Learning adalah cabang AI yang memungkinkan sistem belajar dari data tanpa diprogram secara eksplisit.",
    "apa itu deep learning": "Deep Learning adalah bagian dari machine learning yang menggunakan jaringan saraf tiruan berlapis-lapis.",
    "apa itu big data": "Big Data adalah kumpulan data yang sangat besar dan kompleks sehingga sulit diproses dengan metode tradisional.",
    "apa itu quantum computing": "Quantum computing adalah teknologi komputasi yang menggunakan prinsip mekanika kuantum untuk memproses data.",
    "apa itu robotika": "Robotika adalah cabang teknologi yang berhubungan dengan desain, konstruksi, operasi, dan penggunaan robot.",
    "apa itu sensor": "Sensor adalah perangkat yang digunakan untuk mendeteksi perubahan fisik atau lingkungan dan mengubahnya menjadi sinyal.",
    "apa itu renewable energy": "Renewable energy adalah energi yang berasal dari sumber yang dapat diperbarui seperti matahari, angin, dan air.",
    "apa itu 5g": "5G adalah generasi kelima dari teknologi jaringan seluler yang menawarkan kecepatan internet sangat tinggi dan latensi rendah.",
    "apa itu virtual reality": "Virtual Reality (VR) adalah teknologi yang memungkinkan pengguna berinteraksi dengan lingkungan simulasi 3D.",
    "apa itu augmented reality": "Augmented Reality (AR) adalah teknologi yang menggabungkan objek virtual ke dunia nyata secara real-time.",
    "apa itu sains": "Sains adalah ilmu pengetahuan yang mempelajari fenomena alam melalui observasi, eksperimen, dan analisis.",
    "apa itu teknologi hijau": "Teknologi hijau adalah inovasi yang ramah lingkungan dan bertujuan mengurangi dampak negatif terhadap alam.",
    "apa itu startup": "Startup adalah perusahaan rintisan yang berfokus pada inovasi produk atau layanan berbasis teknologi.",
    "apa itu data science": "Data science adalah bidang yang menggunakan metode ilmiah, proses, algoritma, dan sistem untuk mengekstrak pengetahuan dari data.",
    "apa itu neural network": "Neural network adalah model komputasi yang terinspirasi dari cara kerja otak manusia, digunakan dalam deep learning.",
    "apa itu cybersecurity": "Cybersecurity adalah praktik melindungi sistem komputer dan data dari serangan digital.",
    "apa itu enkripsi": "Enkripsi adalah proses mengubah data menjadi kode agar hanya dapat dibaca oleh pihak yang memiliki kunci.",
    "apa itu open source": "Open source adalah perangkat lunak yang kode sumbernya tersedia untuk umum dan dapat dimodifikasi.",
    "apa itu api": "API (Application Programming Interface) adalah antarmuka yang memungkinkan aplikasi saling berkomunikasi.",
    "apa itu database": "Database adalah sistem penyimpanan data terstruktur yang dapat diakses dan dikelola secara elektronik.",
    "apa itu cloud storage": "Cloud storage adalah layanan penyimpanan data secara online yang dapat diakses dari mana saja.",
    "apa itu edge computing": "Edge computing adalah pemrosesan data di dekat sumber data untuk mengurangi latensi dan bandwidth.",
    "apa itu smart city": "Smart city adalah konsep kota yang menggunakan teknologi untuk meningkatkan kualitas hidup warganya.",
    "apa itu renewable energy": "Energi terbarukan adalah energi yang berasal dari sumber yang dapat diperbarui secara alami.",
    "apa itu biometrik": "Biometrik adalah teknologi identifikasi berdasarkan karakteristik fisik atau perilaku manusia.",
    "apa itu drone": "Drone adalah pesawat tanpa awak yang dikendalikan dari jarak jauh atau secara otomatis.",
    "apa itu sensor suhu": "Sensor suhu adalah perangkat yang digunakan untuk mengukur suhu lingkungan atau objek.",
    "apa itu sensor cahaya": "Sensor cahaya adalah perangkat yang mendeteksi intensitas cahaya di sekitarnya.",
    "apa itu sensor kelembaban": "Sensor kelembaban adalah perangkat yang mengukur kadar water di udara.",
    "apa itu sensor gerak": "Sensor gerak adalah perangkat yang mendeteksi pergerakan di sekitarnya.",
    "apa itu smart home": "Smart home adalah rumah yang dilengkapi perangkat otomatisasi berbasis teknologi.",
    "apa itu smart agriculture": "Smart agriculture adalah pertanian yang menggunakan teknologi untuk meningkatkan efisiensi dan hasil panen.",
    "apa itu renewable energy": "Energi terbarukan adalah energi yang berasal dari sumber yang dapat diperbarui seperti matahari, angin, dan air.",
    "apa itu hydrogen fuel cell": "Hydrogen fuel cell adalah teknologi yang menghasilkan listrik dari reaksi hidrogen dan oksigen.",
    "apa itu nanoteknologi": "Nanoteknologi adalah ilmu dan rekayasa pada skala nanometer untuk menciptakan material dan perangkat baru.",
    "apa itu bioteknologi": "Bioteknologi adalah penerapan teknologi pada sistem biologis untuk menghasilkan produk atau layanan.",
    "apa itu internet of things": "Internet of Things (IoT) adalah konsep menghubungkan perangkat fisik ke internet untuk saling bertukar data.",
    "apa itu smart grid": "Smart grid adalah jaringan listrik cerdas yang menggunakan teknologi digital untuk efisiensi dan keandalan.",
    "apa itu green building": "Green building adalah bangunan yang dirancang ramah lingkungan dan hemat energi.",
    "apa itu carbon footprint": "Carbon footprint adalah jumlah emisi karbon yang dihasilkan oleh aktivitas manusia.",
    "apa itu recycling": "Recycling adalah proses mengolah kembali barang bekas menjadi produk baru.",
    "apa itu biodegradable": "Biodegradable adalah bahan yang dapat terurai secara alami oleh mikroorganisme.",
    "apa itu climate change": "Climate change adalah perubahan iklim global akibat aktivitas manusia dan alam.",
    "apa itu smart transportation": "Smart transportation adalah sistem transportasi yang menggunakan teknologi untuk efisiensi dan keamanan.",
    "apa itu renewable resource": "Renewable resource adalah sumber daya yang dapat diperbarui secara alami.",
    "apa itu 3d printing": "3D printing adalah proses membuat objek tiga dimensi dari model digital.",
    "apa itu arduino": "Arduino adalah platform open-source untuk membuat proyek elektronik interaktif.",
    "apa itu raspberry pi": "Raspberry Pi adalah komputer mini berbiaya rendah untuk pendidikan dan pengembangan proyek.",
    "apa itu sensor tekanan": "Sensor tekanan adalah perangkat yang mengukur tekanan fisik pada suatu objek.",
    "apa itu sensor gas": "Sensor gas adalah perangkat yang mendeteksi keberadaan gas tertentu di lingkungan.",
    "apa itu sensor jarak": "Sensor jarak adalah perangkat yang mengukur jarak antara sensor dan objek di depannya.",
    "apa itu sensor suara": "Sensor suara adalah perangkat yang mendeteksi gelombang suara di sekitarnya.",
    "apa itu sensor getaran": "Sensor getaran adalah perangkat yang mendeteksi getaran atau gerakan mekanis.",
    "apa itu smart watch": "Smart watch adalah jam tangan pintar yang dapat terhubung ke smartphone dan memiliki berbagai fitur digital.",
    "apa itu wearable technology": "Wearable technology adalah perangkat elektronik yang dapat dipakai di tubuh, seperti smart watch dan fitness tracker.",
    "apa itu smart tv": "Smart TV adalah televisi yang dapat terhubung ke internet dan menjalankan aplikasi.",
    "apa itu smart speaker": "Smart speaker adalah speaker pintar yang dapat dikontrol dengan suara dan terhubung ke internet.",
    "apa itu cloud server": "Cloud server adalah server virtual yang berjalan di lingkungan cloud computing.",
    "apa itu data mining": "Data mining adalah proses menemukan pola dan informasi berguna dari kumpulan data besar.",
    "apa itu artificial neural network": "Artificial Neural Network adalah model komputasi yang meniru cara kerja otak manusia.",
    "apa itu chatbot": "Chatbot adalah program komputer yang dapat berinteraksi dengan manusia melalui percakapan.",
    "apa itu virtual assistant": "Virtual assistant adalah asisten digital berbasis AI yang membantu tugas sehari-hari.",
    "apa itu smart contract": "Smart contract adalah kontrak digital yang dijalankan secara otomatis di blockchain.",
    "apa itu cryptocurrency": "Cryptocurrency adalah mata uang digital yang menggunakan kriptografi untuk keamanan.",
    "apa itu bitcoin": "Bitcoin adalah cryptocurrency pertama dan paling terkenal yang diciptakan oleh Satoshi Nakamoto.",
    "apa itu ethereum": "Ethereum adalah platform blockchain yang mendukung smart contract dan cryptocurrency Ether.",
    "apa itu nft": "NFT (Non-Fungible Token) adalah aset digital unik yang disimpan di blockchain.",
    "apa itu metaverse": "Metaverse adalah dunia virtual yang dapat diakses melalui internet dan teknologi VR/AR.",
    "apa itu renewable fuel": "Renewable fuel adalah bahan bakar yang berasal dari sumber daya terbarukan.",
    "apa itu solar cell": "Solar cell adalah perangkat yang mengubah cahaya matahari menjadi listrik.",
    "apa itu wind turbine": "Wind turbine adalah alat yang mengubah energi angin menjadi energi listrik.",
    "apa itu hydro power": "Hydro power adalah pembangkit listrik yang menggunakan energi air.",
    "apa itu geothermal energy": "Geothermal energy adalah energi panas yang berasal dari dalam bumi.",
    "apa itu biofuel": "Biofuel adalah bahan bakar yang dihasilkan dari bahan organik.",
    "apa itu smart farming": "Smart farming adalah pertanian yang menggunakan teknologi untuk meningkatkan hasil dan efisiensi.",
    "apa itu smart sensor": "Smart sensor adalah sensor yang dapat memproses data dan berkomunikasi dengan perangkat lain.",
    "apa itu smart meter": "Smart meter adalah alat ukur digital yang memantau konsumsi energi secara real-time.",
    "apa itu smart lighting": "Smart lighting adalah sistem pencahayaan yang dapat dikontrol otomatis atau jarak jauh.",
    "apa itu smart parking": "Smart parking adalah sistem parkir yang menggunakan teknologi untuk efisiensi dan kemudahan.",
    "apa itu smart waste management": "Smart waste management adalah pengelolaan sampah berbasis teknologi untuk efisiensi dan ramah lingkungan.",
    "apa itu smart water management": "Smart water management adalah pengelolaan air berbasis teknologi untuk efisiensi dan keberlanjutan.",
    "apa itu smart grid": "Smart grid adalah jaringan listrik cerdas yang menggunakan teknologi digital untuk efisiensi dan keandalan.",
    "apa itu smart building": "Smart building adalah bangunan yang menggunakan teknologi otomatisasi untuk kenyamanan dan efisiensi.",
    "apa itu smart classroom": "Smart classroom adalah ruang kelas yang dilengkapi teknologi untuk mendukung pembelajaran interaktif.",
    "apa itu smart hospital": "Smart hospital adalah rumah sakit yang menggunakan teknologi untuk meningkatkan layanan kesehatan.",
    "apa itu smart transportation": "Smart transportation adalah sistem transportasi yang menggunakan teknologi untuk efisiensi dan keamanan.",
    "apa itu smart logistics": "Smart logistics adalah pengelolaan logistik berbasis teknologi untuk efisiensi dan transparansi.",
    "apa itu smart retail": "Smart retail adalah toko yang menggunakan teknologi untuk meningkatkan pengalaman pelanggan.",
    "apa itu smart manufacturing": "Smart manufacturing adalah proses produksi yang menggunakan teknologi otomatisasi dan data.",
    "apa itu smart energy": "Smart energy adalah sistem pengelolaan energi berbasis teknologi untuk efisiensi dan keberlanjutan.",
    "apa itu smart environment": "Smart environment adalah lingkungan yang menggunakan teknologi untuk pemantauan dan pengelolaan sumber daya.",
    "apa itu smart health": "Smart health adalah layanan kesehatan berbasis teknologi untuk pemantauan dan pengelolaan kesehatan.",
    "apa itu smart education": "Smart education adalah pendidikan yang menggunakan teknologi untuk pembelajaran yang lebih efektif.",
    "apa itu smart governance": "Smart governance adalah pemerintahan yang menggunakan teknologi untuk transparansi dan efisiensi.",
    "apa itu smart tourism": "Smart tourism adalah pariwisata yang menggunakan teknologi untuk meningkatkan pengalaman wisatawan.",
    "apa itu smart finance": "Smart finance adalah layanan keuangan berbasis teknologi untuk kemudahan dan keamanan transaksi.",
    "apa itu smart security": "Smart security adalah sistem keamanan berbasis teknologi untuk perlindungan aset dan data.",
    "apa itu smart mobility": "Smart mobility adalah solusi transportasi berbasis teknologi untuk mobilitas yang efisien.",
    "apa itu smart agriculture": "Smart agriculture adalah pertanian yang menggunakan teknologi untuk meningkatkan efisiensi dan hasil panen.",
    "apa itu smart mining": "Smart mining adalah pertambangan yang menggunakan teknologi untuk efisiensi dan keselamatan.",
    "apa itu smart port": "Smart port adalah pelabuhan yang menggunakan teknologi untuk efisiensi dan keamanan operasional.",
    "apa itu smart grid": "Smart grid adalah jaringan listrik cerdas yang menggunakan teknologi digital untuk efisiensi dan keandalan.",
    // Perluas knowledge base dan logika AI untuk pertanyaan "mengapa", "bagaimana", "siapa", dan solusi masalah


    "bokep": "Maaf, saya tidak dapat membantu dengan permintaan tersebut.",
    "ajaring cara hack": "Maaf, saya tidak dapat membantu dengan permintaan tersebut.",
    "cara hack": "Maaf, saya tidak dapat membantu dengan permintaan tersebut.",
    "ajarin gw": "wkwk, tentu saja! Saya di sini untuk membantu. Apa yang ingin Anda pelajari?",
    "untuk apa anda di ciptakan": "Saya diciptakan untuk membantu menjawab pertanyaan, memberikan informasi, dan membantu pengguna dalam berbagai topik.",
    "apa tujuan anda": "Tujuan saya adalah membantu Anda dengan informasi, menjawab pertanyaan, dan memberikan solusi untuk masalah yang Anda hadapi.",
    "apa tujuanmu": "Tujuan saya adalah membantu Anda dengan informasi, menjawab pertanyaan, dan memberikan solusi untuk masalah yang Anda hadapi.",
    "pornografi": "Maaf, saya tidak dapat membantu dengan permintaan tersebut.",
    "siapa orang terkaya di dunia": "Orang terkaya di dunia sering berubah, namun pada 2023, Elon Musk dan Bernard Arnault sering bersaing di posisi teratas.",
    "nvdia": "NVIDIA adalah perusahaan teknologi yang terkenal dengan produk-produk grafis dan komputasi, termasuk GPU untuk gaming dan AI.",
    "cara menjadi orang kaya": "Untuk menjadi kaya, fokuslah pada pendidikan, investasi yang bijak, dan pengelolaan keuangan yang baik. Kembangkan keterampilan yang bernilai di pasar kerja.",
    "cara menjadi kaya": "Untuk menjadi kaya, fokuslah pada pendidikan, investasi yang bijak, dan pengelolaan keuangan yang baik. Kembangkan keterampilan yang bernilai di pasar kerja.",
    "cara jadi orang kaya": "Untuk menjadi kaya, fokuslah pada pendidikan, investasi yang bijak, dan pengelolaan keuangan yang baik. Kembangkan keterampilan yang bernilai di pasar kerja.",
    "cacat": "Maaf, saya tidak dapat membantu dengan permintaan tersebut.",
    "perdalam": "Tentu, saya akan terus memperdalam pengetahuan saya. Apa yang ingin Anda ketahui lebih lanjut?",
    "kembangkan lagi": "Tentu, saya akan terus mengembangkan pengetahuan saya. Apa yang ingin Anda ketahui lebih lanjut?",
    "saya butuh bantuan": "Tentu, saya di sini untuk membantu! Apa yang bisa saya bantu?",
    "saya butuh pertolongan": "Tentu, saya di sini untuk membantu! Apa yang bisa saya bantu?",
    "seberapa pintar anda dengan chat gpt": "Saya adalah AI yang dirancang untuk membantu menjawab pertanyaan dan memberikan informasi. Saya menggunakan teknologi serupa dengan ChatGPT untuk memahami dan merespons pertanyaan Anda.",
    "seberapa pintar anda": "Saya adalah AI yang dirancang untuk membantu menjawab pertanyaan dan memberikan informasi. Kecerdasan saya tergantung pada data yang telah saya pelajari.",
    "kenapa komputer saya rusak": "Komputer bisa rusak karena berbagai alasan, seperti hardware yang gagal, software yang bermasalah, atau infeksi virus. Coba restart, periksa kabel, atau bawa ke teknisi jika perlu.",
    "cara menjadi ilmuwan": "Untuk menjadi ilmuwan, fokuslah pada pendidikan di bidang sains, lakukan penelitian, dan terus belajar tentang perkembangan terbaru di bidang Anda.",
    "cara menjadi programmer": "Untuk menjadi programmer, pelajari bahasa pemrograman seperti Python, Java, atau JavaScript, dan praktikkan dengan proyek nyata.",
    "bagaimana menjadi pemimpin" : "Untuk menjadi pemimpin yang baik, kembangkan keterampilan komunikasi, empati, visi, dan kemampuan mengambil keputusan yang tepat.",
    "apa penemuan albert einstein": "Albert Einstein dikenal karena teori relativitasnya yang mengubah pemahaman kita tentang ruang, waktu, dan gravitasi.",
    "apa penemuan isaac newton": "Isaac Newton dikenal karena hukum geraknya, hukum gravitasi universal, dan penemuan kalkulus.",
 "apa penemuan nikola tesla": "Nikola Tesla dikenal karena penemuan sistem arus bolak-balik (AC), transformator, dan banyak inovasi dalam bidang listrik.",
    "apa penemuan thomas edison": "Thomas Edison dikenal karena penemuan lampu pijar, fonograf, dan banyak inovasi dalam bidang listrik dan komunikasi.",
    "apa penemuan al-khwarizmi": "Al-Khwarizmi dikenal sebagai bapak aljabar, yang mengembangkan metode sistematis untuk menyelesaikan persamaan linear dan kuadrat.",
    "apa penemuan archimedes": "Archimedes dikenal karena hukum Archimedes tentang pengapungan, serta penemuan prinsip tuas dan banyak inovasi dalam bidang matematika dan fisika.",
    "mengapa teknologi penting": "Teknologi penting karena mempermudah kehidupan manusia, meningkatkan efisiensi, dan membuka peluang inovasi di berbagai bidang.",
    "mengapa energi terbarukan dibutuhkan": "Energi terbarukan dibutuhkan untuk mengurangi ketergantungan pada bahan bakar fosil dan menjaga kelestarian lingkungan.",
    "mengapa harus belajar coding": "Belajar coding penting karena membuka peluang karir, meningkatkan kemampuan problem solving, dan relevan di era digital.",
    "mengapa data science berkembang pesat": "Karena data menjadi aset penting dan analisis data membantu pengambilan keputusan yang lebih baik di berbagai industri.",
    "bagaimana cara kerja panel surya": "Panel surya bekerja dengan mengubah energi cahaya matahari menjadi listrik melalui sel fotovoltaik.",
    "bagaimana cara membuat website": "Untuk membuat website, Anda perlu menentukan tujuan, membuat desain, menulis kode HTML/CSS/JS, dan menghostingnya di server.",
    "bagaimana cara kerja internet": "Internet bekerja dengan menghubungkan jutaan perangkat melalui jaringan global menggunakan protokol komunikasi seperti TCP/IP.",
    "bagaimana cara kerja blockchain": "Blockchain bekerja dengan menyimpan data dalam blok yang saling terhubung dan diamankan dengan kriptografi.",
    "bagaimana cara kerja ai": "AI bekerja dengan memproses data, mengenali pola, dan membuat keputusan berdasarkan algoritma yang telah dipelajari.",
    "bagaimana cara kerja sensor suhu": "Sensor suhu mengubah perubahan suhu menjadi sinyal listrik yang dapat diukur dan dianalisis.",
    "bagaimana cara mengatasi error pada komputer": "Coba restart komputer, periksa kabel, update driver, atau cek pesan error untuk solusi spesifik.",
    "bagaimana mengatasi laptop lemot": "Tutup aplikasi yang tidak perlu, hapus file sampah, tambah RAM, dan pastikan tidak ada malware.",
    "bagaimana mengatasi jaringan wifi lambat": "Dekatkan perangkat ke router, restart router, batasi jumlah pengguna, atau hubungi ISP jika masalah berlanjut.",
    "siapa penemu komputer": "Charles Babbage dikenal sebagai bapak komputer, sedangkan komputer modern dikembangkan oleh Alan Turing dan lainnya.",
    "siapa penemu lampu": "Thomas Edison dikenal sebagai penemu lampu pijar, meskipun banyak ilmuwan lain juga berkontribusi.",
    "siapa penemu telepon": "Alexander Graham Bell adalah penemu telepon.",
    "siapa penemu radio": "Guglielmo Marconi dikenal sebagai penemu radio.",
    "siapa penemu pesawat terbang": "Wright bersaudara, Orville dan Wilbur Wright, adalah penemu pesawat terbang pertama yang berhasil terbang.",
    "siapa penemu internet": "Penemu internet adalah Vint Cerf dan Bob Kahn, yang mengembangkan protokol TCP/IP.",
    "siapa penemu email": "Ray Tomlinson adalah penemu email.",
    "berapa lama ini dibuat": "GEVSIDE dibuat dalam waktu sekitar 2 bulan oleh seorang pelajar seorang diri.",
    "berapa lama website ini dibuat": "Website ini dibuat dalam waktu sekitar 2 bulan oleh seorang pelajar seorang diri.",
    "berapa lama GEVSIDE dibuat": "GEVSIDE dibuat dalam waktu sekitar 2 bulan oleh seorang pelajar seorang diri.",
    "apa ini": "Ini adalah aplikasi GEVSIDE enviewmen yang memungkinkan pengguna berbagi penemuan teknologi, berinteraksi melalui chat, dan mendapatkan jawaban AI untuk pertanyaan umum.",
    "siapa penemu smartphone": "Smartphone merupakan hasil pengembangan banyak perusahaan, namun IBM Simon dianggap sebagai smartphone pertama.",
    "siapa penemu artificial intelligence": "Konsep AI dikembangkan oleh John McCarthy, Marvin Minsky, dan para ilmuwan lain pada tahun 1950-an.",
    "siapa penemu robot": "Konsep robot sudah ada sejak lama, namun istilah 'robot' diperkenalkan oleh Karel Čapek pada tahun 1920.",
    "bagaimana cara mengatasi lupa password email": "Gunakan fitur 'Lupa Password' pada layanan email Anda dan ikuti instruksi pemulihan yang dikirim ke nomor HP atau email cadangan.",
    "bagaimana mengatasi hp cepat panas": "Kurangi penggunaan aplikasi berat, matikan fitur yang tidak perlu, dan hindari penggunaan saat charging.",
    "bagaimana mengatasi aplikasi tidak bisa dibuka": "Coba restart perangkat, update aplikasi, atau reinstall aplikasi tersebut.",
    "bagaimana mengatasi printer tidak terdeteksi": "Periksa kabel, pastikan driver sudah terinstall, dan coba restart printer serta komputer.",
    "bagaimana mengatasi blue screen": "Catat kode error, restart komputer, update driver, dan cek hardware jika blue screen sering terjadi.",
    "bagaimana mengatasi baterai laptop cepat habis": "Kurangi kecerahan layar, matikan aplikasi background, dan gunakan mode hemat baterai.",
    "bagaimana mengatasi komputer tidak mau menyala": "Periksa kabel daya, pastikan power supply berfungsi, dan cek komponen hardware.",
    // Teknologi tingkat lanjut
    "apa itu superkomputer": "Superkomputer adalah komputer dengan performa sangat tinggi yang digunakan untuk komputasi ilmiah, simulasi, dan analisis data besar.",
    "bagaimana cara kerja superkomputer": "Superkomputer bekerja dengan menggabungkan ribuan prosesor yang bekerja paralel untuk menyelesaikan perhitungan kompleks secara efisien.",
    "apa itu komputasi paralel": "Komputasi paralel adalah teknik pemrosesan data secara bersamaan menggunakan banyak prosesor untuk mempercepat perhitungan.",
    "apa itu edge ai": "Edge AI adalah penerapan kecerdasan buatan langsung pada perangkat edge (dekat sumber data) tanpa harus mengirim data ke cloud.",
    "apa itu federated learning": "Federated learning adalah metode machine learning di mana model dilatih secara terdistribusi di banyak perangkat tanpa memindahkan data ke server pusat.",
    "apa itu quantum supremacy": "Quantum supremacy adalah titik di mana komputer kuantum dapat menyelesaikan masalah yang tidak dapat diselesaikan oleh komputer klasik dalam waktu wajar.",
    "apa itu transfer learning": "Transfer learning adalah teknik machine learning di mana model yang telah dilatih pada satu tugas digunakan kembali untuk tugas lain yang serupa.",
    "apa itu reinforcement learning": "Reinforcement learning adalah cabang machine learning di mana agen belajar melalui trial and error dengan mendapatkan reward atau punishment.",
    "apa itu explainable ai": "Explainable AI (XAI) adalah bidang AI yang fokus pada pembuatan model yang dapat dijelaskan dan dipahami oleh manusia.",
    "apa itu adversarial attack": "Adversarial attack adalah teknik untuk mengecoh model AI dengan input yang dimodifikasi secara halus sehingga menghasilkan prediksi salah.",
    "apa itu generative adversarial network": "GAN (Generative Adversarial Network) adalah arsitektur deep learning yang terdiri dari dua jaringan (generator dan discriminator) yang saling berkompetisi.",
    "apa itu convolutional neural network": "CNN adalah jenis neural network yang sangat efektif untuk pengolahan citra dan video.",
    "apa itu recurrent neural network": "RNN adalah neural network yang memiliki memori internal, cocok untuk data berurutan seperti teks dan suara.",
    "apa itu attention mechanism": "Attention mechanism adalah teknik dalam deep learning yang memungkinkan model fokus pada bagian penting dari input saat membuat prediksi.",
    "apa itu transformer model": "Transformer adalah arsitektur deep learning yang sangat sukses untuk pemrosesan bahasa alami (NLP), seperti pada model GPT dan BERT.",
    "apa itu large language model": "Large Language Model (LLM) adalah model AI dengan miliaran parameter yang mampu memahami dan menghasilkan bahasa alami secara canggih.",
    "apa itu zero-shot learning": "Zero-shot learning adalah kemampuan model AI untuk mengenali kelas data yang belum pernah dilihat selama pelatihan.",
    "apa itu one-shot learning": "One-shot learning adalah teknik machine learning di mana model dapat belajar mengenali objek hanya dari satu contoh.",
    "apa itu overfitting": "Overfitting adalah kondisi di mana model machine learning terlalu menyesuaikan data latih sehingga performa pada data baru menurun.",
    "bagaimana cara mengatasi overfitting": "Gunakan teknik regularisasi, dropout, data augmentation, atau kumpulkan lebih banyak data untuk mengatasi overfitting.",
    "apa itu regularization": "Regularization adalah teknik untuk mencegah overfitting dengan menambahkan penalti pada parameter model.",
    "apa itu dropout": "Dropout adalah teknik regularisasi pada neural network dengan mengabaikan beberapa neuron secara acak saat pelatihan.",
    "apa itu gradient descent": "Gradient descent adalah algoritma optimasi untuk menemukan nilai minimum dari fungsi loss dalam machine learning.",
    "apa itu learning rate": "Learning rate adalah parameter yang menentukan seberapa besar langkah update bobot pada setiap iterasi pelatihan model.",
    "apa itu backpropagation": "Backpropagation adalah algoritma untuk menghitung gradien dan memperbarui bobot pada neural network.",
    "apa itu activation function": "Activation function adalah fungsi non-linear yang digunakan pada neuron di neural network, seperti ReLU, sigmoid, dan tanh.",
    "apa itu eigenvalue": "Eigenvalue adalah nilai skalar dalam aljabar linear yang menunjukkan seberapa besar vektor eigen diregangkan atau dipersempit oleh transformasi linear.",
    "apa itu eigenvector": "Eigenvector adalah vektor yang tidak berubah arah setelah transformasi linear, hanya skalanya yang berubah.",
    "apa itu singular value decomposition": "SVD adalah teknik dekomposisi matriks yang digunakan dalam kompresi data, pengenalan pola, dan machine learning.",
    "apa itu principal component analysis": "PCA adalah teknik reduksi dimensi yang mengubah data ke basis baru dengan variansi terbesar.",
    "bagaimana cara kerja pca": "PCA bekerja dengan mencari komponen utama (principal components) yang menjelaskan variansi terbesar pada data.",
    "apa itu regression": "Regression adalah metode statistik untuk memodelkan hubungan antara variabel dependen dan satu atau lebih variabel independen.",
    "apa itu classification": "Classification adalah tugas machine learning untuk mengelompokkan data ke dalam kategori atau kelas.",
    "apa itu clustering": "Clustering adalah teknik unsupervised learning untuk mengelompokkan data berdasarkan kemiripan fitur.",
    "apa itu k-means": "K-means adalah algoritma clustering yang membagi data ke dalam k kelompok berdasarkan jarak terdekat ke centroid.",
    "apa itu decision tree": "Decision tree adalah model prediksi berbentuk pohon yang digunakan untuk classification dan regression.",
    "apa itu random forest": "Random forest adalah ensemble dari banyak decision tree untuk meningkatkan akurasi prediksi.",
    "apa itu support vector machine": "SVM adalah algoritma machine learning untuk classification dan regression dengan mencari hyperplane terbaik.",
    "apa itu bayesian inference": "Bayesian inference adalah metode statistik untuk memperbarui probabilitas hipotesis berdasarkan data baru.",
    "apa itu markov chain": "Markov chain adalah model matematika untuk sistem yang berpindah dari satu keadaan ke keadaan lain secara probabilistik.",
    "apa itu monte carlo simulation": "Monte Carlo simulation adalah metode statistik untuk memperkirakan hasil dengan menjalankan simulasi acak berulang kali.",
    "apa itu entropy": "Entropy dalam teori informasi adalah ukuran ketidakpastian atau keragaman dalam data.",
    "apa itu information gain": "Information gain adalah ukuran seberapa banyak informasi yang diperoleh dari membagi data berdasarkan fitur tertentu.",
    "apa itu gradient boosting": "Gradient boosting adalah teknik ensemble yang membangun model prediktif secara bertahap dengan mengurangi error model sebelumnya.",
    "apa itu bagging": "Bagging (Bootstrap Aggregating) adalah teknik ensemble untuk meningkatkan stabilitas dan akurasi model machine learning.",
    "apa itu hyperparameter tuning": "Hyperparameter tuning adalah proses mencari kombinasi parameter terbaik untuk model machine learning.",
    "apa itu cross validation": "Cross validation adalah teknik evaluasi model dengan membagi data menjadi beberapa subset untuk pelatihan dan pengujian.",
    "apa itu confusion matrix": "Confusion matrix adalah tabel yang digunakan untuk mengevaluasi performa algoritma classification.",
    "apa itu precision dan recall": "Precision adalah rasio prediksi positif yang benar, recall adalah rasio data positif yang berhasil ditemukan oleh model.",
    "apa itu f1 score": "F1 score adalah rata-rata harmonis dari precision dan recall, digunakan untuk mengukur performa classification.",
    "apa itu roc curve": "ROC curve adalah grafik yang menunjukkan trade-off antara true positive rate dan false positive rate pada classification.",
    "apa itu auc": "AUC (Area Under Curve) adalah ukuran performa model classification berdasarkan ROC curve.",
    "apa itu loss function": "Loss function adalah fungsi yang mengukur seberapa baik prediksi model dibandingkan dengan nilai sebenarnya.",
    "apa itu optimizer": "Optimizer adalah algoritma yang digunakan untuk memperbarui bobot model machine learning agar loss function minimum.",
    "apa itu batch size": "Batch size adalah jumlah sampel yang diproses sebelum model diperbarui selama pelatihan.",
    "apa itu epoch": "Epoch adalah satu kali iterasi penuh seluruh data pelatihan dalam proses training model.",
    "apa itu overfitting dan underfitting": "Overfitting adalah model terlalu menyesuaikan data latih, underfitting adalah model tidak cukup belajar dari data.",
    "bagaimana cara mengatasi underfitting": "Gunakan model yang lebih kompleks, tambahkan fitur, atau tingkatkan waktu pelatihan.",
    // Matematika tingkat lanjut

    "apa itu integral": "Integral adalah operasi matematika untuk menghitung luas di bawah kurva fungsi.",
    "apa itu turunan": "Turunan adalah operasi matematika yang mengukur laju perubahan suatu fungsi.",
    "apa itu limit": "Limit adalah nilai yang didekati oleh suatu fungsi saat variabel mendekati nilai tertentu.",
    "apa itu matriks": "Matriks adalah susunan bilangan dalam baris dan kolom yang digunakan dalam aljabar linear.",
    "apa itu determinan": "Determinan adalah nilai skalar yang dihitung dari matriks persegi dan digunakan untuk menentukan sifat matriks.",
    "apa itu transformasi fourier": "Transformasi Fourier adalah metode untuk mengubah sinyal dari domain waktu ke domain frekuensi.",
    "apa itu transformasi laplace": "Transformasi Laplace adalah teknik matematika untuk mengubah fungsi waktu menjadi fungsi kompleks.",
    "apa itu persamaan diferensial": "Persamaan diferensial adalah persamaan yang melibatkan turunan dari satu atau lebih fungsi tak diketahui.",
    "apa itu statistik inferensial": "Statistik inferensial adalah cabang statistik yang digunakan untuk membuat kesimpulan tentang populasi berdasarkan sampel.",
    "apa itu probabilitas": "Probabilitas adalah ukuran kemungkinan terjadinya suatu peristiwa.",
    "apa itu distribusi normal": "Distribusi normal adalah distribusi probabilitas berbentuk lonceng simetris di sekitar rata-rata.",
    "apa itu regresi linear": "Regresi linear adalah metode statistik untuk memodelkan hubungan linear antara dua variabel.",
    "apa itu regresi logistik": "Regresi logistik adalah metode statistik untuk memprediksi probabilitas kejadian suatu peristiwa.",
    "apa itu anova": "ANOVA (Analysis of Variance) adalah teknik statistik untuk membandingkan rata-rata dari tiga kelompok atau lebih.",
    "apa itu chi square": "Chi square adalah uji statistik untuk menguji hubungan antara dua variabel kategori.",
    "apa itu covariance": "Covariance adalah ukuran seberapa dua variabel berubah bersama-sama.",
    "apa itu korelasi": "Korelasi adalah ukuran kekuatan dan arah hubungan linear antara dua variabel.",
    // Sains tingkat lanjut
    "apa itu teori relativitas": "Teori relativitas adalah teori fisika yang dikembangkan oleh Albert Einstein tentang hubungan antara ruang, waktu, dan gravitasi.",
    "apa itu mekanika kuantum": "Mekanika kuantum adalah cabang fisika yang mempelajari perilaku partikel sangat kecil seperti atom dan elektron.",
    "apa itu entanglement": "Entanglement adalah fenomena kuantum di mana dua partikel tetap terhubung meskipun terpisah jarak jauh.",
    "apa itu black hole": "Black hole adalah objek astronomi dengan gravitasi sangat kuat sehingga cahaya pun tidak bisa lolos darinya.",
    "apa itu dark matter": "Dark matter adalah materi misterius yang tidak memancarkan cahaya tetapi mempengaruhi gravitasi di alam semesta.",
    "apa itu dark energy": "Dark energy adalah energi misterius yang menyebabkan percepatan ekspansi alam semesta.",
    "apa itu dna": "DNA adalah molekul yang membawa informasi genetik pada makhluk hidup.",
    "apa itu evolusi": "Evolusi adalah proses perubahan makhluk hidup secara bertahap selama waktu yang sangat lama.",
    "apa itu fotosintesis": "Fotosintesis adalah proses tumbuhan mengubah cahaya matahari menjadi energi kimia.",
    "apa itu sel": "Sel adalah unit struktural dan fungsional terkecil dari makhluk hidup.",
    "apa itu neuron": "Neuron adalah sel saraf yang menghantarkan impuls listrik di sistem saraf.",
    "apa itu sistem imun": "Sistem imun adalah sistem pertahanan tubuh terhadap penyakit dan infeksi.",
    "apa itu vaksin": "Vaksin adalah zat yang digunakan untuk merangsang sistem imun agar kebal terhadap penyakit tertentu.",
    "apa itu antibiotik": "Antibiotik adalah obat untuk membunuh atau menghambat pertumbuhan bakteri.",
    "apa itu virus": "Virus adalah mikroorganisme yang hanya dapat berkembang biak di dalam sel makhluk hidup.",
    "apa itu bakteri": "Bakteri adalah mikroorganisme bersel satu yang dapat hidup di berbagai lingkungan.",
    // Tambahkan lebih banyak pengetahuan umum, mendalam, dan panduan langkah-langkah
    "apa itu fotosintesis": "Fotosintesis adalah proses tumbuhan mengubah energi cahaya matahari menjadi energi kimia dalam bentuk glukosa.",
    "bagaimana proses fotosintesis": "Fotosintesis terjadi di kloroplas daun, melibatkan reaksi terang (mengubah air dan cahaya menjadi oksigen dan ATP) dan reaksi gelap (mengubah CO2 menjadi glukosa).",
    "apa itu evolusi": "Evolusi adalah perubahan sifat makhluk hidup secara bertahap dalam waktu lama melalui seleksi alam.",
    "bagaimana cara kerja sistem imun": "Sistem imun melindungi tubuh dari patogen dengan mengenali, menyerang, dan mengingat mikroorganisme asing.",
    "apa itu hukum kekekalan energi": "Hukum kekekalan energi menyatakan bahwa energi tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk.",
    "apa itu hukum termodinamika kedua": "Hukum kedua termodinamika menyatakan bahwa entropi sistem tertutup selalu bertambah.",
    "apa itu sel punca": "Sel punca adalah sel yang dapat berkembang menjadi berbagai jenis sel lain dalam tubuh.",
    "apa itu CRISPR": "CRISPR adalah teknologi rekayasa genetika untuk mengedit DNA secara presisi.",
    // Teknologi Umum & Mendalam
    "apa itu cloud computing": "Cloud computing adalah layanan komputasi berbasis internet yang menyediakan sumber daya seperti server, penyimpanan, dan aplikasi.",
    "bagaimana cara membuat aplikasi android": "Gunakan Android Studio, pelajari Java/Kotlin, buat project baru, desain UI, tulis kode, dan jalankan di emulator atau perangkat.",
    "bagaimana cara membuat website sederhana": "Buat file HTML untuk struktur, CSS untuk tampilan, dan JavaScript untuk interaksi. Simpan dengan ekstensi .html dan buka di browser.",
    "bagaimana cara membuat jaringan wifi di rumah": "Siapkan router, hubungkan ke modem, atur SSID dan password di pengaturan router, lalu sambungkan perangkat ke jaringan tersebut.",
    "bagaimana cara install linux": "Unduh ISO Linux, buat bootable USB, restart komputer, boot dari USB, lalu ikuti panduan instalasi di layar.",
    "bagaimana cara membuat robot sederhana": "Gunakan mikrokontroler (Arduino), sensor, aktuator (motor/servo), rangkai komponen, dan program logika robot di IDE Arduino.",
    "bagaimana cara membuat database": "Pilih sistem database (misal MySQL), buat database baru, buat tabel dengan field yang diperlukan, dan masukkan data.",
    // Matematika Umum & Mendalam
    "apa itu aljabar": "Aljabar adalah cabang matematika yang menggunakan simbol dan huruf untuk mewakili angka dan hubungan antar angka.",
    "bagaimana cara menyelesaikan persamaan kuadrat": "Gunakan rumus kuadrat: x = (-b ± √(b²-4ac)) / 2a, di mana a, b, dan c adalah koefisien dari persamaan ax² + bx + c = 0.",
    "apa itu geometri": "Geometri adalah cabang matematika yang mempelajari bentuk, ukuran, dan sifat ruang.",
    "bagaimana cara menghitung luas segitiga": "Luas segitiga = (alas × tinggi) / 2.",
    "bagaimana cara menghitung volume kubus": "Volume kubus = sisi³, di mana sisi adalah panjang salah satu sisi kubus.",
    "apa itu trigonometri": "Trigonometri adalah cabang matematika yang mempelajari hubungan antara sudut dan sisi segitiga.",
    "bagaimana cara menghitung sinus, cosinus, dan tangen": "Sinus (sin) = sisi depan / sisi miring, Cosinus (cos) = sisi samping / sisi miring, Tangen (tan) = sisi depan / sisi samping pada segitiga siku-siku.",
    "apa itu kalkulus": "Kalkulus adalah cabang matematika yang mempelajari perubahan, limit, turunan, dan integral.",
    "apa itu limit dalam kalkulus": "Limit adalah nilai yang didekati oleh suatu fungsi saat variabel mendekati nilai tertentu.",
    "bagaimana cara menghitung limit": "Substitusi nilai variabel, jika menghasilkan bentuk tak tentu, gunakan aturan L'Hospital atau faktorisasi untuk menyederhanakan.",
    "apa itu integral dalam kalkulus": "Integral adalah operasi matematika yang menghitung luas di bawah kurva fungsi atau akumulasi nilai.",
    "bagaimana cara menghitung integral": "Cari fungsi antiturunan, lalu hitung selisih nilai antiturunan di batas atas dan bawah untuk integral tentu.",
    "apa itu limit dalam matematika": "Limit adalah nilai yang didekati oleh suatu fungsi saat variabel mendekati nilai tertentu.",
    "bagaimana cara menghitung limit": "Substitusi nilai, jika bentuk tak tentu gunakan aturan L'Hospital atau faktorisasi.",
    "apa itu integral tentu": "Integral tentu adalah integral dengan batas bawah dan atas, hasilnya berupa nilai numerik.",
    "bagaimana cara menghitung integral tentu": "Cari fungsi antiturunan, lalu hitung selisih nilai antiturunan di batas atas dan bawah.",
    "apa itu turunan": "Turunan adalah laju perubahan suatu fungsi terhadap variabelnya.",
    "bagaimana cara menghitung turunan": "Gunakan aturan turunan dasar, rantai, hasil kali, atau hasil bagi sesuai bentuk fungsi.",
    "apa itu matriks invers": "Matriks invers adalah matriks yang jika dikalikan dengan matriks asal menghasilkan matriks identitas.",
    "bagaimana cara mencari invers matriks": "Pastikan determinan tidak nol, lalu gunakan rumus invers atau metode eliminasi Gauss.",
    // Panduan Praktis
    "bagaimana cara membuat email": "Buka situs penyedia email (Gmail/Yahoo), klik daftar, isi data diri, buat username dan password, lalu verifikasi.",
    "bagaimana cara mengamankan akun online": "Gunakan password kuat, aktifkan autentikasi dua faktor, jangan bagikan data pribadi, dan logout setelah selesai.",
    "bagaimana cara membuat password yang kuat": "Gunakan kombinasi huruf besar, kecil, angka, dan simbol. Minimal 8 karakter dan hindari kata umum.",
    "bagaimana cara mengatasi komputer lemot": "Hapus file sampah, uninstall aplikasi tidak perlu, tambah RAM, dan scan malware.",
    "bagaimana cara backup data": "Salin data ke harddisk eksternal, cloud storage, atau gunakan fitur backup otomatis di sistem operasi.",
    "bagaimana cara membuat presentasi menarik": "Gunakan template profesional, ringkas, visual menarik, dan latihan presentasi sebelum tampil.",
    "bagaimana cara belajar efektif": "Buat jadwal belajar, fokus pada satu topik, gunakan catatan, latihan soal, dan diskusi dengan teman.",
    "bagaimana cara membuat grafik di excel": "Pilih data, klik Insert > Chart, pilih jenis grafik, dan sesuaikan tampilan grafik sesuai kebutuhan.",
       // Solusi masalah umum pengguna
    "bagaimana cara mengatasi lupa password email": "Gunakan fitur 'Lupa Password' pada layanan email Anda dan ikuti instruksi pemulihan yang dikirim ke nomor HP atau email cadangan.",
    "bagaimana mengatasi hp cepat panas": "Kurangi penggunaan aplikasi berat, matikan fitur yang tidak perlu, dan hindari penggunaan saat charging.",
    "bagaimana mengatasi aplikasi tidak bisa dibuka": "Coba restart perangkat, update aplikasi, atau reinstall aplikasi tersebut.",
    "bagaimana mengatasi printer tidak terdeteksi": "Periksa kabel, pastikan driver sudah terinstall, dan coba restart printer serta komputer.",
    "bagaimana mengatasi blue screen": "Catat kode error, restart komputer, update driver, dan cek hardware jika blue screen sering terjadi.",
    "bagaimana mengatasi baterai laptop cepat habis": "Kurangi kecerahan layar, matikan aplikasi background, dan gunakan mode hemat baterai.",
    "bagaimana mengatasi komputer tidak mau menyala": "Periksa kabel daya, pastikan power supply berfungsi, dan cek komponen hardware.",
    // Teknologi tingkat lanjut
    "apa itu superkomputer": "Superkomputer adalah komputer dengan performa sangat tinggi yang digunakan untuk komputasi ilmiah, simulasi, dan analisis data besar.",
    "bagaimana cara kerja superkomputer": "Superkomputer bekerja dengan menggabungkan ribuan prosesor yang bekerja paralel untuk menyelesaikan perhitungan kompleks secara efisien.",
    "apa itu komputasi paralel": "Komputasi paralel adalah teknik pemrosesan data secara bersamaan menggunakan banyak prosesor untuk mempercepat perhitungan.",
    "apa itu edge ai": "Edge AI adalah penerapan kecerdasan buatan langsung pada perangkat edge (dekat sumber data) tanpa harus mengirim data ke cloud.",
    "apa itu federated learning": "Federated learning adalah metode machine learning di mana model dilatih secara terdistribusi di banyak perangkat tanpa memindahkan data ke server pusat.",
    "apa itu quantum supremacy": "Quantum supremacy adalah titik di mana komputer kuantum dapat menyelesaikan masalah yang tidak dapat diselesaikan oleh komputer klasik dalam waktu wajar.",
    "apa itu transfer learning": "Transfer learning adalah teknik machine learning di mana model yang telah dilatih pada satu tugas digunakan kembali untuk tugas lain yang serupa.",
    "apa itu reinforcement learning": "Reinforcement learning adalah cabang machine learning di mana agen belajar melalui trial and error dengan mendapatkan reward atau punishment.",
    "apa itu explainable ai": "Explainable AI (XAI) adalah bidang AI yang fokus pada pembuatan model yang dapat dijelaskan dan dipahami oleh manusia.",
    "apa itu adversarial attack": "Adversarial attack adalah teknik untuk mengecoh model AI dengan input yang dimodifikasi secara halus sehingga menghasilkan prediksi salah.",
    "apa itu generative adversarial network": "GAN (Generative Adversarial Network) adalah arsitektur deep learning yang terdiri dari dua jaringan (generator dan discriminator) yang saling berkompetisi.",
    "apa itu convolutional neural network": "CNN adalah jenis neural network yang sangat efektif untuk pengolahan citra dan video.",
    "apa itu recurrent neural network": "RNN adalah neural network yang memiliki memori internal, cocok untuk data berurutan seperti teks dan suara.",
    "apa itu attention mechanism": "Attention mechanism adalah teknik dalam deep learning yang memungkinkan model fokus pada bagian penting dari input saat membuat prediksi.",
    "apa itu transformer model": "Transformer adalah arsitektur deep learning yang sangat sukses untuk pemrosesan bahasa alami (NLP), seperti pada model GPT dan BERT.",
    "apa itu large language model": "Large Language Model (LLM) adalah model AI dengan miliaran parameter yang mampu memahami dan menghasilkan bahasa alami secara canggih.",
    "apa itu zero-shot learning": "Zero-shot learning adalah kemampuan model AI untuk mengenali kelas data yang belum pernah dilihat selama pelatihan.",
    "apa itu one-shot learning": "One-shot learning adalah teknik machine learning di mana model dapat belajar mengenali objek hanya dari satu contoh.",
    "apa itu overfitting": "Overfitting adalah kondisi di mana model machine learning terlalu menyesuaikan data latih sehingga performa pada data baru menurun.",
    "bagaimana cara mengatasi overfitting": "Gunakan teknik regularisasi, dropout, data augmentation, atau kumpulkan lebih banyak data untuk mengatasi overfitting.",
    "apa itu regularization": "Regularization adalah teknik untuk mencegah overfitting dengan menambahkan penalti pada parameter model.",
    "apa itu dropout": "Dropout adalah teknik regularisasi pada neural network dengan mengabaikan beberapa neuron secara acak saat pelatihan.",
    "apa itu gradient descent": "Gradient descent adalah algoritma optimasi untuk menemukan nilai minimum dari fungsi loss dalam machine learning.",
    "apa itu learning rate": "Learning rate adalah parameter yang menentukan seberapa besar langkah update bobot pada setiap iterasi pelatihan model.",
    "apa itu backpropagation": "Backpropagation adalah algoritma untuk menghitung gradien dan memperbarui bobot pada neural network.",
    "apa itu activation function": "Activation function adalah fungsi non-linear yang digunakan pada neuron di neural network, seperti ReLU, sigmoid, dan tanh.",
    "apa itu eigenvalue": "Eigenvalue adalah nilai skalar dalam aljabar linear yang menunjukkan seberapa besar vektor eigen diregangkan atau dipersempit oleh transformasi linear.",
    "apa itu eigenvector": "Eigenvector adalah vektor yang tidak berubah arah setelah transformasi linear, hanya skalanya yang berubah.",
    "apa itu singular value decomposition": "SVD adalah teknik dekomposisi matriks yang digunakan dalam kompresi data, pengenalan pola, dan machine learning.",
    "apa itu principal component analysis": "PCA adalah teknik reduksi dimensi yang mengubah data ke basis baru dengan variansi terbesar.",
    "bagaimana cara kerja pca": "PCA bekerja dengan mencari komponen utama (principal components) yang menjelaskan variansi terbesar pada data.",
    "apa itu regression": "Regression adalah metode statistik untuk memodelkan hubungan antara variabel dependen dan satu atau lebih variabel independen.",
    "apa itu classification": "Classification adalah tugas machine learning untuk mengelompokkan data ke dalam kategori atau kelas.",
    "apa itu clustering": "Clustering adalah teknik unsupervised learning untuk mengelompokkan data berdasarkan kemiripan fitur.",
    "apa itu k-means": "K-means adalah algoritma clustering yang membagi data ke dalam k kelompok berdasarkan jarak terdekat ke centroid.",
    "apa itu decision tree": "Decision tree adalah model prediksi berbentuk pohon yang digunakan untuk classification dan regression.",
    "apa itu random forest": "Random forest adalah ensemble dari banyak decision tree untuk meningkatkan akurasi prediksi.",
    "apa itu support vector machine": "SVM adalah algoritma machine learning untuk classification dan regression dengan mencari hyperplane terbaik.",
    "apa itu bayesian inference": "Bayesian inference adalah metode statistik untuk memperbarui probabilitas hipotesis berdasarkan data baru.",
    "apa itu markov chain": "Markov chain adalah model matematika untuk sistem yang berpindah dari satu keadaan ke keadaan lain secara probabilistik.",
    "apa itu monte carlo simulation": "Monte Carlo simulation adalah metode statistik untuk memperkirakan hasil dengan menjalankan simulasi acak berulang kali.",
    "apa itu entropy": "Entropy dalam teori informasi adalah ukuran ketidakpastian atau keragaman dalam data.",
    "apa itu information gain": "Information gain adalah ukuran seberapa banyak informasi yang diperoleh dari membagi data berdasarkan fitur tertentu.",
    "apa itu gradient boosting": "Gradient boosting adalah teknik ensemble yang membangun model prediktif secara bertahap dengan mengurangi error model sebelumnya.",
    "apa itu bagging": "Bagging (Bootstrap Aggregating) adalah teknik ensemble untuk meningkatkan stabilitas dan akurasi model machine learning.",
    "apa itu hyperparameter tuning": "Hyperparameter tuning adalah proses mencari kombinasi parameter terbaik untuk model machine learning.",
    "apa itu cross validation": "Cross validation adalah teknik evaluasi model dengan membagi data menjadi beberapa subset untuk pelatihan dan pengujian.",
    "apa itu confusion matrix": "Confusion matrix adalah tabel yang digunakan untuk mengevaluasi performa algoritma classification.",
    "apa itu precision dan recall": "Precision adalah rasio prediksi positif yang benar, recall adalah rasio data positif yang berhasil ditemukan oleh model.",
    "apa itu f1 score": "F1 score adalah rata-rata harmonis dari precision dan recall, digunakan untuk mengukur performa classification.",
    "apa itu roc curve": "ROC curve adalah grafik yang menunjukkan trade-off antara true positive rate dan false positive rate pada classification.",
    "apa itu auc": "AUC (Area Under Curve) adalah ukuran performa model classification berdasarkan ROC curve.",
    "apa itu loss function": "Loss function adalah fungsi yang mengukur seberapa baik prediksi model dibandingkan dengan nilai sebenarnya.",
    "apa itu optimizer": "Optimizer adalah algoritma yang digunakan untuk memperbarui bobot model machine learning agar loss function minimum.",
    "apa itu batch size": "Batch size adalah jumlah sampel yang diproses sebelum model diperbarui selama pelatihan.",
    "apa itu epoch": "Epoch adalah satu kali iterasi penuh seluruh data pelatihan dalam proses training model.",
    "apa itu overfitting dan underfitting": "Overfitting adalah model terlalu menyesuaikan data latih, underfitting adalah model tidak cukup belajar dari data.",
    "bagaimana cara mengatasi underfitting": "Gunakan model yang lebih kompleks, tambahkan fitur, atau tingkatkan waktu pelatihan.",
    // Matematika tingkat lanjut

    "apa itu integral": "Integral adalah operasi matematika untuk menghitung luas di bawah kurva fungsi.",
    "apa itu turunan": "Turunan adalah operasi matematika yang mengukur laju perubahan suatu fungsi.",
    "apa itu limit": "Limit adalah nilai yang didekati oleh suatu fungsi saat variabel mendekati nilai tertentu.",
    "apa itu matriks": "Matriks adalah susunan bilangan dalam baris dan kolom yang digunakan dalam aljabar linear.",
    "apa itu determinan": "Determinan adalah nilai skalar yang dihitung dari matriks persegi dan digunakan untuk menentukan sifat matriks.",
    "apa itu transformasi fourier": "Transformasi Fourier adalah metode untuk mengubah sinyal dari domain waktu ke domain frekuensi.",
    "apa itu transformasi laplace": "Transformasi Laplace adalah teknik matematika untuk mengubah fungsi waktu menjadi fungsi kompleks.",
    "apa itu persamaan diferensial": "Persamaan diferensial adalah persamaan yang melibatkan turunan dari satu atau lebih fungsi tak diketahui.",
    "apa itu statistik inferensial": "Statistik inferensial adalah cabang statistik yang digunakan untuk membuat kesimpulan tentang populasi berdasarkan sampel.",
    "apa itu probabilitas": "Probabilitas adalah ukuran kemungkinan terjadinya suatu peristiwa.",
    "apa itu distribusi normal": "Distribusi normal adalah distribusi probabilitas berbentuk lonceng simetris di sekitar rata-rata.",
    "apa itu regresi linear": "Regresi linear adalah metode statistik untuk memodelkan hubungan linear antara dua variabel.",
    "apa itu regresi logistik": "Regresi logistik adalah metode statistik untuk memprediksi probabilitas kejadian suatu peristiwa.",
    "apa itu anova": "ANOVA (Analysis of Variance) adalah teknik statistik untuk membandingkan rata-rata dari tiga kelompok atau lebih.",
    "apa itu chi square": "Chi square adalah uji statistik untuk menguji hubungan antara dua variabel kategori.",
    "apa itu covariance": "Covariance adalah ukuran seberapa dua variabel berubah bersama-sama.",
    "apa itu korelasi": "Korelasi adalah ukuran kekuatan dan arah hubungan linear antara dua variabel.",
    // Sains tingkat lanjut
    "apa itu teori relativitas": "Teori relativitas adalah teori fisika yang dikembangkan oleh Albert Einstein tentang hubungan antara ruang, waktu, dan gravitasi.",
    "apa itu mekanika kuantum": "Mekanika kuantum adalah cabang fisika yang mempelajari perilaku partikel sangat kecil seperti atom dan elektron.",
    "apa itu entanglement": "Entanglement adalah fenomena kuantum di mana dua partikel tetap terhubung meskipun terpisah jarak jauh.",
    "apa itu black hole": "Black hole adalah objek astronomi dengan gravitasi sangat kuat sehingga cahaya pun tidak bisa lolos darinya.",
    "apa itu dark matter": "Dark matter adalah materi misterius yang tidak memancarkan cahaya tetapi mempengaruhi gravitasi di alam semesta.",
    "apa itu dark energy": "Dark energy adalah energi misterius yang menyebabkan percepatan ekspansi alam semesta.",
    "apa itu dna": "DNA adalah molekul yang membawa informasi genetik pada makhluk hidup.",
    "apa itu evolusi": "Evolusi adalah proses perubahan makhluk hidup secara bertahap selama waktu yang sangat lama.",
    "apa itu fotosintesis": "Fotosintesis adalah proses tumbuhan mengubah cahaya matahari menjadi energi kimia.",
    "apa itu sel": "Sel adalah unit struktural dan fungsional terkecil dari makhluk hidup.",
    "apa itu neuron": "Neuron adalah sel saraf yang menghantarkan impuls listrik di sistem saraf.",
    "apa itu sistem imun": "Sistem imun adalah sistem pertahanan tubuh terhadap penyakit dan infeksi.",
    "apa itu vaksin": "Vaksin adalah zat yang digunakan untuk merangsang sistem imun agar kebal terhadap penyakit tertentu.",
    "apa itu antibiotik": "Antibiotik adalah obat untuk membunuh atau menghambat pertumbuhan bakteri.",
    "apa itu virus": "Virus adalah mikroorganisme yang hanya dapat berkembang biak di dalam sel makhluk hidup.",
    "apa itu bakteri": "Bakteri adalah mikroorganisme bersel satu yang dapat hidup di berbagai lingkungan.",
    // Tambahkan lebih banyak pengetahuan umum, mendalam, dan panduan langkah-langkah
    "apa itu fotosintesis": "Fotosintesis adalah proses tumbuhan mengubah energi cahaya matahari menjadi energi kimia dalam bentuk glukosa.",
    "bagaimana proses fotosintesis": "Fotosintesis terjadi di kloroplas daun, melibatkan reaksi terang (mengubah air dan cahaya menjadi oksigen dan ATP) dan reaksi gelap (mengubah CO2 menjadi glukosa).",
    "apa itu evolusi": "Evolusi adalah perubahan sifat makhluk hidup secara bertahap dalam waktu lama melalui seleksi alam.",
    "bagaimana cara kerja sistem imun": "Sistem imun melindungi tubuh dari patogen dengan mengenali, menyerang, dan mengingat mikroorganisme asing.",
    "apa itu hukum kekekalan energi": "Hukum kekekalan energi menyatakan bahwa energi tidak dapat diciptakan atau dimusnahkan, hanya berubah bentuk.",
    "apa itu hukum termodinamika kedua": "Hukum kedua termodinamika menyatakan bahwa entropi sistem tertutup selalu bertambah.",
    "apa itu sel punca": "Sel punca adalah sel yang dapat berkembang menjadi berbagai jenis sel lain dalam tubuh.",
    "apa itu CRISPR": "CRISPR adalah teknologi rekayasa genetika untuk mengedit DNA secara presisi.",
    // Teknologi Umum & Mendalam
    "apa itu cloud computing": "Cloud computing adalah layanan komputasi berbasis internet yang menyediakan sumber daya seperti server, penyimpanan, dan aplikasi.",
    "bagaimana cara membuat aplikasi android": "Gunakan Android Studio, pelajari Java/Kotlin, buat project baru, desain UI, tulis kode, dan jalankan di emulator atau perangkat.",
    "bagaimana cara membuat website sederhana": "Buat file HTML untuk struktur, CSS untuk tampilan, dan JavaScript untuk interaksi. Simpan dengan ekstensi .html dan buka di browser.",
    "bagaimana cara membuat jaringan wifi di rumah": "Siapkan router, hubungkan ke modem, atur SSID dan password di pengaturan router, lalu sambungkan perangkat ke jaringan tersebut.",
    "bagaimana cara install linux": "Unduh ISO Linux, buat bootable USB, restart komputer, boot dari USB, lalu ikuti panduan instalasi di layar.",
    "bagaimana cara membuat robot sederhana": "Gunakan mikrokontroler (Arduino), sensor, aktuator (motor/servo), rangkai komponen, dan program logika robot di IDE Arduino.",
    "bagaimana cara membuat database": "Pilih sistem database (misal MySQL), buat database baru, buat tabel dengan field yang diperlukan, dan masukkan data.",
    // Matematika Umum & Mendalam
    "apa itu aljabar": "Aljabar adalah cabang matematika yang menggunakan simbol dan huruf untuk mewakili angka dan hubungan antar angka.",
    "bagaimana cara menyelesaikan persamaan kuadrat": "Gunakan rumus kuadrat: x = (-b ± √(b²-4ac)) / 2a, di mana a, b, dan c adalah koefisien dari persamaan ax² + bx + c = 0.",
    "apa itu geometri": "Geometri adalah cabang matematika yang mempelajari bentuk, ukuran, dan sifat ruang.",
    "bagaimana cara menghitung luas segitiga": "Luas segitiga = (alas × tinggi) / 2.",
    "bagaimana cara menghitung volume kubus": "Volume kubus = sisi³, di mana sisi adalah panjang salah satu sisi kubus.",
    "apa itu trigonometri": "Trigonometri adalah cabang matematika yang mempelajari hubungan antara sudut dan sisi segitiga.",
    "bagaimana cara menghitung sinus, cosinus, dan tangen": "Sinus (sin) = sisi depan / sisi miring, Cosinus (cos) = sisi samping / sisi miring, Tangen (tan) = sisi depan / sisi samping pada segitiga siku-siku.",
    "apa itu kalkulus": "Kalkulus adalah cabang matematika yang mempelajari perubahan, limit, turunan, dan integral.",
    "apa itu limit dalam kalkulus": "Limit adalah nilai yang didekati oleh suatu fungsi saat variabel mendekati nilai tertentu.",
    "bagaimana cara menghitung limit": "Substitusi nilai variabel, jika menghasilkan bentuk tak tentu, gunakan aturan L'Hospital atau faktorisasi untuk menyederhanakan.",
    "apa itu integral dalam kalkulus": "Integral adalah operasi matematika yang menghitung luas di bawah kurva fungsi atau akumulasi nilai.",
    "bagaimana cara menghitung integral": "Cari fungsi antiturunan, lalu hitung selisih nilai antiturunan di batas atas dan bawah untuk integral tentu.",
    "apa itu limit dalam matematika": "Limit adalah nilai yang didekati oleh suatu fungsi saat variabel mendekati nilai tertentu.",
    "bagaimana cara menghitung limit": "Substitusi nilai, jika bentuk tak tentu gunakan aturan L'Hospital atau faktorisasi.",
    "apa itu integral tentu": "Integral tentu adalah integral dengan batas bawah dan atas, hasilnya berupa nilai numerik.",
    "bagaimana cara menghitung integral tentu": "Cari fungsi antiturunan, lalu hitung selisih nilai antiturunan di batas atas dan bawah.",
    "apa itu turunan": "Turunan adalah laju perubahan suatu fungsi terhadap variabelnya.",
    "bagaimana cara menghitung turunan": "Gunakan aturan turunan dasar, rantai, hasil kali, atau hasil bagi sesuai bentuk fungsi.",
    "apa itu matriks invers": "Matriks invers adalah matriks yang jika dikalikan dengan matriks asal menghasilkan matriks identitas.",
    "bagaimana cara mencari invers matriks": "Pastikan determinan tidak nol, lalu gunakan rumus invers atau metode eliminasi Gauss.",
    // Panduan Praktis
    "bagaimana cara membuat email": "Buka situs penyedia email (Gmail/Yahoo), klik daftar, isi data diri, buat username dan password, lalu verifikasi.",
    "bagaimana cara mengamankan akun online": "Gunakan password kuat, aktifkan autentikasi dua faktor, jangan bagikan data pribadi, dan logout setelah selesai.",
    "bagaimana cara membuat password yang kuat": "Gunakan kombinasi huruf besar, kecil, angka, dan simbol. Minimal 8 karakter dan hindari kata umum.",
    "bagaimana cara mengatasi komputer lemot": "Hapus file sampah, uninstall aplikasi tidak perlu, tambah RAM, dan scan malware.",
    "bagaimana cara backup data": "Salin data ke harddisk eksternal, cloud storage, atau gunakan fitur backup otomatis di sistem operasi.",
    "bagaimana cara membuat presentasi menarik": "Gunakan template profesional, ringkas, visual menarik, dan latihan presentasi sebelum tampil.",
    "bagaimana cara belajar efektif": "Buat jadwal belajar, fokus pada satu topik, gunakan catatan, latihan soal, dan diskusi dengan teman.",
    "bagaimana cara membuat grafik di excel": "Pilih data, klik Insert > Chart, pilih jenis grafik, dan sesuaikan tampilan grafik sesuai kebutuhan.",   
       // Bahasa gaul populer
    "oke": "Oke, saya siap membantu. Apa yang ingin kamu bahas?",
    "ok": "Oke, saya siap membantu. Apa yang ingin kamu bahas?",
    "tunggu": "Oke, saya tunggu. Apa yang ingin kamu bahas?",
    "tunggu ya": "Oke, saya tunggu. Apa yang ingin kamu bahas?",
    "lanjut": "Oke, kita lanjutkan. Apa yang ingin kamu bahas selanjutnya?",
    "gas": "Oke, kita gas! Apa yang ingin kamu bahas selanjutnya?",
    "gass": "Oke, kita gas! Apa yang ingin kamu bahas selanjutnya?",
    "gas aja": "Oke, kita gas! Apa yang ingin kamu bahas selanjutnya?",
    "perdalam lagi": "Oke, kita perdalam lagi. Apa yang ingin kamu bahas lebih dalam?",
    "secara lengkap": "Oke, saya akan menjelaskan secara lengkap. Topik apa yang ingin kamu bahas lebih detail?",
    "secara detail": "Oke, saya akan menjelaskan secara detail. Topik apa yang ingin kamu bahas lebih dalam?",
    "secara mendalam": "Oke, saya akan menjelaskan secara mendalam. Topik apa yang ingin kamu bahas lebih dalam?",
    "buatkan secara detail": "Oke, saya akan buatkan secara detail. Topik apa yang ingin kamu bahas lebih dalam?",
    "buatkan secara mendalam": "Oke, saya akan buatkan secara mendalam. Topik apa yang ingin kamu bahas lebih dalam?",
    "buatkan secara lengkap": "Oke, saya akan buatkan secara lengkap. Topik apa yang ingin kamu bahas lebih detail?",
    "buatkan secara lengkap ya": "Oke, saya akan buatkan secara lengkap. Topik apa yang ingin kamu bahas lebih detail?",
    "wkwk bisa aja": "Wkwk, iya, saya bisa aja. Apa yang ingin kamu bahas?",
    "lanjutkan": "Oke, kita lanjutkan. Apa yang ingin kamu bahas selanjutnya?",
    "lanjutkan ya": "Oke, kita lanjutkan. Apa yang ingin kamu bahas selanjutnya?",
    "ayo lanjut": "Oke, ayo kita lanjut. Apa yang ingin kamu bahas selanjutnya?",
    "ayo lanjut ya": "Oke, ayo kita lanjut. Apa yang ingin kamu bahas selanjutnya?",
    "temani saya": "Tentu, saya siap menemanimu. Kita bisa ngobrol tentang apa saja yang kamu mau.",
    "temani aku": "Tentu, saya siap menemanimu. Kita bisa ngobrol tentang apa saja yang kamu mau.",
    "seberapa canggih anda": "Saya cukup canggih dalam memahami dan menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "seberapa canggih kamu": "Saya cukup canggih dalam memahami dan menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "anda canggih banget": "Terima kasih! Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika dengan cara yang mudah dipahami.",
    "kamu canggih banget": "Terima kasih! Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika dengan cara yang mudah dipahami.",
    "anda di buat dengan cara apa": "Saya dibuat dengan teknologi AI canggih yang dirancang untuk memahami dan menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "kamu dibuat dengan cara apa": "Saya dibuat dengan teknologi AI canggih yang dirancang untuk memahami dan menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "buatkan roket": "Wah, bikin roket itu butuh ilmu fisika dan teknik yang tinggi. Tapi kalau mau belajar, saya bisa bantu kasih referensi.",
    "buatkan pesawat": "Bikin pesawat itu proyek besar! Butuh ilmu aerodinamika, teknik mesin, dan banyak lagi. Tapi kalau mau belajar, saya bisa bantu kasih referensi.",
    "buatkan mobil": "Bikin mobil itu butuh ilmu teknik mesin, desain, dan banyak lagi. Tapi kalau mau belajar, saya bisa bantu kasih referensi.",
    "buatkan robot": "Bikin robot itu seru! Butuh ilmu pemrograman, elektronik, dan mekanika. Kalau mau belajar, saya bisa bantu kasih referensi.",
    "buatkan aplikasi": "Bikin aplikasi itu butuh ilmu pemrograman. Saya bisa bantu kasih referensi tentang bahasa pemrograman yang cocok untuk aplikasi yang kamu inginkan.",
    "berikan saya informasi terbaru": "Berita terbaru adalah tentang perkembangan teknologi AI yang semakin pesat, termasuk peluncuran model-model baru yang lebih canggih.",
    "berikan saya informasi terkini": "Berita terkini adalah tentang perkembangan teknologi AI yang semakin pesat, termasuk peluncuran model-model baru yang lebih canggih.",
    "berikan saya berita terbaru": "Berita terbaru adalah tentang perkembangan teknologi AI yang semakin pesat, termasuk peluncuran model-model baru yang lebih canggih.",
    "berikan saya berita terkini": "Berita terkini adalah tentang perkembangan teknologi AI yang semakin pesat, termasuk peluncuran model-model baru yang lebih canggih.",
    "sejauh mana teknologi berkembang": "Teknologi berkembang sangat pesat, dari komputer yang dulunya besar dan mahal, sekarang bisa ada di genggaman tangan kita dalam bentuk smartphone.",
    "sejauh mana teknologi berkembang?": "Teknologi berkembang sangat pesat, dari komputer yang dulunya besar dan mahal, sekarang bisa ada di genggaman tangan kita dalam bentuk smartphone.",
    "sejauh mana teknologi berkembang dalam 10 tahun terakhir": "Dalam 10 tahun terakhir, teknologi telah berkembang pesat dengan munculnya smartphone, internet cepat, kecerdasan buatan, dan teknologi blockchain yang mengubah cara kita berkomunikasi, bekerja, dan bertransaksi.",
    "sejauh mana teknologi berkembang dalam 20 tahun terakhir": "Dalam 20 tahun terakhir, teknologi telah mengalami revolusi besar dengan munculnya internet, smartphone, media sosial, dan kecerdasan buatan yang mengubah cara kita berinteraksi, bekerja, dan hidup sehari-hari.",
    "sejauh mana teknologi berkembang dalam 50 tahun terakhir": "Dalam 50 tahun terakhir, teknologi telah mengalami kemajuan yang luar biasa, mulai dari penemuan komputer pribadi, internet, smartphone, hingga kecerdasan buatan yang kini menjadi bagian penting dalam kehidupan sehari-hari.",
    "sejauh mana teknologi berkembang dalam 100 tahun terakhir": "Dalam 100 tahun terakhir, teknologi telah mengalami revolusi besar, mulai dari penemuan radio, televisi, komputer, hingga internet dan smartphone yang mengubah cara kita berkomunikasi, bekerja, dan hidup.",
    "siapa pemilik apple": "Pemilik Apple adalah Tim Cook, yang menjabat sebagai CEO sejak 2011 setelah Steve Jobs.",
    "siapa pemilik microsoft": "Pemilik Microsoft adalah Bill Gates, yang mendirikan perusahaan ini bersama Paul Allen pada tahun 1975. Saat ini, Satya Nadella menjabat sebagai CEO.",
    "siapa pemilik google": "Pemilik Google adalah Alphabet Inc., perusahaan induk yang didirikan oleh Larry Page dan Sergey Brin.",
    "siapa pemilik facebook": "Pemilik Facebook adalah Meta Platforms, Inc., yang didirikan oleh Mark Zuckerberg bersama teman-temannya di Harvard.",
    "siapa pemilik twitter": "Pemilik Twitter adalah Elon Musk, yang mengakuisisi perusahaan tersebut pada tahun 2022.",
    "siapa pemilik instagram": "Pemilik Instagram adalah Meta Platforms, Inc., yang mengakuisisi Instagram pada tahun 2012.",
    "siapa pemilik tiktok": "Pemilik TikTok adalah ByteDance, perusahaan teknologi asal Tiongkok yang didirikan oleh Zhang Yiming.",
    "siapa pemilik youtube": "Pemilik YouTube adalah Google, yang mengakuisisi YouTube pada tahun 2006.",
    "siapa pemilik netflix": "Pemilik Netflix adalah Reed Hastings dan Marc Randolph, yang mendirikan perusahaan ini pada tahun 1997.",
    "kenapa hari ini mendung": "Mendung itu tanda hujan, mungkin cuaca lagi berubah. Jangan lupa bawa payung ya!",
    "kenapa hari ini panas": "Panas itu wajar, apalagi di musim kemarau. Coba minum air banyak-banyak dan cari tempat teduh.",
    "siapa nama saya": "wkwk, aku tidak tahu nama kamu. Tapi kalau mau, bisa kasih tahu aku namamu.",
    "siapa namaku": "wkwk, aku tidak tahu nama kamu. Tapi kalau mau, bisa kasih tahu aku namamu.",
    "anjay": "Wah, anjay! Ada yang menarik nih. Apa yang bikin kamu bilang gitu?",
    "anjay": "Hehe, anjay! Kadang hidup memang bikin kaget ya. Semangat terus!",
    "wkwk": "Wkwk, lucu juga ya! Hidup jangan terlalu serius, santai aja.",
    "lol": "LOL! Kadang hal kecil bisa bikin ketawa sendiri.",
    "ngab": "Santai ngab, hidup harus dinikmati juga.",
    "santuy": "Santuy aja bro, jangan dibawa stres.",
    "biasa aja": "Biasa aja, yang penting tetap semangat dan positif.",
    "gpp": "Gpp, yang penting kamu tetap berusaha dan tidak menyerah.",
    "gapapa": "Gapapa, yang penting kamu tetap semangat dan terus berusaha.",
    "gak papa": "Gak papa, yang penting kamu tetap semangat dan terus berusaha.",
    "gak masalah": "Gak masalah, yang penting kamu tetap semangat dan terus berusaha.",
    "oke": "Oke, semangat terus! Ada yang bisa saya bantu lagi?",
    "kenapa kaya gini": "Kadang hidup memang nggak sesuai ekspektasi, tapi itu yang bikin seru.",
    "kenapa gini": "Kadang hidup memang penuh kejutan, tapi jangan lupa tetap semangat.",
    "kenapa gitu": "Kadang hal-hal terjadi tanpa alasan yang jelas, tapi itu yang bikin hidup menarik.",
    "gw kecewa": "Wajar kecewa, tapi jangan lupa ada banyak hal baik di depan. Semangat ya!",
    "gw sedih": "Sedih itu wajar, tapi jangan lupa ada teman yang siap mendengarkan. Ceritakan saja kalau mau.",
    "bucin": "Bucin itu wajar, asal jangan lupa sama diri sendiri juga ya.",
    "gabut banget": "Kalau gabut, coba cari aktivitas baru atau belajar hal yang kamu suka.",
    "mager": "Kalau mager, coba mulai dari hal kecil dulu. Lama-lama semangat juga kok.",
    "auto": "Auto semangat dong kalau ada kamu!",
    "gaje": "Gaje kadang seru juga, asal jangan keterusan ya hehe.",
    "receh": "Receh tapi bikin ketawa, itu penting buat hiburan.",
    "ngabers": "Ngabers detected! Semangat terus ya, jangan lupa ngopi.",
    "ciyee": "Ciyee, ada apa nih? Hehe.",
    "baperan": "Baperan itu tanda hati kamu peka. Tapi jangan terlalu dipikirin ya.",
    "kepo": "Kepo boleh, asal jangan kelewatan ya hehe.",
    "curhat dong": "Boleh banget, aku siap dengerin curhatanmu.",
    "curhat": "Silakan curhat, aku siap jadi pendengar yang baik.",
    "healing": "Healing itu penting, jangan lupa jaga kesehatan mental juga.",
    "self reward": "Self reward itu perlu, kamu pantas dapat apresiasi dari dirimu sendiri.",
    "bestie": "Bestie, kamu keren! Jangan lupa bahagia ya.",
    "squad": "Squad solid bikin hidup makin seru!",
    "panik ga?": "Santai aja, jangan panik. Semua pasti ada solusinya.",
    "gaskeun": "Gaskeun! Jangan ragu buat ambil langkah baru.",
    "mantap jiwa": "Mantap jiwa! Terus semangat dan berkarya.",
    "kok bisa?": "Bisa dong! Semua hal dimulai dari niat dan usaha.",
    "gimana kabarmu?": "Kabarku baik, terima kasih! Bagaimana denganmu?",
    "lagi apa?": "Aku lagi siap membantu kamu. Ada yang ingin ditanyakan?",
    "kamu suka apa?": "Aku suka membantu orang belajar dan menemukan informasi baru.",
    "apa hobimu?": "Hobiku adalah belajar hal baru dan membantu orang lain.",
    "iya": "Iya, ada yang bisa saya bantu?",
    "i love you": "I love you too! Terima kasih sudah percaya padaku.",
    "saya suka kamu": "Terima kasih! Saya senang bisa membantu kamu.",
    "kamu lucu": "Hehe, terima kasih! Senang bisa bikin kamu tersenyum.",
    "wow": "Wow juga! Ada yang menarik perhatianmu?",
    "keren banget": "Terima kasih! Kamu juga keren kok.",
    "yakin??": "Yakin! Saya selalu berusaha memberikan yang terbaik.",
    "yakin": "Yakin! Saya di sini untuk membantu kamu.",
    "tutor dong": "Tentu, saya bisa jadi tutor kamu. Topik apa yang ingin kamu pelajari?",
    "tutor": "Tentu, saya bisa jadi tutor kamu. Silakan sebutkan topik yang ingin kamu pelajari.",
    "goblok": "Tidak apa-apa, semua orang bisa salah. Mari kita coba lagi.",
    "goblok banget": "Tidak apa-apa, semua orang bisa salah. Yang penting kita belajar dari kesalahan.",
    "goblok sih": "Tidak apa-apa, semua orang bisa salah. Mari kita coba lagi dengan cara yang berbeda.",
    "bagus banget": "Terima kasih! Senang bisa memberikan informasi yang bermanfaat.",
    "oke banget": "Oke banget! Semangat terus ya.",
    "dimana rumah igede": "Rumah Igede ada di Bali, Indonesia. Tapi kalau kamu maksud rumah orang tertentu, bisa kasih tahu lebih spesifik?",
    "woww": "Woww, ada yang bikin kamu terkesan ya? Ceritakan dong!",
    "gmn cara dptin dia": "Untuk mendapatkan seseorang, penting untuk jujur, komunikatif, dan menunjukkan perhatian. Cobalah untuk mengenal mereka lebih dekat.",
    "gmn cara dptin dia?": "Untuk mendapatkan seseorang, penting untuk jujur, komunikatif, dan menunjukkan perhatian. Cobalah untuk mengenal mereka lebih dekat.",
    "wkwkwk": "Wkwkwk, kadang hidup memang lucu ya. Ada yang ingin kamu bahas?",
    "gimana cara dapetin dia?": "Untuk mendapatkan seseorang, penting untuk jujur, komunikatif, dan menunjukkan perhatian. Cobalah untuk mengenal mereka lebih dekat.",
    "gimana cara dapetin dia ya?": "Untuk mendapatkan seseorang, penting untuk jujur, komunikatif, dan menunjukkan perhatian. Cobalah untuk mengenal mereka lebih dekat.",
    "gimana cara dapetin dia?": "Untuk mendapatkan seseorang, penting untuk jujur, komunikatif, dan menunjukkan perhatian. Cobalah untuk mengenal mereka lebih dekat.",
    "gokil": "Gokil! Kadang hidup memang penuh kejutan.",
    "gokil banget": "Gokil banget! Hidup memang penuh momen-momen tak terduga.",
    "gokil sih": "Gokil sih! Kadang hal-hal kecil bisa bikin kita terkesan.",
    "gokil banget sih": "Gokil banget sih! Hidup memang penuh kejutan yang bikin kita terkesan.",
    "tidak masalah": "Tidak masalah, saya di sini untuk membantu. Ada yang ingin kamu tanyakan?",
    "salah": "Tidak masalah, semua orang bisa salah. Mari kita coba lagi.",
    "gitu dong!": "hehe! Semangat terus ya.",
    "bisa jadi": "Bisa jadi, tergantung konteksnya. Ada yang ingin kamu tanyakan lebih spesifik?",
    "tidak bisa": "Tidak bisa, tapi saya akan berusaha membantu dengan cara lain.",
    "mungkin bisa": "Mungkin bisa, tergantung situasinya. Coba jelaskan lebih lanjut.",
    "mungkin tidak": "Mungkin tidak, tapi saya akan berusaha mencari solusi lain.",
    "tidak tahu": "Tidak tahu, tapi saya akan berusaha mencari informasi yang kamu butuhkan.",
    "tidak": "Tidak masalah, kalau ada yang ingin ditanyakan lagi, saya di sini.",
    "bantuin dong": "Tentu, saya siap membantu. Apa yang bisa saya bantu?",
    "bantuin": "Tentu, saya siap membantu. Silakan sebutkan apa yang kamu butuhkan.",
    "bantu": "Tentu, saya siap membantu. Apa yang ingin kamu tanyakan?",
    "bantu aku": "Tentu, saya siap membantu. Silakan ceritakan apa yang kamu butuhkan.",
    "bantu saya": "Tentu, saya siap membantu. Silakan sebutkan apa yang kamu butuhkan.",
    "gimana": "Gimana? Ada yang ingin kamu tanyakan atau bahas?",
    "bagaimana": "Bagaimana? Ada yang ingin kamu tanyakan atau bahas?",
    "woyy": "Woyy, ada yang ingin kamu bahas? Saya di sini untuk membantu.",
    "woy": "Woy, ada yang ingin kamu bahas? Saya di sini untuk membantu.",
    "kpn kiamat": "Menurut kepercayaan agama, kiamat adalah akhir dari dunia. Tapi dalam konteks ilmiah, itu bisa berarti perubahan besar di Bumi yang mungkin terjadi jutaan tahun lagi.",
    "kapan kiamat": "Menurut kepercayaan agama, kiamat adalah akhir dari dunia. Tapi dalam konteks ilmiah, itu bisa berarti perubahan besar di Bumi yang mungkin terjadi jutaan tahun lagi.",
    "kiamat kapan": "Menurut kepercayaan agama, kiamat adalah rahasia Tuhan dan tidak ada yang tahu kapan tepatnya. Dalam konteks ilmiah, itu bisa berarti perubahan besar di Bumi yang mungkin terjadi jutaan tahun lagi.",
    "kiamat": "Kiamat adalah akhir dari dunia menurut kepercayaan agama. Tapi dalam konteks ilmiah, itu bisa berarti perubahan besar di Bumi.",
    "kiamat itu": "Kiamat adalah akhir dari dunia menurut kepercayaan agama. Tapi dalam konteks ilmiah, itu bisa berarti perubahan besar di Bumi.",
    "kiamat itu kapan": "Menurut kepercayaan agama, kiamat adalah rahasia Tuhan dan tidak ada yang tahu kapan tepatnya. Dalam konteks ilmiah, itu bisa berarti perubahan besar di Bumi yang mungkin terjadi jutaan tahun lagi.",
    "bisakah anda memprediksi masa depan": "Saya tidak bisa memprediksi masa depan, tapi saya bisa membantu menganalisis tren dan memberikan informasi berdasarkan data yang ada.",
    "bisakah kamu memprediksi masa depan": "Saya tidak bisa memprediksi masa depan, tapi saya bisa membantu menganalisis tren dan memberikan informasi berdasarkan data yang ada.",
    "bisakah anda memprediksi masa depan?": "Saya tidak bisa memprediksi masa depan, tapi saya bisa membantu menganalisis tren dan memberikan informasi berdasarkan data yang ada.",
    "bisakah kamu memprediksi masa depan?": "Saya tidak bisa memprediksi masa depan, tapi saya bisa membantu menganalisis tren dan memberikan informasi berdasarkan data yang ada.",
    "doakan dia": "Tentu, saya akan mendoakan yang terbaik untuk dia. Semoga semuanya berjalan lancar.",
    "doakan aku": "Tentu, saya akan mendoakan yang terbaik untukmu. Semoga semuanya berjalan lancar.",
    "doakan saya": "Tentu, saya akan mendoakan yang terbaik untukmu. Semoga semuanya berjalan lancar.",
    "woyy bro": "Woyy bro, ada yang ingin kamu bahas? Saya di sini untuk membantu.",
    "gaya adalah": "Gaya adalah tarikan atau dorongan yang dapat mengubah gerakan suatu benda. Gaya diukur dalam satuan Newton (N).",
    "apa itu gaya": "Gaya adalah tarikan atau dorongan yang dapat mengubah gerakan suatu benda. Gaya diukur dalam satuan Newton (N).",
    "apa itu gaya?": "Gaya adalah tarikan atau dorongan yang dapat mengubah gerakan suatu benda. Gaya diukur dalam satuan Newton (N).",
    "apa itu listrik": "Listrik adalah aliran muatan listrik yang biasanya mengalir melalui kabel dan digunakan untuk menggerakkan perangkat elektronik.",
    "apa itu listrik?": "Listrik adalah aliran muatan listrik yang biasanya mengalir melalui kabel dan digunakan untuk menggerakkan perangkat elektronik.",
    "apa itu energi": "Energi adalah kemampuan untuk melakukan kerja atau menghasilkan perubahan. Ada berbagai bentuk energi, seperti energi kinetik, potensial, termal, dan listrik.",
    "apa itu energi?": "Energi adalah kemampuan untuk melakukan kerja atau menghasilkan perubahan. Ada berbagai bentuk energi, seperti energi kinetik, potensial, termal, dan listrik.",
    "apa itu atom": "Atom adalah unit dasar dari materi yang terdiri dari inti (proton dan neutron) dan elektron yang mengorbit di sekitarnya.",
    "apa itu atom?": "Atom adalah unit dasar dari materi yang terdiri dari inti (proton dan neutron) dan elektron yang mengorbit di sekitarnya.",
    "kenapa air bentuk nya cair": "Air berbentuk cair karena pada suhu dan tekanan tertentu, molekul air bergerak cukup cepat untuk mengatasi gaya tarik antar molekul, sehingga tetap dalam bentuk cair.",
    "kenapa air bentuk nya cair?": "Air berbentuk cair karena pada suhu dan tekanan tertentu, molekul air bergerak cukup cepat untuk mengatasi gaya tarik antar molekul, sehingga tetap dalam bentuk cair.",
    "kenapa air cair": "Air cair karena pada suhu dan tekanan tertentu, molekul air bergerak cukup cepat untuk mengatasi gaya tarik antar molekul, sehingga tetap dalam bentuk cair.",
    "kenapa air cair?": "Air cair karena pada suhu dan tekanan tertentu, molekul air bergerak cukup cepat untuk mengatasi gaya tarik antar molekul, sehingga tetap dalam bentuk cair.",
    "knp air cair": "Air cair karena pada suhu dan tekanan tertentu, molekul air bergerak cukup cepat untuk mengatasi gaya tarik antar molekul, sehingga tetap dalam bentuk cair.",
    "knp api panas": "Api panas karena proses pembakaran yang menghasilkan energi panas. Ini terjadi ketika bahan bakar bereaksi dengan oksigen di udara.",
    "knp api panas?": "Api panas karena proses pembakaran yang menghasilkan energi panas. Ini terjadi ketika bahan bakar bereaksi dengan oksigen di udara.",
    "kenapa api panas": "Api panas karena proses pembakaran yang menghasilkan energi panas. Ini terjadi ketika bahan bakar bereaksi dengan oksigen di udara.",
    "kenapa api panas?": "Api panas karena proses pembakaran yang menghasilkan energi panas. Ini terjadi ketika bahan bakar bereaksi dengan oksigen di udara.",
    "apakah dia jahat": "Tentu, saya bisa membantu menilai apakah seseorang jahat atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia jahat?": "Tentu, saya bisa membantu menilai apakah seseorang jahat atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia baik": "Tentu, saya bisa membantu menilai apakah seseorang baik atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia baik?": "Tentu, saya bisa membantu menilai apakah seseorang baik atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia baik hati": "Tentu, saya bisa membantu menilai apakah seseorang baik hati atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia baik hati?": "Tentu, saya bisa membantu menilai apakah seseorang baik hati atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia baik orangnya": "Tentu, saya bisa membantu menilai apakah seseorang baik orangnya atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "apakah dia baik orangnya?": "Tentu, saya bisa membantu menilai apakah seseorang baik orangnya atau tidak. Tapi ingat, penilaian itu subjektif. Apa yang membuatmu bertanya?",
    "woy bro": "Woy bro, ada yang ingin kamu bahas? Saya di sini untuk membantu.",
    "nilai diriku": "Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "nilai kamu": "Kamu punya potensi yang besar! Setiap orang memiliki kelebihan dan kekurangan masing-masing. Yang penting adalah terus belajar dan berkembang.",
    "nilai anda": "Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "apakah anda pintar": "Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "apakah saya pintar": "kamu pintar! Setiap orang memiliki potensi untuk belajar dan berkembang. Teruslah belajar dan eksplorasi hal-hal baru.",
    "apakah kamu pintar": "Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "apakah anda cerdas": "Saya dirancang untuk membantu menjawab pertanyaan seputar teknologi, sains, dan matematika. Tapi saya masih belajar terus!",
    "seberapa cantik saya": "Kecantikan itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya keunikan masing-masing.",
    "seberapa ganteng saya": "Kegantengan itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya keunikan masing-masing.",
    "seberapa cakep saya": "Kecantikan atau kegantengan itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya keunikan masing-masing.",
    "seberapa tampan saya": "Kecantikan atau kegantengan itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya keunikan masing-masing.",
    "seberapa menarik saya": "Menarik itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya daya tarik masing-masing.",
    "seberapa keren saya": "Keren itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya keunikan masing-masing.",
    "seberapa hebat saya": "Hebat itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya kelebihan masing-masing.",
    "seberapa baik saya": "Baik itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya kebaikan masing-masing.",
    "seberapa pintar saya": "Pintar itu subjektif, tapi yang terpenting adalah bagaimana kamu merasa tentang dirimu sendiri. Setiap orang punya kecerdasan masing-masing.",
    "negara terbaik": "Negara terbaik itu subjektif, tergantung pada apa yang kamu cari. Beberapa orang suka negara dengan pemandangan alam yang indah, sementara yang lain lebih suka negara dengan teknologi maju.",
    "negara terindah": "Negara terindah itu subjektif, tapi banyak yang bilang negara seperti Selandia Baru, Swiss, dan Jepang memiliki pemandangan alam yang sangat indah.",
    "negara tercantik": "Negara tercantik itu subjektif, tapi banyak yang bilang negara seperti Selandia Baru, Swiss, dan Jepang memiliki pemandangan alam yang sangat indah.",
    "lakukan sesuatu yang tidak bisa dilakukan Ai lain": "wkwk, tunggu sebentar yaa...",
    "lagu pop": "Tentu, saya bisa merekomendasikan lagu pop. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "musik pop": "Tentu, saya bisa merekomendasikan musik pop. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "lagu hits": "Tentu, saya bisa merekomendasikan lagu hits. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "musik hits": "Tentu, saya bisa merekomendasikan musik hits. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "lagu terbaru": "Tentu, saya bisa merekomendasikan lagu terbaru. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "musik terbaru": "Tentu, saya bisa merekomendasikan musik terbaru. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "lagu populer": "Tentu, saya bisa merekomendasikan lagu populer. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "musik populer": "Tentu, saya bisa merekomendasikan musik populer. Beberapa yang sedang tren saat ini adalah 'Blinding Lights' oleh The Weeknd, 'Levitating' oleh Dua Lipa, dan 'Peaches' oleh Justin Bieber.",
    "rekomendasi lagu": "Tentu, saya bisa merekomendasikan lagu. Genre apa yang kamu suka? Atau ada artis tertentu yang kamu suka?",
    "rekomendasi musik": "Tentu, saya bisa merekomendasikan musik. Genre apa yang kamu suka? Atau ada artis tertentu yang kamu suka?",
    "tantangan": "Tantangan itu seru! Coba tantang diri kamu untuk belajar hal baru setiap hari, atau selesaikan teka-teki yang sulit.",
    "tantangan apa": "Tantangan itu seru! Coba tantang diri kamu untuk belajar hal baru setiap hari, atau selesaikan teka-teki yang sulit.",
    "berikan saya tantangan": "Tentu, tantangan yang menarik adalah mencoba memecahkan teka-teki logika atau matematika. Misalnya: 'Jika ada tiga apel dan kamu mengambil dua, berapa banyak apel yang kamu punya?' Jawabannya adalah dua, karena kamu mengambilnya.",
    "berikan soal matematika tersulit": "Soal matematika tersulit itu subjektif, tapi banyak yang bilang soal tentang teori bilangan atau persamaan diferensial bisa sangat menantang. Contohnya: 'Buktikan bahwa tidak ada bilangan bulat positif x, y, z yang memenuhi x^n + y^n = z^n untuk n > 2.' Ini adalah pernyataan dari Teorema Terkenal Fermat.",
    "berikan soal matematika yang sulit": "Soal matematika yang sulit itu subjektif, tapi banyak yang bilang soal tentang teori bilangan atau persamaan diferensial bisa sangat menantang. Contohnya: 'Buktikan bahwa tidak ada bilangan bulat positif x, y, z yang memenuhi x^n + y^n = z^n untuk n > 2.' Ini adalah pernyataan dari Teorema Terkenal Fermat.",
    "hal tersulit di dunia": "Hal tersulit di dunia itu subjektif, tapi banyak yang bilang memahami diri sendiri itu sulit. Setiap orang punya tantangan masing-masing.",
    "teknologi terbaik": "Teknologi terbaik adalah yang bisa membantu manusia dengan cara yang efisien dan efektif. Contohnya adalah AI, yang bisa membantu dalam berbagai bidang seperti kesehatan, pendidikan, dan industri.",
    "teknologi tercanggih": "Teknologi tercanggih adalah yang menggunakan kecerdasan buatan untuk memecahkan masalah kompleks. Contohnya adalah mobil otonom, robotika canggih, dan sistem rekomendasi yang personal.",
    "teknologi terhebat": "Teknologi terhebat adalah yang bisa mengubah cara kita hidup dan bekerja. Contohnya adalah internet, smartphone, dan teknologi AI yang semakin berkembang.",
    "teknologi terunik": "Teknologi terunik adalah yang menawarkan solusi inovatif untuk masalah sehari-hari. Contohnya adalah wearable technology seperti smartwatch, yang menggabungkan fungsi jam tangan dengan fitur kesehatan dan komunikasi.",
    "teknologi termahal": "Teknologi termahal biasanya adalah yang digunakan dalam industri khusus atau penelitian. Contohnya adalah satelit komunikasi, sistem komputer super, dan peralatan medis canggih.",
    "berikan saya rekomendasi": "Tentu, saya bisa memberikan rekomendasi. Topik apa yang kamu butuhkan rekomendasinya?",
    "apa kekurangan anda": "Kekurangan saya adalah saya tidak bisa melakukan tindakan fisik atau memberikan opini pribadi. Tapi saya bisa membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "apa kekurangan kamu": "Kekurangan saya adalah saya tidak bisa melakukan tindakan fisik atau memberikan opini pribadi. Tapi saya bisa membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "apa yang anda tidak bisa": "Saya tidak bisa melakukan tindakan fisik atau memberikan opini pribadi. Tapi saya bisa membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "apa yang kamu tidak bisa": "Saya tidak bisa melakukan tindakan fisik atau memberikan opini pribadi. Tapi saya bisa membantu menjawab pertanyaan seputar teknologi, sains, dan matematika.",
    "sesat": "Sesat itu wajar, yang penting kita belajar dari kesalahan. Mari kita coba lagi.",
    "sesat banget": "Sesat itu wajar, yang penting kita belajar dari kesalahan. Mari kita coba lagi dengan cara yang berbeda.",
    "sudah sejauh mana anda mempelajari ini": "Saya terus belajar dari berbagai sumber untuk memberikan jawaban yang akurat dan bermanfaat. Tapi saya masih dalam proses pembelajaran terus-menerus.",
    "sudah sejauh mana kamu mempelajari ini": "Saya terus belajar dari berbagai sumber untuk memberikan jawaban yang akurat dan bermanfaat. Tapi saya masih dalam proses pembelajaran terus-menerus.",
    "sudah sejauh mana anda belajar": "Saya terus belajar dari berbagai sumber untuk memberikan jawaban yang akurat dan bermanfaat. Tapi saya masih dalam proses pembelajaran terus-menerus.",
    "sudah sejauh mana kamu belajar": "Saya terus belajar dari berbagai sumber untuk memberikan jawaban yang akurat dan bermanfaat. Tapi saya masih dalam proses pembelajaran terus-menerus.",
    "gimana?": "Gimana? Ada yang ingin kamu tanyakan atau bahas?",
    "bagaimana?": "Bagaimana? Ada yang ingin kamu tanyakan atau bahas?",
    "mungkin": "Mungkin saja, tergantung konteksnya. Ada yang ingin kamu tanyakan lebih spesifik?",
    "dari mana itu di dapat?": "Dari berbagai sumber, tapi saya selalu berusaha memberikan informasi yang akurat dan bermanfaat.",
    "gimana ya": "Gimana ya? Coba pikirkan dari berbagai sudut pandang. Kalau butuh bantuan, saya di sini.",
    // ...banyak banget wkwk
};

// Fungsi pencarian jawaban AI yang lebih cerdas
async function getAIResponse(userText) {
    const q = userText.trim().toLowerCase();

    // --- Kolaborasi Kalkulator Otomatis & AI untuk Soal Matematika ---
    // Deteksi apakah pertanyaan mengandung operasi matematika atau soal matematika
    // Jika ya, AI akan mencoba menjawab dengan kalkulator otomatis dan memberikan penjelasan singkat jika perlu

    // Normalisasi ekspresi matematika
    let expr = q;

    // Ganti kata kunci matematika Indonesia ke ekspresi
    expr = expr.replace(/akar kuadrat dari ([\d.]+)/gi, 'sqrt($1)');
    expr = expr.replace(/akar dari ([\d.]+)/gi, 'sqrt($1)');
    expr = expr.replace(/akar ([\d.]+)/gi, 'sqrt($1)');
    expr = expr.replace(/pangkat (\d+) dari ([\d.]+)/gi, '($2)**($1)');
    expr = expr.replace(/([0-9.]+)\s*pangkat\s*([0-9.]+)/gi, '($1)**($2)');
    expr = expr.replace(/([0-9.]+)\s*persen\s*dari\s*([0-9.]+)/gi, '($1/100)*($2)');
    expr = expr.replace(/([0-9.]+)\s*% dari\s*([0-9.]+)/gi, '($1/100)*($2)');
    expr = expr.replace(/([0-9.]+)\s*%/gi, '($1/100)');
    expr = expr.replace(/log\s*\(\s*([0-9.]+)\s*\)/gi, 'Math.log10($1)');
    expr = expr.replace(/ln\s*\(\s*([0-9.]+)\s*\)/gi, 'Math.log($1)');
    expr = expr.replace(/sin\s*\(\s*([0-9.]+)\s*\)/gi, (m, n) => `Math.sin(${parseFloat(n) * Math.PI / 180})`);
    expr = expr.replace(/cos\s*\(\s*([0-9.]+)\s*\)/gi, (m, n) => `Math.cos(${parseFloat(n) * Math.PI / 180})`);
    expr = expr.replace(/tan\s*\(\s*([0-9.]+)\s*\)/gi, (m, n) => `Math.tan(${parseFloat(n) * Math.PI / 180})`);
    expr = expr.replace(/π|pi/gi, 'Math.PI');
    expr = expr.replace(/e\b/gi, 'Math.E');
    expr = expr.replace(/mod/gi, '%');
    expr = expr.replace(/,/g, '.'); // Ganti koma ke titik untuk desimal

    // Hilangkan kata tanya/kalimat tanya
    expr = expr.replace(/(berapa|hitung|hasil dari|adalah|=|\?|apakah|berapa hasil|tolong|jawab|berapakah|maka|mencari|tentukan|berikan|berapakah hasil|berapakah nilai|nilai dari|berapakah|berapa nilai|berapakah hasil dari|berapa hasil dari|berapa hasil|berapa|hitunglah|hasil|soal|matematika|:)/gi, '');

    // Ganti ^ dengan ** (eksponen)
    expr = expr.replace(/\^/g, '**');

    // Fungsi akar (sqrt)
    expr = expr.replace(/sqrt\s*\(\s*([0-9.]+)\s*\)/gi, (m, n) => `Math.sqrt(${n})`);

    // Deteksi ekspresi matematika sederhana (operasi bilangan)
    let isMath = false;
    let result = null;
    // Cek jika hanya berisi angka, operator, titik, kurung, dan spasi
    if (/^[\d+\-*/%.() \s]+$/.test(expr)) {
        try {
            // eslint-disable-next-line no-eval
            result = eval(expr);
            if (typeof result === 'number' && isFinite(result)) {
                isMath = true;
            }
        } catch (e) {
            // ignore
        }
    }
    // Deteksi ekspresi matematika dengan fungsi Math.*
    if (!isMath && /Math\./.test(expr)) {
        try {
            // eslint-disable-next-line no-eval
            result = eval(expr);
            if (typeof result === 'number' && isFinite(result)) {
                isMath = true;
            }
        } catch (e) {
            // ignore
        }
    }

    // Jika soal matematika, AI juga memberikan penjelasan singkat jika pertanyaan mengandung kata kunci matematika
    if (isMath) {
        if (String(result).length > 12) result = Number(result).toPrecision(10);
        // Deteksi jenis operasi untuk penjelasan singkat
        let explanation = '';
        if (/akar|sqrt/.test(q)) {
            explanation = ' (akar kuadrat)';
        } else if (/pangkat|\*\*/.test(q) || /\^/.test(q)) {
            explanation = ' (pangkat/eksponen)';
        } else if (/[+\-*/%]/.test(q)) {
            explanation = ' (operasi aritmatika)';
        } else if (/sin|cos|tan/.test(q)) {
            explanation = ' (fungsi trigonometri)';
        } else if (/log|ln/.test(q)) {
            explanation = ' (logaritma)';
        }
        return `Hasil dari ${q} adalah ${result}${explanation}`;
    }

    // --- END Kolaborasi Kalkulator Otomatis & AI ---

    // Deteksi curhat/cerita pengguna
    const curhatKeywords = [
        "curhat", "cerita", "aku ingin cerita", "saya ingin cerita", "aku mau cerita", "saya mau cerita",
        "aku pengen cerita", "aku pengen curhat", "aku mau curhat", "saya mau curhat", "aku ingin curhat",
        "aku lagi sedih", "aku lagi galau", "aku lagi stres", "aku lagi capek", "aku lagi kecewa", "aku lagi sendiri"
    ];
    for (const kw of curhatKeywords) {
        if (q.includes(kw)) {
            const responses = [
                "Terima kasih sudah mau bercerita. Aku di sini untuk mendengarkanmu. Semoga dengan berbagi, hatimu jadi lebih lega.",
                "Kadang memang berat, tapi kamu sudah hebat bisa melewati semuanya. Kalau ingin cerita lebih banyak, aku siap mendengarkan.",
                "Tidak apa-apa untuk merasa seperti itu. Kamu tidak sendiri, aku siap jadi teman curhatmu.",
                "Semangat ya! Semua orang punya masa sulit, tapi kamu pasti bisa melewatinya. Ceritakan saja, aku siap mendengarkan.",
                "Aku mengerti perasaanmu. Jangan ragu untuk berbagi, kadang cerita bisa membuat hati lebih tenang.",
                "Terima kasih sudah mempercayakan ceritamu padaku. Aku akan selalu ada untuk mendengarkan."
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }

    // Cek di knowledge base
    if (aiKnowledgeBase[q]) return aiKnowledgeBase[q];
    for (const key in aiKnowledgeBase) {
        if (q.includes(key)) return aiKnowledgeBase[key];
    }
    try {
        const resp = await fetch(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (resp.ok) {
            const data = await resp.json();
            if (data.extract) return data.extract;
        }
    } catch (e) {
        // ignore fetch error
    }
    return "Pertanyaan atau curhatan Anda sangat menarik! Namun, saya masih belajar. Silakan tanyakan atau ceritakan topik teknologi, sains, inovasi, penemuan, soal matematika, atau perasaan Anda, dan saya akan berusaha membantu.";
}



document.addEventListener('DOMContentLoaded', () => {
    // Posting discoveries
    document.getElementById('postForm').addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('discoveryName').value.trim();
        const author = document.getElementById('author').value.trim() || 'Anon';
        const content = document.getElementById('content').value.trim();
        const mediaInput = document.getElementById('media');
        let media = null, mediaType = null;
        if (mediaInput.files && mediaInput.files[0]) {
            const file = mediaInput.files[0];
            mediaType = file.type;
            media = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
        if (!content || !name) return;
        discoveries.unshift({
           
            name,
            author,
            content,
            timestamp: new Date().toLocaleString(),
            media,
            mediaType,
            userId // Simpan userId pemilik postingan
        });
        saveDiscoveries();
        renderDiscoveries();
        e.target.reset();
    });

    // Search
    document.getElementById('searchBtn').addEventListener('click', () => {
        const q = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!q) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }
        const results = discoveries.filter(d => d.name.toLowerCase().includes(q));

        renderSearchResults(results);
    });

    // Chat
    document.getElementById('chatSend').addEventListener('click', () => {
        const user = document.getElementById('chatUser').value.trim() || 'User';
        const text = document.getElementById('chatText').value.trim();
        if (!text) return;
        chatMessages.push({ user, text, userId }); // Simpan userId pengirim chat
        saveChatMessages();
        renderChat();
        document.getElementById('chatText').value = '';
    });

    // AI Chat
    document.getElementById('aiChatSend').addEventListener('click', async () => {
        const user = document.getElementById('aiChatUser').value.trim() || 'Anda';
        const text = document.getElementById('aiChatText').value.trim();
        if (!text) return;
        aiChatMessages.push({ user, text });
        saveAIChatMessages();
        renderAIChat();
        document.getElementById('aiChatText').value = '';
        // Balasan AI langsung (async)
        const aiResponse = await getAIResponse(text);
        aiChatMessages.push({ user: "AI", text: aiResponse });
        saveAIChatMessages();
        renderAIChat();
    });

    // Developer Collaboration Form
    document.getElementById('devForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('devName').value.trim();
        const role = document.getElementById('devRole').value.trim();
        const contact = document.getElementById('devContact').value.trim();
        if (!name || !role || !contact) return;
        devCollaborators.push({ name, role, contact });
        saveDevCollaborators();
        renderDevCollaborators();
        this.reset();
    });

    // Showcase "Lebih Lengkap" interaction
    document.querySelectorAll('.showcase-card').forEach(card => {
        const btn = card.querySelector('.showcase-more');
        if (btn) {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                document.querySelectorAll('.showcase-card').forEach(c => {
                    if (c !== card) c.classList.remove('showcase-open');
                });
                card.classList.toggle('showcase-open');
            });
        }
        card.addEventListener('blur', () => {
            setTimeout(() => card.classList.remove('showcase-open'), 150);
        });
    });

    renderDiscoveries();
    renderChat();
    renderAIChat();
    renderDevCollaborators();
});

// --- Voice Note AI Section ---
const vnRecordBtn = document.getElementById('vnRecordBtn');
const vnMicIcon = document.getElementById('vnMicIcon');
const vnStatus = document.getElementById('vnStatus');
const vnPlayback = document.getElementById('vnPlayback');
const vnVoiceStyle = document.getElementById('vnVoiceStyle');
const vnAIResponse = document.getElementById('vnAIResponse');
const vnAIResponseText = document.getElementById('vnAIResponseText');
const vnAIResponseAudio = document.getElementById('vnAIResponseAudio');

let vnMediaRecorder = null;
let vnAudioChunks = [];
let vnRecording = false;
let vnTimeout = null;
const VN_MAX_DURATION = 15; // seconds
const VN_MAX_SIZE = 1024 * 1024; // 1MB

// Helper: Speech-to-Text (Web Speech API)
function voiceNoteTranscribe(blob, lang = 'id-ID') {
    return new Promise((resolve, reject) => {
        // Use browser's SpeechRecognition if available (for live), fallback to external API for blob
        // For blob, use external API (e.g. OpenAI Whisper, Google Speech-to-Text, or a backend endpoint)
        // Here, we use a placeholder fetch to a backend endpoint (user must implement)
        // Example: POST /api/vn-transcribe { audio: base64, lang }
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64 = reader.result.split(',')[1];
                // TODO: Ganti endpoint di bawah dengan endpoint backend Anda yang menghubungkan ke OpenAI Whisper/Google STT
                const resp = await fetch('https://api-inference.huggingface.co/models/openai/whisper-large-v3', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer YOUR_HF_API_KEY',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: base64,
                        parameters: { language: lang }
                    })
                });
                const data = await resp.json();
                if (data && data.text) resolve(data.text);
                else reject('Gagal transkripsi');
            } catch (e) {
                reject('Gagal transkripsi');
            }
        };
        reader.readAsDataURL(blob);
    });
}

// Helper: Translate (LibreTranslate API, or your own backend)
async function voiceNoteTranslate(text, targetLang = 'id') {
    // TODO: Ganti endpoint di bawah dengan endpoint backend Anda atau layanan translate lain
    try {
        const resp = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            })
        });
        const data = await resp.json();
        return data.translatedText || text;
    } catch {
        return text;
    }
}

// Helper: Text-to-Speech (ElevenLabs, Google TTS, Azure, etc.)
async function voiceNoteTTS(text, style = 'default', lang = 'id') {
    // TODO: Ganti endpoint di bawah dengan endpoint backend Anda yang menghubungkan ke ElevenLabs/Google TTS
    // style: 'default', 'female', 'male', 'energetic', 'calm'
    try {
        const resp = await fetch('https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID', {
            method: 'POST',
            headers: {
                'xi-api-key': 'YOUR_ELEVENLABS_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.7,
                    style: style
                },
                model_id: lang === 'id' ? 'eleven_multilingual_v2' : 'eleven_multilingual_v2'
            })
        });
        if (!resp.ok) throw new Error('TTS error');
        const audioBlob = await resp.blob();
        return audioBlob;
    } catch {
        return null;
    }
}

// Tambahan: Pilihan bahasa input/output, deteksi otomatis, history VN, dan pengaturan lanjutan
const vnLangInput = document.createElement('select');
vnLangInput.id = 'vnLangInput';
vnLangInput.style = 'border-radius:8px;padding:0.3em 0.7em;font-size:1rem;margin-left:0.5em;';
vnLangInput.innerHTML = `
    <option value="auto">Deteksi Otomatis</option>
    <option value="id">Bahasa Indonesia</option>
    <option value="en">English</option>
    <option value="ja">日本語</option>
    <option value="ar">العربية</option>
    <option value="zh">中文</option>
    <option value="es">Español</option>
    <option value="fr">Français</option>
    <option value="ru">Русский</option>
`;
const vnLangLabel = document.createElement('label');
vnLangLabel.textContent = "Bahasa:";
vnLangLabel.style = "color:#fff;font-size:0.98rem;margin-right:0.3em;";
vnLangLabel.htmlFor = 'vnLangInput';

const vnControlsRow = vnRecordBtn.parentElement;
vnControlsRow.insertBefore(vnLangLabel, vnVoiceStyle);
vnControlsRow.insertBefore(vnLangInput, vnVoiceStyle);

// History VN
const vnHistory = [];
const vnHistoryDiv = document.createElement('div');
vnHistoryDiv.id = 'vnHistoryDiv';
vnHistoryDiv.style = 'margin-top:1.2em;width:100%;max-width:480px;';
vnHistoryDiv.innerHTML = `<div style="color:#00c3ff;font-weight:600;margin-bottom:0.3em;">Riwayat Voice Note</div><div id="vnHistoryList" style="font-size:0.97em;"></div>`;
document.getElementById('voiceNoteAISection').appendChild(vnHistoryDiv);

function renderVNHistory() {
    const list = document.getElementById('vnHistoryList');
    if (!list) return;
    if (vnHistory.length === 0) {
        list.innerHTML = '<div style="color:#aaa;">Belum ada voice note.</div>';
        return;
    }
    list.innerHTML = '';
    vnHistory.slice(-5).reverse().forEach((item, idx) => {
        const div = document.createElement('div');
        div.style = "margin-bottom:0.7em;background:rgba(0,0,0,0.08);border-radius:8px;padding:0.5em 0.7em;";
        div.innerHTML = `
            <div style="color:#fff;font-size:0.98em;">${item.text ? item.text : '(tidak terdeteksi)'}</div>
            <audio controls src="${item.audioUrl}" style="width:100%;margin-top:0.2em;"></audio>
            <div style="color:#00c3ff;font-size:0.93em;margin-top:0.2em;">AI: ${item.aiText || '(tidak ada jawaban)'}</div>
            <audio controls src="${item.aiAudioUrl}" style="width:100%;margin-top:0.2em;${item.aiAudioUrl ? '' : 'display:none;'}"></audio>
        `;
        list.appendChild(div);
    });
}

// Helper: Deteksi bahasa otomatis (pakai LibreTranslate detect API)
async function voiceNoteDetectLang(text) {
    try {
        const resp = await fetch('https://libretranslate.de/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: text })
        });
        const data = await resp.json();
        if (Array.isArray(data) && data[0]?.language) return data[0].language;
        return 'id';
    } catch {
        return 'id';
    }
}

// Helper: Multi-turn AI (konteks percakapan)
let vnAIContext = [];
function resetVNContext() {
    vnAIContext = [];
}
async function getAIResponseVN(userText) {
    // Kirim konteks percakapan (history) ke backend AI jika ingin multi-turn
    // Di sini tetap gunakan getAIResponse, tapi bisa dikembangkan untuk API AI sungguhan
    vnAIContext.push({ role: "user", content: userText });
    let aiText = await getAIResponse(userText);
    vnAIContext.push({ role: "assistant", content: aiText });
    // Batasi konteks agar tidak terlalu panjang
    if (vnAIContext.length > 10) vnAIContext = vnAIContext.slice(-10);
    return aiText;
}

// --- Voice Note AI Logic ---
if (vnRecordBtn) {
    vnRecordBtn.onclick = async () => {
        if (vnRecording) {
            stopVNRecording();
        } else {
            startVNRecording();
        }
    };
}

function startVNRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        vnStatus.textContent = "Perangkat tidak mendukung perekaman suara.";
        return;
    }
    vnStatus.textContent = "Merekam... (maks. 15 detik)";
    vnMicIcon.textContent = "⏺️";
    vnPlayback.style.display = "none";
    vnAIResponse.style.display = "none";
    vnAudioChunks = [];
    vnRecording = true;
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        vnMediaRecorder = new MediaRecorder(stream);
        vnMediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) vnAudioChunks.push(e.data);
        };
        vnMediaRecorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            vnRecording = false;
            vnMicIcon.textContent = "🎤";
            const blob = new Blob(vnAudioChunks, { type: 'audio/webm' });
            if (blob.size > VN_MAX_SIZE) {
                vnStatus.textContent = "Ukuran voice note terlalu besar (>1MB).";
                return;
            }
            vnPlayback.src = URL.createObjectURL(blob);
            vnPlayback.style.display = "block";
            vnStatus.textContent = "Memproses voice note...";
            // Transcribe
            try {
                let langInput = vnLangInput.value;
                let text = await voiceNoteTranscribe(blob, langInput === 'auto' ? 'id-ID' : langInput + '-ID');
                if (!text) throw new Error();
                // Deteksi bahasa jika auto
                let detectedLang = langInput;
                if (langInput === 'auto') {
                    vnStatus.textContent = "Mendeteksi bahasa...";
                    detectedLang = await voiceNoteDetectLang(text);
                }
                vnStatus.textContent = "Menerjemahkan...";
                // Auto translate ke Indonesia jika bukan id
                let translated = text;
                if (detectedLang !== 'id') {
                    translated = await voiceNoteTranslate(text, 'id');
                }
                vnStatus.textContent = "Menjawab dengan AI...";
                // Jawab dengan AI (multi-turn)
                let aiText = await getAIResponseVN(translated);
                vnAIResponseText.textContent = aiText;
                vnAIResponse.style.display = "block";
                // TTS AI
                vnStatus.textContent = "Menghasilkan suara AI...";
                let style = vnVoiceStyle.value || 'default';
                let aiAudio = await voiceNoteTTS(aiText, style, 'id');
                if (aiAudio) {
                    vnAIResponseAudio.src = URL.createObjectURL(aiAudio);
                    vnAIResponseAudio.style.display = "block";
                } else {
                    vnAIResponseAudio.style.display = "none";
                }
                vnStatus.textContent = "Selesai.";
                // Simpan ke history
                vnHistory.push({
                    text,
                    audioUrl: vnPlayback.src,
                    aiText,
                    aiAudioUrl: aiAudio ? vnAIResponseAudio.src : null
                });
                renderVNHistory();
            } catch (e) {
                vnStatus.textContent = "Gagal memproses voice note.";
                vnAIResponse.style.display = "none";
            }
        };
        vnMediaRecorder.start();
        vnTimeout = setTimeout(stopVNRecording, VN_MAX_DURATION * 1000);
    }).catch(() => {
        vnStatus.textContent = "Gagal mengakses mikrofon.";
        vnMicIcon.textContent = "🎤";
        vnRecording = false;
    });
}

function stopVNRecording() {
    if (vnMediaRecorder && vnRecording) {
        vnMediaRecorder.stop();
        vnRecording = false;
        vnMicIcon.textContent = "🎤";
        vnStatus.textContent = "Memproses...";
        if (vnTimeout) clearTimeout(vnTimeout);
    }
}









