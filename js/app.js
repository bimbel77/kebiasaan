import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnToggle = document.getElementById('btnToggle');

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const role = document.getElementById('roleSelect').value;
            const username = document.getElementById('usernameInput').value.trim();
            const password = document.getElementById('passwordInput').value.trim();

            if (!username || !password) {
                alert("Silakan isi Username dan Password!");
                return;
            }

            currentUser = { role: role, name: username, id: username.toLowerCase().replace(/\s+/g, '_') };

            document.getElementById('loginModal').style.setProperty('display', 'none', 'important');
            document.getElementById('appContainer').style.display = 'flex';

            document.getElementById('userRoleBadge').innerText = role.toUpperCase();
            document.getElementById('userNameDisplay').innerText = username;

            renderSidebarMenu();
            loadPage('dashboard');
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Apakah Anda yakin ingin keluar?")) {
                currentUser = null;
                document.getElementById('appContainer').style.display = 'none';
                document.getElementById('loginModal').style.setProperty('display', 'flex', 'important');
                document.getElementById('usernameInput').value = '';
                document.getElementById('passwordInput').value = '';
            }
        });
    }

    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.style.display = (sidebar.style.display === 'none' || sidebar.style.display === '') ? 'flex' : 'none';
        });
    }
});

// Render Sidebar Berdasarkan Role
function renderSidebarMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = '';

    let menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        { id: 'profil-saya', label: 'Profil Saya', icon: 'fa-user-gear' }
    ];

    if (currentUser.role === 'admin') {
        menuItems.push(
            { id: 'pengaturan-sekolah', label: 'Pengaturan Sekolah', icon: 'fa-school' },
            { id: 'kelola-guru', label: 'Data & Input Guru', icon: 'fa-chalkboard-user' },
            { id: 'tambah-siswa', label: 'Tambah Siswa', icon: 'fa-user-plus' },
            { id: 'pantau-siswa', label: 'Data Siswa', icon: 'fa-users' }
        );
    } else if (currentUser.role === 'guru') {
        menuItems.push(
            { id: 'pantau-siswa', label: 'Pantau Siswa', icon: 'fa-user-check' },
            { id: 'tambah-siswa', label: 'Tambah Siswa', icon: 'fa-user-plus' },
            { id: 'cetak-kartu', label: 'Cetak Kartu Login', icon: 'fa-id-card' },
            { id: 'cetak-rekap', label: 'Cetak Rekap', icon: 'fa-print' }
        );
    } else if (currentUser.role === 'siswa') {
        menuItems.push(
            { id: 'bangun-pagi', label: '1. Bangun Pagi', icon: 'fa-sun' },
            { id: 'beribadah', label: '2. Beribadah', icon: 'fa-hands-praying' },
            { id: 'berolahraga', label: '3. Berolahraga', icon: 'fa-person-running' },
            { id: 'makan-sehat', label: '4. Makan Sehat', icon: 'fa-bowl-rice' },
            { id: 'gemar-belajar', label: '5. Gemar Belajar', icon: 'fa-book-open' },
            { id: 'bermasyarakat', label: '6. Bermasyarakat', icon: 'fa-people-group' },
            { id: 'tidur-cepat', label: '7. Tidur Cepat', icon: 'fa-bed' }
        );
    }

    menuItems.forEach((item, index) => {
        const a = document.createElement('a');
        a.className = `nav-item ${index === 0 ? 'active' : ''}`;
        a.innerHTML = `<i class="fa-solid ${item.icon}"></i> <span>${item.label}</span>`;
        a.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            a.classList.add('active');
            loadPage(item.id);
        };
        navMenu.appendChild(a);
    });
}

