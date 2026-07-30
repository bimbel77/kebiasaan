import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
                    if (username === 'admin' && password === '123456') { // Ganti password admin standar di sini jika perlu
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
                        alert("Akun Guru tidak ditemukan atau Password salah! Pastikan NIP/Username dan Password sesuai inputan Admin.");
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
                        alert("Akun Siswa tidak ditemukan atau Password salah! Pastikan NISN dan Password sesuai data dari Guru/Admin.");
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
                sidebar.style.display = (sidebar.style.display === 'none' || sidebar.style.display === '') ? 'flex' : 'none';
            }
        });
    }
});

// ==========================================
// FUNGSI PENDUKUNG AGAR SISTEM LOGIN TIDAK ERROR
// ==========================================

// 1. Fungsi Render Menu Sidebar berdasarkan Role User
function renderSidebarMenu() {
    const navMenu = document.getElementById('navMenu') || document.getElementById('sidebarMenu') || document.querySelector('.sidebar nav');
    if (!navMenu || !currentUser) return;

    let menuHTML = `
        <a href="#" onclick="loadPage('dashboard')" class="menu-item"> Dashboard</a>
    `;

    if (currentUser.role === 'admin') {
        menuHTML += `
            <a href="#" onclick="loadPage('kelola-guru')" class="menu-item"> Data Guru</a>
            <a href="#" onclick="loadPage('kelola-siswa')" class="menu-item"> Data Siswa</a>
            <a href="#" onclick="loadPage('pengaturan')" class="menu-item"> Pengaturan</a>
        `;
    } else if (currentUser.role === 'guru') {
        menuHTML += `
            <a href="#" onclick="loadPage('materi')" class="menu-item"> Kelola Kebiasaan/Materi</a>
            <a href="#" onclick="loadPage('rekap-siswa')" class="menu-item"> Rekapitulasi Siswa</a>
        `;
    } else if (currentUser.role === 'siswa') {
        menuHTML += `
            <a href="#" onclick="loadPage('kebiasaan')" class="menu-item"> Kebiasaan Saya</a>
            <a href="#" onclick="loadPage('profil')" class="menu-item"> Profil Saya</a>
        `;
    }

    navMenu.innerHTML = menuHTML;
}

// 2. Fungsi Load Page (Sederhana untuk menampilkan konten halaman)
function loadPage(pageName) {
    console.log(`Memuat halaman: ${pageName}`);
    const mainContent = document.getElementById('mainContent') || document.querySelector('.main-content');
    if (!mainContent) return;

    // Menampilkan pesan sederhana di area konten utama
    mainContent.innerHTML = `
        <div style="padding: 20px;">
            <h2>Halaman ${pageName.toUpperCase().replace('-', ' ')}</h2>
            <p>Selamat datang, <strong>${currentUser ? currentUser.name : 'Pengguna'}</strong>!</p>
        </div>
    `;
}

// Menjadikan fungsi loadPage global agar bisa dipanggil langsung via atribut onclick di HTML
window.loadPage = loadPage;
