import { db } from './firebase-config.js';
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
const todayStr = new Date().toISOString().split('T')[0];

const LIST_KEBIASAAN = [
  { id: 1, nama: "Bangun Pagi", desc: "Bangun tepat waktu di pagi hari" },
  { id: 2, nama: "Beribadah", desc: "Melaksanakan ibadah sesuai agama masing-masing" },
  { id: 3, nama: "Berolahraga", desc: "Melakukan aktivitas fisik minimal 15-30 menit" },
  { id: 4, nama: "Makan Makanan Sehat", desc: "Makan makanan bergizi & minum air putih cukup" },
  { id: 5, nama: "Gemar Membaca", desc: "Membaca buku pelajaran/cerita minimal 15 menit" },
  { id: 6, nama: "Bermasyarakat", desc: "Membantu orang tua, menyapa tetangga, atau berbuat baik" },
  { id: 7, nama: "Tidur Cepat", desc: "Tidur malam tepat waktu (tidak begadang)" }
];

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  document.getElementById("formLogin").addEventListener("submit", handleLogin);
  document.getElementById("btnLogout").addEventListener("click", handleLogout);
  document.getElementById("formSekolah").addEventListener("submit", simpanSekolah);
  document.getElementById("formTambahGuru").addEventListener("submit", tambahGuru);
  document.getElementById("formTambahSiswa").addEventListener("submit", tambahSiswa);
});

async function initApp() {
  const savedUser = localStorage.getItem("user_kebiasaan");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showDashboard();
  } else {
    showSection("sectionLogin");
  }
}

// LOGIN SYSTEM
async function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById("loginUsername").value.trim();
  const p = document.getElementById("loginPassword").value.trim();
  const alertBox = document.getElementById("loginAlert");

  try {
    // Cek Admin Default
    if (u === "admin" && p === "admin123") {
      currentUser = { username: "admin", nama: "Administrator", role: "admin" };
    } else {
      // Cek Firestore
      const q = query(collection(db, "users"), where("username", "==", u), where("password", "==", p));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docData = snapshot.docs[0].data();
        currentUser = { id: snapshot.docs[0].id, ...docData };
      } else {
        alertBox.textContent = "Username atau Password salah!";
        alertBox.classList.remove("d-none");
        return;
      }
    }
    localStorage.setItem("user_kebiasaan", JSON.stringify(currentUser));
    showDashboard();
  } catch (err) {
    alertBox.textContent = "Terjadi kesalahan: " + err.message;
    alertBox.classList.remove("d-none");
  }
}

function handleLogout() {
  localStorage.removeItem("user_kebiasaan");
  currentUser = null;
  document.getElementById("navbar").classList.add("d-none");
  showSection("sectionLogin");
}

