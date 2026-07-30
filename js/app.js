import { db } from './firebase-config.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const btnLogout = document.getElementById('btnLogout');
    const btnToggle = document.getElementById('btnToggle');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const role = document.getElementById('roleSelect').value;
            const username = document.getElementById('usernameInput').value.trim();
            const password = document.getElementById('passwordInput').value.trim();

            if (!username || !password) {
                alert("Silakan isi Username dan Password!");
                return;
            }

            // Tampilkan status memuat
            const btnSubmit = formLogin.querySelector('button[type="submit"]');
            const textAwal = btnSubmit.innerText;
            btnSubmit.innerText = "Memeriksa Akun...";
            btnSubmit.disabled = true;

            try {
                let userValid = false;
                let userData = null;

                // 1. OPSI ADMIN (Akun Standar Master)
                if (role === 'admin') {
                    if (username === 'admin' && password === '123456') {
                        userValid = true;
                        userData = { name: "Administrator", id: "admin_master" };
                    } else {
                        alert("Username atau Password Admin salah!");
                    }
                } 
                // 2. OPSI GURU (Cek Database Firebase)
                else if (role === 'guru') {
                    const q = query(
                        collection(db, "data_guru"), 
                        where("nip", "==", username), 
                        where("password", "==", password)
                    );
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        userValid = true;
                        const data = querySnapshot.docs[0].data();
                        userData = { name: data.nama, id: querySnapshot.docs[0].id };
                    } else {
                        alert("Akun Guru tidak ditemukan atau Password salah!");
                    }
                } 
                // 3. OPSI SISWA (Cek Database Firebase)
                else if (role === 'siswa') {
                    const q = query(
                        collection(db, "data_siswa"), 
                        where("nisn", "==", username), 
                        where("password", "==", password)
                    );
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        userValid = true;
                        const data = querySnapshot.docs[0].data();
                        userData = { name: data.nama, id: querySnapshot.docs[0].id, kelas: data.kelas };
                    } else {
                        alert("Akun Siswa tidak ditemukan atau Password salah!");
                    }
                }

                // Jika Berhasil Login
                if (userValid) {
                    currentUser = { role: role, name: userData.name, id: userData.id };

                    document.getElementById('loginModal').style.setProperty('display', 'none', 'important');
                    document.getElementById('appContainer').style.display = 'flex';

                    document.getElementById('userRoleBadge').innerText = role.toUpperCase();
                    document.getElementById('userNameDisplay').innerText = userData.name;

                    renderSidebarMenu();
                    loadPage('dashboard');
                }

            } catch (err) {
                console.error("Login Error: ", err);
                alert("Terjadi kesalahan sistem saat mencoba login.");
            } finally {
                btnSubmit.innerText = textAwal;
                btnSubmit.disabled = false;
            }
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
            if (sidebar) {
                sidebar.classList.toggle('active');
                if (sidebar.style.display === 'none' || sidebar.style.display === '') {
                    sidebar.style.display = 'flex';
                } else {
                    sidebar.style.display = 'none';
                }
            }
        });
    }
});

// ==========================================
// FUNGSI PENDUKUNG NAVIGASI & RENDER HALAMAN
// ==========================================

function renderSidebarMenu() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu || !currentUser) return;

    let menuHTML = `
        <a href="javascript:void(0)" onclick="window.loadPage('dashboard')" class="nav-item active" id="menu-dashboard">
            <i class="fa-solid fa-chart-line"></i> Dashboard
        </a>
    `;

    if (currentUser.role === 'admin') {
        menuHTML += `
            <a href="javascript:void(0)" onclick="window.loadPage('kelola-guru')" class="nav-item" id="menu-kelola-guru">
                <i class="fa-solid fa-chalkboard-user"></i> Data Guru
            </a>
            <a href="javascript:void(0)" onclick="window.loadPage('kelola-siswa')" class="nav-item" id="menu-kelola-siswa">
                <i class="fa-solid fa-users"></i> Data Siswa
            </a>
            <a href="javascript:void(0)" onclick="window.loadPage('pengaturan')" class="nav-item" id="menu-pengaturan">
                <i class="fa-solid fa-gear"></i> Pengaturan
            </a>
        `;
    } else if (currentUser.role === 'guru') {
        menuHTML += `
            <a href="javascript:void(0)" onclick="window.loadPage('materi')" class="nav-item" id="menu-materi">
                <i class="fa-solid fa-book-open"></i> Kelola Kebiasaan
            </a>
            <a href="javascript:void(0)" onclick="window.loadPage('rekap-siswa')" class="nav-item" id="menu-rekap-siswa">
                <i class="fa-solid fa-clipboard-list"></i> Rekapitulasi Siswa
            </a>
        `;
    } else if (currentUser.role === 'siswa') {
        menuHTML += `
            <a href="javascript:void(0)" onclick="window.loadPage('kebiasaan')" class="nav-item" id="menu-kebiasaan">
                <i class="fa-solid fa-star"></i> Kebiasaan Saya
            </a>
            <a href="javascript:void(0)" onclick="window.loadPage('profil')" class="nav-item" id="menu-profil">
                <i class="fa-solid fa-user"></i> Profil Saya
            </a>
        `;
    }

    navMenu.innerHTML = menuHTML;
}

function loadPage(pageName) {
    const contentBody = document.getElementById('contentBody');
    const pageTitle = document.getElementById('pageTitle');
    if (!contentBody || !currentUser) return;

    // Update kelas active di menu
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeMenu = document.getElementById(`menu-${pageName}`);
    if (activeMenu) activeMenu.classList.add('active');

    // Ubah judul halaman
    const formattedTitle = pageName.replace('-', ' ').toUpperCase();
    if (pageTitle) pageTitle.innerText = formattedTitle;

    // Konten dinamis per halaman
    contentBody.innerHTML = `
        <div class="card">
            <h3>Selamat Datang di Halaman ${formattedTitle}</h3>
            <p style="margin-top: 10px; color: #707ebe;">
                Halo, <strong>${currentUser.name}</strong> (${currentUser.role.toUpperCase()}). Layanan siap digunakan.
            </p>
        </div>
    `;
}

// Mengekspos fungsi loadPage ke global window agar bisa diakses via onclick HTML
window.loadPage = loadPage;
