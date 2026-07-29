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
            sidebar.style.display = (sidebar.style.display === 'none' || sidebar.style.display === '') ? 'flex' : 'none';
        });
    }
});
