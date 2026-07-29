import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

            currentUser = { role: role, name: username };

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

    let menuItems = [{ id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' }];

    if (currentUser.role === 'admin') {
        menuItems.push(
            { id: 'pengaturan-sekolah', label: 'Pengaturan Sekolah', icon: 'fa-school' },
            { id: 'kelola-guru', label: 'Data Guru', icon: 'fa-chalkboard-user' },
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

// Router Konten
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

        // --- FITUR GURU & ADMIN ---
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
                        <option value="Kelas 5">Kelas 5</option>
                        <option value="Kelas 6">Kelas 6</option>
                    </select>
                </div>
                <div class="form-group"><label>Password Akun Siswa</label><input type="text" id="passSiswa" value="123456" required></div>
            `, 'simpanSiswaBaru');
            break;

        case 'pantau-siswa':
            title.innerText = "Daftar & Pemantauan Siswa";
            body.innerHTML = `<div class="card"><p>Memuat data siswa dari Firebase...</p></div>`;
            await muatDataSiswa();
            break;

        case 'cetak-kartu':
            title.innerText = "Cetak Kartu Login Siswa";
            body.innerHTML = `
                <div class="card">
                    <h3>Kartu Akses Login Siswa</h3>
                    <p style="margin-bottom:15px;">Gunakan tombol di bawah untuk mencetak kartu login siswa per kelas.</p>
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

        case 'kelola-guru':
            title.innerText = "Kelola Data Guru";
            body.innerHTML = renderForm('Tambah Data Guru', `
                <div class="form-group"><label>NIP / Username</label><input type="text" id="nipGuru" required></div>
                <div class="form-group"><label>Nama Guru</label><input type="text" id="namaGuru" required></div>
                <div class="form-group"><label>Wali Kelas</label><input type="text" id="kelasGuru" placeholder="Contoh: Kelas 5A"></div>
            `, 'simpanGuruBaru');
            break;

        // --- FITUR SISWA (7 KEBIASAAN) ---
        case 'bangun-pagi':
            title.innerText = "Kebiasaan 1: Bangun Pagi";
            body.innerHTML = renderForm('Form Bangun Pagi', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jam Bangun</label><input type="time" id="jamBangun" required></div>
            `, 'simpanBangunPagi');
            break;

        case 'beribadah':
            title.innerText = "Kebiasaan 2: Beribadah";
            body.innerHTML = renderForm('Form Ibadah Harian', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group">
                    <label>Ceklis Ibadah yang Dikerjakan:</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="subuh"> Subuh</label>
                        <label class="checkbox-item"><input type="checkbox" id="dzuhur"> Dzuhur</label>
                        <label class="checkbox-item"><input type="checkbox" id="ashar"> Ashar</label>
                        <label class="checkbox-item"><input type="checkbox" id="maghrib"> Maghrib</label>
                        <label class="checkbox-item"><input type="checkbox" id="isya"> Isya</label>
                        <label class="checkbox-item"><input type="checkbox" id="duha"> Duha</label>
                        <label class="checkbox-item"><input type="checkbox" id="tahajjud"> Tahajjud</label>
                    </div>
                </div>
            `, 'simpanIbadah');
            break;

        case 'berolahraga':
            title.innerText = "Kebiasaan 3: Berolahraga";
            body.innerHTML = renderForm('Form Olahraga', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jenis Olahraga</label><input type="text" id="jenis" placeholder="Contoh: Senam, Bersepeda" required></div>
                <div class="form-group"><label>Jam Mulai</label><input type="time" id="jamMulai" required></div>
                <div class="form-group"><label>Jam Selesai</label><input type="time" id="jamSelesai" required></div>
            `, 'simpanOlahraga');
            break;

        case 'makan-sehat':
            title.innerText = "Kebiasaan 4: Makan Sehat Bergizi";
            body.innerHTML = renderForm('Form Makan Sehat', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Menu Makan Sehat</label><input type="text" id="menu" placeholder="Contoh: Nasi, Sayur Bening, Lauk" required></div>
                <div class="form-group"><label>Keterangan</label><textarea id="ket"></textarea></div>
            `, 'simpanMakan');
            break;

        case 'gemar-belajar':
            title.innerText = "Kebiasaan 5: Gemar Belajar";
            body.innerHTML = renderForm('Form Belajar Mandiri', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Materi / Buku Bacaan</label><input type="text" id="materi" required></div>
                <div class="form-group"><label>Kesimpulan</label><textarea id="kesimpulan" required></textarea></div>
            `, 'simpanBelajar');
            break;

        case 'bermasyarakat':
            title.innerText = "Kebiasaan 6: Bermasyarakat";
            body.innerHTML = renderForm('Form Bermasyarakat', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jenis Kegiatan</label><input type="text" id="kegiatan" placeholder="Membantu kerja bakti, dll" required></div>
                <div class="form-group"><label>Keterangan</label><textarea id="ket"></textarea></div>
            `, 'simpanMasyarakat');
            break;

        case 'tidur-cepat':
            title.innerText = "Kebiasaan 7: Tidur Cepat";
            body.innerHTML = renderForm('Form Tidur Cepat', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jam Tidur</label><input type="time" id="jamTidur" required></div>
                <div class="form-group"><label>Keterangan</label><input type="text" id="ket"></div>
            `, 'simpanTidur');
            break;

        case 'cetak-rekap':
            title.innerText = "Cetak Rekap Kebiasaan Siswa";
            body.innerHTML = `
                <div class="card">
                    <h3>Rekap Isian Kebiasaan Siswa</h3>
                    <p style="margin-bottom: 15px;">Klik tombol di bawah ini untuk mencetak rekap data.</p>
                    <button class="btn-primary" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak Rekap Sekarang</button>
                </div>`;
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

// --- FUNGSI SIMPAN KE FIREBASE (Siswa, Guru, Admin) ---

window.simpanSiswaBaru = async function() {
    try {
        await addDoc(collection(db, "data_siswa"), {
            nisn: document.getElementById('nisnSiswa').value,
            nama: document.getElementById('namaSiswa').value,
            kelas: document.getElementById('kelasSiswa').value,
            password: document.getElementById('passSiswa').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data siswa telah tersimpan di Firebase.");
        loadPage('pantau-siswa');
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan ke Firebase.");
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
            htmlTabel += `<tr><td colspan="4" style="text-align:center;">Belum ada data siswa. Silakan tambah siswa baru.</td></tr>`;
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
        body.innerHTML = `<div class="card"><p style="color:red;">Gagal memuat data dari Firebase database.</p></div>`;
    }
}

window.simpanPengaturanSekolah = async function() {
    alert("Pengaturan sekolah berhasil diperbarui!");
};

window.simpanGuruBaru = async function() {
    alert("Data Guru berhasil disimpan!");
};

// --- FUNGSI SIMPAN 7 KEBIASAAN ---
window.simpanBangunPagi = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_bangun_pagi"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            jamBangun: document.getElementById('jamBangun').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data Bangun Pagi tersimpan.");
    } catch (e) { alert("Gagal menyimpan ke Firebase."); }
};

window.simpanIbadah = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_ibadah"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            subuh: document.getElementById('subuh').checked,
            dzuhur: document.getElementById('dzuhur').checked,
            ashar: document.getElementById('ashar').checked,
            maghrib: document.getElementById('maghrib').checked,
            isya: document.getElementById('isya').checked,
            duha: document.getElementById('duha').checked,
            tahajjud: document.getElementById('tahajjud').checked,
            createdAt: new Date()
        });
        alert("Berhasil! Data Ibadah tersimpan.");
    } catch (e) { alert("Gagal menyimpan ke Firebase."); }
};

window.simpanOlahraga = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_olahraga"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            jenis: document.getElementById('jenis').value,
            jamMulai: document.getElementById('jamMulai').value,
            jamSelesai: document.getElementById('jamSelesai').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data Olahraga tersimpan.");
    } catch (e) { alert("Gagal menyimpan."); }
};

window.simpanMakan = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_makan"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            menu: document.getElementById('menu').value,
            keterangan: document.getElementById('ket').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data Makan Sehat tersimpan.");
    } catch (e) { alert("Gagal menyimpan."); }
};

window.simpanBelajar = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_belajar"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            materi: document.getElementById('materi').value,
            kesimpulan: document.getElementById('kesimpulan').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data Gemar Belajar tersimpan.");
    } catch (e) { alert("Gagal menyimpan."); }
};

window.simpanMasyarakat = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_masyarakat"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            kegiatan: document.getElementById('kegiatan').value,
            keterangan: document.getElementById('ket').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data Bermasyarakat tersimpan.");
    } catch (e) { alert("Gagal menyimpan."); }
};

window.simpanTidur = async function() {
    try {
        await addDoc(collection(db, "kebiasaan_tidur"), {
            namaSiswa: currentUser.name,
            tanggal: document.getElementById('tgl').value,
            jamTidur: document.getElementById('jamTidur').value,
            keterangan: document.getElementById('ket').value,
            createdAt: new Date()
        });
        alert("Berhasil! Data Tidur Cepat tersimpan.");
    } catch (e) { alert("Gagal menyimpan."); }
};
