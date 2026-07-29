import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Session State Sederhana (Dapat disesuaikan dengan Auth)
let currentUser = {
    role: 'siswa', // Opsi: 'admin', 'guru', 'siswa'
    name: 'Siswa Contoh',
    kelas: '5A'
};

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    document.getElementById('userRoleBadge').innerText = currentUser.role;
    document.getElementById('userNameDisplay').innerText = currentUser.name;
    renderSidebarMenu();
    loadPage('dashboard');
}

// 1. Sidebar Navigasi Berdasarkan Role
function renderSidebarMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.innerHTML = '';

    let menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' }
    ];

    if (currentUser.role === 'admin') {
        menuItems.push(
            { id: 'pengaturan-sekolah', label: 'Pengaturan Sekolah', icon: 'fa-school' },
            { id: 'kelola-guru', label: 'Data Guru', icon: 'fa-chalkboard-user' },
            { id: 'kelola-siswa-admin', label: 'Data Siswa', icon: 'fa-users' }
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

    menuItems.forEach(item => {
        const a = document.createElement('a');
        a.className = 'nav-item';
        a.innerHTML = `<i class="fa-solid ${item.icon}"></i> ${item.label}`;
        a.onclick = () => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            a.classList.add('active');
            loadPage(item.id);
        };
        navMenu.appendChild(a);
    });
}

// 2. Router Halaman Konten
window.loadPage = function(pageId) {
    const body = document.getElementById('contentBody');
    const title = document.getElementById('pageTitle');

    switch(pageId) {
        case 'dashboard':
            title.innerText = "Dashboard Overview";
            body.innerHTML = `
                <div class="card">
                    <h3>Selamat Datang, ${currentUser.name}!</h3>
                    <p>Sistem Pemantauan 7 Kebiasaan Anak Indonesia Hebat.</p>
                </div>`;
            break;

        // --- MENU SISWA (7 KEBIASAAN) ---
        case 'bangun-pagi':
            title.innerText = "Kebiasaan 1: Bangun Pagi";
            body.innerHTML = renderForm('Form Bangun Pagi', `
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="tgl" required>
                </div>
                <div class="form-group">
                    <label>Jam Bangun</label>
                    <input type="time" id="jamBangun" required>
                </div>`, 'simpanBangunPagi');
            break;

        case 'beribadah':
            title.innerText = "Kebiasaan 2: Beribadah";
            body.innerHTML = renderForm('Form Ibadah Harian', `
                <div class="form-group">
                    <label>Tanggal</label>
                    <input type="date" id="tgl" required>
                </div>
                <div class="form-group">
                    <label>Ceklis Sholat / Ibadah</label>
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="subuh"> Subuh</label>
                        <label class="checkbox-item"><input type="checkbox" id="dzuhur"> Dzuhur</label>
                        <label class="checkbox-item"><input type="checkbox" id="ashar"> Ashar</label>
                        <label class="checkbox-item"><input type="checkbox" id="maghrib"> Maghrib</label>
                        <label class="checkbox-item"><input type="checkbox" id="isya"> Isya</label>
                        <label class="checkbox-item"><input type="checkbox" id="duha"> Duha</label>
                        <label class="checkbox-item"><input type="checkbox" id="tahajjud"> Tahajjud</label>
                    </div>
                </div>`, 'simpanIbadah');
            break;

        case 'berolahraga':
            title.innerText = "Kebiasaan 3: Berolahraga";
            body.innerHTML = renderForm('Form Olahraga', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jenis Olahraga</label><input type="text" id="jenisOlahraga" placeholder="Contoh: Lari, Senam"></div>
                <div class="form-group"><label>Waktu Mulai</label><input type="time" id="jamMulai"></div>
                <div class="form-group"><label>Waktu Selesai</label><input type="time" id="jamSelesai"></div>`, 'simpanOlahraga');
            break;

        case 'makan-sehat':
            title.innerText = "Kebiasaan 4: Makan Sehat Bergizi";
            body.innerHTML = renderForm('Form Makan Sehat', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Menu Makan Sehat</label><input type="text" id="menuMakan" placeholder="Nasi, Sayur Bayam, Telur"></div>
                <div class="form-group"><label>Keterangan</label><textarea id="ket"></textarea></div>`, 'simpanMakan');
            break;

        case 'gemar-belajar':
            title.innerText = "Kebiasaan 5: Gemar Belajar";
            body.innerHTML = renderForm('Form Belajar Mandiri', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Materi / Bacaan</label><input type="text" id="materi"></div>
                <div class="form-group"><label>Rangkuman / Kesimpulan</label><textarea id="kesimpulan"></textarea></div>`, 'simpanBelajar');
            break;

        case 'bermasyarakat':
            title.innerText = "Kebiasaan 6: Bermasyarakat";
            body.innerHTML = renderForm('Form Kegiatan Bermasyarakat', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jenis Kegiatan</label><input type="text" id="kegiatan" placeholder="Gotong royong, membantu tetangga"></div>
                <div class="form-group"><label>Keterangan</label><textarea id="ket"></textarea></div>`, 'simpanMasyarakat');
            break;

        case 'tidur-cepat':
            title.innerText = "Kebiasaan 7: Tidur Cepat";
            body.innerHTML = renderForm('Form Istirahat Malam', `
                <div class="form-group"><label>Tanggal</label><input type="date" id="tgl" required></div>
                <div class="form-group"><label>Jam Tidur</label><input type="time" id="jamTidur"></div>
                <div class="form-group"><label>Keterangan</label><input type="text" id="ket"></div>`, 'simpanTidur');
            break;

        // --- MENU GURU ---
        case 'cetak-rekap':
            title.innerText = "Cetak Rekap Kebiasaan Siswa";
            body.innerHTML = `
                <div class="card">
                    <button class="btn-primary" onclick="window.print()"><i class="fa-solid fa-print"></i> Cetak Laporan</button>
                </div>`;
            break;

        default:
            body.innerHTML = `<div class="card"><h3>Halaman sedang dikembangkan</h3></div>`;
    }
}

// Template Helper Form
function renderForm(title, fieldsHtml, submitFunctionName) {
    return `
        <div class="card">
            <h3>${title}</h3>
            <form onsubmit="event.preventDefault(); ${submitFunctionName}();" style="margin-top:15px;">
                ${fieldsHtml}
                <button type="submit" class="btn-primary">Simpan Data</button>
            </form>
        </div>`;
}

// 3. Simpan Data Ke Firestore
window.simpanBangunPagi = async function() {
    const tgl = document.getElementById('tgl').value;
    const jam = document.getElementById('jamBangun').value;

    try {
        await addDoc(collection(db, "kebiasaan_bangun_pagi"), {
            namaSiswa: currentUser.name,
            tanggal: tgl,
            jamBangun: jam,
            createdAt: new Date()
        });
        alert("Data Bangun Pagi Berhasil Disimpan!");
    } catch (e) {
        console.error("Error: ", e);
        alert("Gagal menyimpan data.");
    }
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
};