function showDashboard() {
  document.getElementById("navbar").classList.remove("d-none");
  document.getElementById("userInfo").textContent = `${currentUser.nama} (${currentUser.role.toUpperCase()})`;

  if (currentUser.role === "admin") {
    showSection("sectionAdmin");
    loadSekolah();
    loadGuru();
  } else if (currentUser.role === "guru") {
    showSection("sectionGuru");
    document.getElementById("titleKelasGuru").textContent = `Pemantauan Kelas ${currentUser.kelas}`;
    loadSiswaGuru();
  } else if (currentUser.role === "siswa") {
    showSection("sectionSiswa");
    document.getElementById("tglHariIni").textContent = `Pantauan Harian: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    loadKebiasaanSiswa();
  }
}

function showSection(id) {
  ["sectionLogin", "sectionAdmin", "sectionGuru", "sectionSiswa"].forEach(s => {
    document.getElementById(s).classList.add("d-none");
  });
  document.getElementById(id).classList.remove("d-none");
}

// LOGIKA ADMIN
async function loadSekolah() {
  const docRef = doc(db, "pengaturan", "sekolah");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("namaSekolah").value = data.nama || "";
    document.getElementById("alamatSekolah").value = data.alamat || "";
    document.getElementById("kepalaSekolah").value = data.kepala || "";
  }
}

async function simpanSekolah(e) {
  e.preventDefault();
  await setDoc(doc(db, "pengaturan", "sekolah"), {
    nama: document.getElementById("namaSekolah").value,
    alamat: document.getElementById("alamatSekolah").value,
    kepala: document.getElementById("kepalaSekolah").value
  });
  alert("Pengaturan sekolah berhasil disimpan!");
}

async function loadGuru() {
  const q = query(collection(db, "users"), where("role", "==", "guru"));
  const snapshot = await getDocs(q);
  const tbody = document.getElementById("tabelGuru");
  tbody.innerHTML = "";
  let no = 1;
  snapshot.forEach(doc => {
    const g = doc.data();
    tbody.innerHTML += `<tr>
      <td>${no++}</td>
      <td>${g.nama}</td>
      <td>${g.username}</td>
      <td><span class="badge bg-info">Kelas ${g.kelas}</span></td>
    </tr>`;
  });
}

async function tambahGuru(e) {
  e.preventDefault();
  await addDoc(collection(db, "users"), {
    nama: document.getElementById("guruNama").value,
    kelas: document.getElementById("guruKelas").value,
    username: document.getElementById("guruUsername").value,
    password: document.getElementById("guruPassword").value,
    role: "guru"
  });
  bootstrap.Modal.getInstance(document.getElementById("modalTambahGuru")).hide();
  document.getElementById("formTambahGuru").reset();
  loadGuru();
}

// LOGIKA GURU
async function loadSiswaGuru() {
  const q = query(collection(db, "users"), where("role", "==", "siswa"), where("kelas", "==", currentUser.kelas));
  const snapshot = await getDocs(q);
  const tbody = document.getElementById("tabelSiswaGuru");
  tbody.innerHTML = "";
  let no = 1;

  for (const docSiswa of snapshot.docs) {
    const s = docSiswa.data();
    const sId = docSiswa.id;

    // Cek log hari ini
    const logQ = query(collection(db, "log_kebiasaan"), where("siswa_id", "==", sId), where("tanggal", "==", todayStr), where("status", "==", "Ya"));
    const logSnap = await getDocs(logQ);
    const count = logSnap.size;

    tbody.innerHTML += `<tr>
      <td>${no++}</td>
      <td>${s.nisn}</td>
      <td>${s.nama}</td>
      <td><span class="badge bg-${count === 7 ? 'success' : 'primary'}">${count} / 7 Terlaksana</span></td>
    </tr>`;
  }
}

async function tambahSiswa(e) {
  e.preventDefault();
  const nisn = document.getElementById("siswaNisn").value;
  await addDoc(collection(db, "users"), {
    nama: document.getElementById("siswaNama").value,
    nisn: nisn,
    username: nisn,
    password: nisn,
    kelas: currentUser.kelas,
    role: "siswa"
  });
  bootstrap.Modal.getInstance(document.getElementById("modalTambahSiswa")).hide();
  document.getElementById("formTambahSiswa").reset();
  loadSiswaGuru();
}

// LOGIKA SISWA
async function loadKebiasaanSiswa() {
  const container = document.getElementById("container7Kebiasaan");
  container.innerHTML = "";

  for (const k of LIST_KEBIASAAN) {
    const docId = `${currentUser.id}_${k.id}_${todayStr}`;
    const logRef = doc(db, "log_kebiasaan", docId);
    const logSnap = await getDoc(logRef);
    const isDone = logSnap.exists() && logSnap.data().status === "Ya";
    const catatan = logSnap.exists() ? (logSnap.data().catatan || "") : "";

    container.innerHTML += `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm ${isDone ? 'border-start border-success border-4' : ''}">
        <div class="card-body d-flex flex-column justify-content-between">
          <div>
            <h5 class="card-title text-primary fw-bold">${k.nama}</h5>
            <p class="card-text text-muted small">${k.desc}</p>
          </div>
          <div class="mt-3">
            <input type="text" id="catatan_${k.id}" class="form-control form-control-sm mb-2" placeholder="Catatan (Opsional)" value="${catatan}">
            <button onclick="simpanKebiasaanSiswa(${k.id})" class="btn btn-sm w-100 ${isDone ? 'btn-success' : 'btn-outline-success'}">
              ${isDone ? '✓ Sudah Terlaksana' : 'Tandai Sudah'}
            </button>
          </div>
        </div>
      </div>
    </div>`;
  }
}

window.simpanKebiasaanSiswa = async function(kebiasaanId) {
  const docId = `${currentUser.id}_${kebiasaanId}_${todayStr}`;
  const catatanVal = document.getElementById(`catatan_${kebiasaanId}`).value;

  await setDoc(doc(db, "log_kebiasaan", docId), {
    siswa_id: currentUser.id,
    kebiasaan_id: kebiasaanId,
    tanggal: todayStr,
    status: "Ya",
    catatan: catatanVal
  });
  loadKebiasaanSiswa();
};

// FITUR CETAK (GURU)
window.cetakKartuLogin = async function() {
  const q = query(collection(db, "users"), where("role", "==", "siswa"), where("kelas", "==", currentUser.kelas));
  const snapshot = await getDocs(q);
  let html = `<div style="font-family:sans-serif; padding:20px;">
    <h3>Kartu Login Siswa - Kelas ${currentUser.kelas}</h3>
    <div style="display:flex; flex-wrap:wrap; gap:10px;">`;
  
  snapshot.forEach(doc => {
    const s = doc.data();
    html += `<div style="border:2px dashed #333; padding:15px; width:200px; border-radius:8px; text-align:center;">
      <h4>${s.nama}</h4>
      <p><b>NISN/User:</b> ${s.nisn}</p>
      <p><b>Password:</b> ${s.nisn}</p>
    </div>`;
  });
  html += `</div></div>`;
  
  const printWin = window.open('', '_blank');
  printWin.document.write(html);
  printWin.document.close();
  printWin.print();
};

window.cetakRekapHarian = async function() {
  const q = query(collection(db, "users"), where("role", "==", "siswa"), where("kelas", "==", currentUser.kelas));
  const snapshot = await getDocs(q);
  
  let html = `<div style="font-family:sans-serif; padding:20px;">
    <h2>Rekap 7 Kebiasaan Anak Indonesia Hebat</h2>
    <p>Kelas: ${currentUser.kelas} | Tanggal: ${todayStr}</p>
    <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; text-align:center;">
      <thead>
        <tr><th>No</th><th>Nama Siswa</th><th>Bangun Pagi</th><th>Beribadah</th><th>Olahraga</th><th>Makan Sehat</th><th>Membaca</th><th>Bermasyarakat</th><th>Tidur Cepat</th></tr>
      </thead>
      <tbody>`;

  let no = 1;
  for (const docSiswa of snapshot.docs) {
    const s = docSiswa.data();
    const sId = docSiswa.id;
    html += `<tr><td>${no++}</td><td style="text-align:left;">${s.nama}</td>`;

    for (let k = 1; k <= 7; k++) {
      const docId = `${sId}_${k}_${todayStr}`;
      const logSnap = await getDoc(doc(db, "log_kebiasaan", docId));
      const st = (logSnap.exists() && logSnap.data().status === "Ya") ? "✓" : "-";
      html += `<td>${st}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table></div>`;
  const printWin = window.open('', '_blank');
  printWin.document.write(html);
  printWin.document.close();
  printWin.print();
};