// Router Utama
window.loadPage = async function(pageId) {
    const body = document.getElementById('contentBody');
    const title = document.getElementById('pageTitle');

    switch(pageId) {
        case 'dashboard':
            title.innerText = "Dashboard Overview";
            body.innerHTML = `
                <div class="card">
                    <h3>Selamat Datang, ${currentUser.name}!</h3>
                    <p style="margin-top:5px;">Akses Masuk: <strong>${currentUser.role.toUpperCase()}</strong></p>
                    <p style="margin-top:10px; color:#707ebe;">Pilih menu di sebelah kiri untuk mengoperasikan aplikasi ini.</p>
                </div>`;
            break;

        case 'profil-saya':
            title.innerText = "Profil Pengguna";
            body.innerHTML = `<div class="card"><p>Memuat profil...</p></div>`;
            await muatProfil();
            break;

        case 'kelola-guru':
            title.innerText = "Kelola & Data Guru";
            body.innerHTML = `
                ${renderForm('Tambah Data Guru Baru', `
                    <div class="form-group"><label>NIP / Username Guru</label><input type="text" id="nipGuru" placeholder="Masukkan NIP/Username" required></div>
                    <div class="form-group"><label>Nama Lengkap Guru</label><input type="text" id="namaGuru" placeholder="Masukkan Nama Lengkap" required></div>
                    <div class="form-group"><label>Wali Kelas / Tugas</label><input type="text" id="kelasGuru" placeholder="Contoh: Wali Kelas 5A" required></div>
                    <div class="form-group"><label>Password Akun</label><input type="text" id="passGuru" value="123456" required></div>
                `, 'simpanGuruBaru')}
                <div id="tabelGuruContainer" style="margin-top:20px;"></div>
            `;
            await muatDataGuru();
            break;

        case 'tambah-siswa':
            title.innerText = "Tambah Data Siswa";
            body.innerHTML = renderForm('Form Input Siswa Baru', `
                <div class="form-group"><label>NISN / NIS</label><input type="text" id="nisnSiswa" placeholder="Masukkan NISN" required></div>
                <div class="form-group"><label>Nama Lengkap Siswa</label><input type="text" id="namaSiswa" placeholder="Masukkan Nama Lengkap" required></div>
                <div class="form-group"><label>Kelas</label>
                    <select id="kelasSiswa">
                        <option value="Kelas 1">Kelas 1</option>
                        <option value="Kelas 2">Kelas 2</option>
                        <option value="Kelas 3">Kelas 3</option>
                        <option value="Kelas 4">Kelas 4</option>
                        <option value="Kelas 5" selected>Kelas 5</option>
                        <option value="Kelas 6">Kelas 6</option>
                    </select>
                </div>
                <div class="form-group"><label>Password Akun Siswa</label><input type="text" id="passSiswa" value="123456" required></div>
            `, 'simpanSiswaBaru');
            break;

        case 'pantau-siswa':
            title.innerText = "Daftar Data Siswa";
            body.innerHTML = `<div class="card"><p>Memuat data siswa dari Firebase...</p></div>`;
            await muatDataSiswa();
            break;

        case 'cetak-kartu':
            title.innerText = "Cetak Kartu Login Siswa";
            body.innerHTML = `
                <div class="card">
                    <h3>Kartu Akses Login Siswa</h3>
                    <p style="margin-bottom:15px;">Gunakan tombol di bawah untuk mencetak kartu login siswa.</p>
                    <button class="btn-primary" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak Kartu Login</button>
                </div>`;
            break;

        case 'pengaturan-sekolah':
            title.innerText = "Pengaturan Sekolah";
            body.innerHTML = renderForm('Profil Sekolah', `
                <div class="form-group"><label>Nama Sekolah</label><input type="text" id="namaSekolah" placeholder="SD Negeri ..."></div>
                <div class="form-group"><label>NPSN</label><input type="text" id="npsnSekolah" placeholder="12345678"></div>
                <div class="form-group"><label>Nama Kepala Sekolah</label><input type="text" id="kepsekSekolah"></div>
            `, 'simpanPengaturanSekolah');
            break;

        // --- 7 KEBIASAAN SISWA ---
        case 'bangun-pagi':
            title.innerText = "Kebiasaan 1: Bangun Pagi";
            body.innerHTML = renderForm('Form Bangun Pagi', `<div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div><div class="form-group"><label>Jam Bangun</label><input type="time" id="jamBangun" required></div>`, 'simpanBangunPagi');
            break;

        case 'beribadah':
            title.innerText = "Kebiasaan 2: Beribadah";
            body.innerHTML = renderForm('Form Ibadah Harian', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group">
                    <label>Ceklis Ibadah:</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="subuh"> Subuh</label>
                        <label class="checkbox-item"><input type="checkbox" id="dzuhur"> Dzuhur</label>
                        <label class="checkbox-item"><input type="checkbox" id="ashar"> Ashar</label>
                        <label class="checkbox-item"><input type="checkbox" id="maghrib"> Maghrib</label>
                        <label class="checkbox-item"><input type="checkbox" id="isya"> Isya</label>
                    </div>
                </div>`, 'simpanIbadah');
            break;

        default:
            body.innerHTML = `<div class="card"><h3>Halaman Aktif</h3></div>`;
    }
};

function renderForm(title, fieldsHtml, submitFunctionName) {
    return `
        <div class="card">
            <h3>${title}</h3>
            <form onsubmit="event.preventDefault(); window.${submitFunctionName}();" style="margin-top: 15px;">
                ${fieldsHtml}
                <button type="submit" class="btn-primary" style="margin-top: 10px;">Simpan Data</button>
            </form>
        </div>`;
}

// ==================== FUNGSI PROFIL (UPDATE DATA) ====================
async function muatProfil() {
    const body = document.getElementById('contentBody');
    try {
        const docRef = doc(db, "users_profil", currentUser.id);
        const docSnap = await getDoc(docRef);

        let data = { nama: currentUser.name, email: '', noHp: '', alamat: '' };
        if (docSnap.exists()) {
            data = docSnap.data();
        }

        body.innerHTML = renderForm(`Update Profil (${currentUser.role.toUpperCase()})`, `
            <div class="form-group"><label>Nama Lengkap</label><input type="text" id="profNama" value="${data.nama || ''}" required></div>
            <div class="form-group"><label>Email</label><input type="email" id="profEmail" value="${data.email || ''}" placeholder="email@sekolah.sch.id"></div>
            <div class="form-group"><label>Nomor WhatsApp / HP</label><input type="text" id="profHp" value="${data.noHp || ''}" placeholder="08123456789"></div>
            <div class="form-group"><label>Alamat / Keterangan</label><textarea id="profAlamat">${data.alamat || ''}</textarea></div>
        `, 'simpanProfilUser');

    } catch (e) {
        console.error(e);
        body.innerHTML = `<div class="card"><p style="color:red;">Gagal memuat profil.</p></div>`;
    }
}

window.simpanProfilUser = async function() {
    try {
        const namaBaru = document.getElementById('profNama').value;
        await setDoc(doc(db, "users_profil", currentUser.id), {
            nama: namaBaru,
            email: document.getElementById('profEmail').value,
            noHp: document.getElementById('profHp').value,
            alamat: document.getElementById('profAlamat').value,
            role: currentUser.role,
            updatedAt: new Date()
        });

        currentUser.name = namaBaru;
        document.getElementById('userNameDisplay').innerText = namaBaru;
        alert("Profil berhasil diperbarui!");
    } catch (e) {
        console.error(e);
        alert("Gagal memperbarui profil.");
    }
};

// ==================== FUNGSI DATA GURU ====================
window.simpanGuruBaru = async function() {
    try {
        await addDoc(collection(db, "data_guru"), {
            nip: document.getElementById('nipGuru').value,
            nama: document.getElementById('namaGuru').value,
            kelas: document.getElementById('kelasGuru').value,
            password: document.getElementById('passGuru').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data guru tersimpan di Firebase.");
        loadPage('kelola-guru');
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan data guru.");
    }
};

async function muatDataGuru() {
    const container = document.getElementById('tabelGuruContainer');
    if (!container) return;

    try {
        const q = query(collection(db, "data_guru"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        let html = `
            <div class="card">
                <h3>Daftar Guru Terdaftar</h3>
                <table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:15px;">
                    <thead>
                        <tr style="background:#f4f7fe;">
                            <th>NIP / Username</th>
                            <th>Nama Guru</th>
                            <th>Tugas / Kelas</th>
                            <th>Password</th>
                        </tr>
                    </thead>
                    <tbody>`;

        if (querySnapshot.empty) {
            html += `<tr><td colspan="4" style="text-align:center;">Belum ada data guru.</td></tr>`;
        } else {
            querySnapshot.forEach((doc) => {
                const g = doc.data();
                html += `
                    <tr>
                        <td>${g.nip}</td>
                        <td>${g.nama}</td>
                        <td>${g.kelas}</td>
                        <td>${g.password}</td>
                    </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p style="color:red;">Gagal memuat daftar guru.</p>`;
    }
}

// ==================== FUNGSI DATA SISWA ====================
window.simpanSiswaBaru = async function() {
    try {
        await addDoc(collection(db, "data_siswa"), {
            nisn: document.getElementById('nisnSiswa').value,
            nama: document.getElementById('namaSiswa').value,
            kelas: document.getElementById('kelasSiswa').value,
            password: document.getElementById('passSiswa').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data siswa telah tersimpan.");
        loadPage('pantau-siswa');
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan data siswa.");
    }
};

async function muatDataSiswa() {
    const body = document.getElementById('contentBody');
    try {
        const q = query(collection(db, "data_siswa"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        let htmlTabel = `
            <div class="card">
                <h3>Data Siswa Terdaftar</h3>
                <table border="1" cellpadding="10" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:15px;">
                    <thead>
                        <tr style="background:#f4f7fe;">
                            <th>NISN</th>
                            <th>Nama Siswa</th>
                            <th>Kelas</th>
                            <th>Password</th>
                        </tr>
                    </thead>
                    <tbody>`;

        if (querySnapshot.empty) {
            htmlTabel += `<tr><td colspan="4" style="text-align:center;">Belum ada data siswa.</td></tr>`;
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                htmlTabel += `
                    <tr>
                        <td>${data.nisn}</td>
                        <td>${data.nama}</td>
                        <td>${data.kelas}</td>
                        <td>${data.password}</td>
                    </tr>`;
            });
        }

        htmlTabel += `</tbody></table></div>`;
        body.innerHTML = htmlTabel;
    } catch (e) {
        console.error(e);
        body.innerHTML = `<div class="card"><p style="color:red;">Gagal memuat data siswa.</p></div>`;
    }
}

// SIMPAN KEBIASAAN
window.simpanBangunPagi = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_bangun_pagi"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            jamBangun: document.getElementById('jamBangun').value,
            createdAt: new Date()
        });
        alert("Data tersimpan!");
    } catch (e) { alert("Gagal menyimpan."); }
};

window.simpanIbadah = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_ibadah"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            subuh: document.getElementById('subuh').checked,
            dzuhur: document.getElementById('dzuhur').checked,
            createdAt: new Date()
        });
        alert("Data tersimpan!");
    } catch (e) { alert("Gagal menyimpan."); }
};
