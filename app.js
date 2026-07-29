import { db } from './firebase-config.js';
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, query, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
const todayStr = new Date().toISOString().split('T')[0];

const LIST_KEBIASAAN = [
  { id: 1, nama: "1. Bangun Pagi", desc: "Bangun tepat waktu di pagi hari" },
  { id: 2, nama: "2. Beribadah", desc: "Melaksanakan ibadah 5 waktu / sesuai agama" },
  { id: 3, nama: "3. Berolahraga", desc: "Melakukan aktivitas fisik & olahraga" },
  { id: 4, nama: "4. Makan Makanan Sehat", desc: "Makan makanan bergizi dan seimbang" },
  { id: 5, nama: "5. Gemar Membaca", desc: "Membaca buku pelajaran atau cerita" },
  { id: 6, nama: "6. Bermasyarakat", desc: "Membantu orang tua & lingkungan sekitar" },
  { id: 7, nama: "7. Tidur Cepat", desc: "Tidur malam tepat waktu" }
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
    if (u === "admin" && p === "admin123") {
      currentUser = { username: "admin", nama: "Administrator", role: "admin" };
    } else {
      const q = query(collection(db, "users"), where("username", "==", u), where("password", "==", p));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        currentUser = { id: docSnap.id, ...docSnap.data() };
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
    loadSiswaAdmin();
  } else if (currentUser.role === "guru") {
    showSection("sectionGuru");
    document.getElementById("titleKelasGuru").textContent = `Pemantauan Kelas ${currentUser.kelas}`;
    loadSiswaGuru();
  } else if (currentUser.role === "siswa") {
    showSection("sectionSiswa");
    renderFormKebiasaan(); // Panggil fungsi langsung render tanpa menunggu Firestore dulu
  }
}

function showSection(id) {
  ["sectionLogin", "sectionAdmin", "sectionGuru", "sectionSiswa"].forEach(s => {
    document.getElementById(s).classList.add("d-none");
  });
  document.getElementById(id).classList.remove("d-none");
}

// RENDER FORM KEBIASAAN LANGSUNG KELUAR DI KELAS SISWA
function renderFormKebiasaan() {
  const container = document.getElementById("container7Kebiasaan");
  container.innerHTML = "";

  LIST_KEBIASAAN.forEach(k => {
    let formFieldsHTML = "";

    if (k.id === 1) { // Bangun Pagi
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <div class="mb-2"><label class="form-label small">Jam Bangun</label><input type="time" id="jam_${k.id}" class="form-control form-control-sm" value="05:00"></div>
      `;
    } else if (k.id === 2) { // Beribadah
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <label class="form-label small fw-bold">Ceklis 5 Waktu Sholat:</label>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <div class="form-check"><input class="form-check-input" type="checkbox" id="sholat_subuh"><label class="form-check-label small">Subuh</label></div>
          <div class="form-check"><input class="form-check-input" type="checkbox" id="sholat_dzuhur"><label class="form-check-label small">Dzuhur</label></div>
          <div class="form-check"><input class="form-check-input" type="checkbox" id="sholat_ashar"><label class="form-check-label small">Ashar</label></div>
          <div class="form-check"><input class="form-check-input" type="checkbox" id="sholat_maghrib"><label class="form-check-label small">Maghrib</label></div>
          <div class="form-check"><input class="form-check-input" type="checkbox" id="sholat_isya"><label class="form-check-label small">Isya</label></div>
        </div>
      `;
    } else if (k.id === 3) { // Berolahraga
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <div class="mb-2"><label class="form-label small">Jenis Olahraga</label><input type="text" id="olahraga_${k.id}" class="form-control form-control-sm" placeholder="Contoh: Lari / Senam"></div>
      `;
    } else if (k.id === 4) { // Makan Sehat
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <div class="mb-2"><label class="form-label small">Isian Menu Bergizi</label><input type="text" id="menu_${k.id}" class="form-control form-control-sm" placeholder="Contoh: Nasi, Sayur Bayam, Telur"></div>
      `;
    } else if (k.id === 5) { // Gemar Membaca
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <div class="mb-2"><label class="form-label small">Judul Bacaan</label><input type="text" id="judul_${k.id}" class="form-control form-control-sm" placeholder="Judul buku"></div>
        <div class="mb-2"><label class="form-label small">Ringkasan</label><textarea id="ringkasan_${k.id}" class="form-control form-control-sm" rows="2" placeholder="Ringkasan singkat"></textarea></div>
      `;
    } else if (k.id === 6) { // Bermasyarakat
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <div class="mb-2"><label class="form-label small">Kegiatan</label><input type="text" id="kegiatan_${k.id}" class="form-control form-control-sm" placeholder="Contoh: Membantu Orang Tua / Kerja Bakti"></div>
      `;
    } else if (k.id === 7) { // Tidur Cepat
      formFieldsHTML = `
        <div class="mb-2"><label class="form-label small">Tanggal</label><input type="date" id="tgl_${k.id}" class="form-control form-control-sm" value="${todayStr}"></div>
        <div class="mb-2"><label class="form-label small">Jam Tidur</label><input type="time" id="jam_${k.id}" class="form-control form-control-sm" value="21:00"></div>
      `;
    }

    container.innerHTML += `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 border-0 shadow-sm">
        <div class="card-body d-flex flex-column justify-content-between">
          <div>
            <h5 class="card-title text-primary fw-bold">${k.nama}</h5>
            <p class="card-text text-muted small mb-3">${k.desc}</p>
            ${formFieldsHTML}
          </div>
          <div class="mt-3">
            <button onclick="simpanKebiasaanSiswa(${k.id})" class="btn btn-sm btn-outline-success w-100">
              Simpan Kebiasaan
            </button>
          </div>
        </div>
      </div>
    </div>`;
  });
}

window.simpanKebiasaanSiswa = async function(kebiasaanId) {
  const tglVal = document.getElementById(`tgl_${kebiasaanId}`).value;
  const sId = currentUser.id || currentUser.username; // fallback ke username jika id undefined
  const docId = `${sId}_${kebiasaanId}_${tglVal}`;

  let payload = {
    siswa_id: sId,
    kebiasaan_id: kebiasaanId,
    tanggal: tglVal,
    status: "Ya"
  };

  if (kebiasaanId === 1 || kebiasaanId === 7) {
    payload.jam = document.getElementById(`jam_${kebiasaanId}`).value;
  } else if (kebiasaanId === 2) {
    payload.sholat = {
      subuh: document.getElementById("sholat_subuh").checked,
      dzuhur: document.getElementById("sholat_dzuhur").checked,
      ashar: document.getElementById("sholat_ashar").checked,
      maghrib: document.getElementById("sholat_maghrib").checked,
      isya: document.getElementById("sholat_isya").checked
    };
  } else if (kebiasaanId === 3) {
    payload.jenis_olahraga = document.getElementById(`olahraga_${kebiasaanId}`).value;
  } else if (kebiasaanId === 4) {
    payload.menu = document.getElementById(`menu_${kebiasaanId}`).value;
  } else if (kebiasaanId === 5) {
    payload.judul = document.getElementById(`judul_${kebiasaanId}`).value;
    payload.ringkasan = document.getElementById(`ringkasan_${kebiasaanId}`).value;
  } else if (kebiasaanId === 6) {
    payload.kegiatan = document.getElementById(`kegiatan_${kebiasaanId}`).value;
  }

  try {
    await setDoc(doc(db, "log_kebiasaan", docId), payload);
    alert("Data kebiasaan berhasil disimpan!");
  } catch (err) {
    alert("Gagal menyimpan data: " + err.message);
  }
};

// LOGIKA ADMIN & GURU DENGAN FITUR IMPORT CSV
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

async function loadSiswaAdmin() {
  const q = query(collection(db, "users"), where("role", "==", "siswa"));
  const snapshot = await getDocs(q);
  const tbody = document.getElementById("tabelSiswaAdmin");
  tbody.innerHTML = "";
  let no = 1;
  snapshot.forEach(doc => {
    const s = doc.data();
    tbody.innerHTML += `<tr>
      <td>${no++}</td>
      <td>${s.nisn}</td>
      <td>${s.nama}</td>
      <td><span class="badge bg-secondary">Kelas ${s.kelas}</span></td>
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

async function loadSiswaGuru() {
  const q = query(collection(db, "users"), where("role", "==", "siswa"), where("kelas", "==", currentUser.kelas));
  const snapshot = await getDocs(q);
  const tbody = document.getElementById("tabelSiswaGuru");
  tbody.innerHTML = "";
  let no = 1;

  for (const docSiswa of snapshot.docs) {
    const s = docSiswa.data();
    const sId = docSiswa.id;

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
  const kelas = currentUser.role === "guru" ? currentUser.kelas : document.getElementById("siswaKelas").value;

  await addDoc(collection(db, "users"), {
    nama: document.getElementById("siswaNama").value,
    nisn: nisn,
    username: nisn,
    password: nisn,
    kelas: kelas,
    role: "siswa"
  });
  bootstrap.Modal.getInstance(document.getElementById("modalTambahSiswa")).hide();
  document.getElementById("formTambahSiswa").reset();
  
  if(currentUser.role === "guru") loadSiswaGuru();
  else loadSiswaAdmin();
}

window.downloadFormatGuru = function() {
  const csvContent = "data:text/csv;charset=utf-8,nama,kelas,username,password\nBudi Santoso,1A,budi1a,123456\nSiti Rahma,2B,siti2b,123456";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "format_import_guru.csv");
  document.body.appendChild(link);
  link.click();
};

window.downloadFormatSiswa = function() {
  const csvContent = "data:text/csv;charset=utf-8,nisn,nama,kelas\n1234567890,Ahmad Fauzi,1A\n0987654321,Anisa Putri,1A";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "format_import_siswa.csv");
  document.body.appendChild(link);
  link.click();
};

window.prosesImportGuru = function() {
  const fileInput = document.getElementById("fileCsvGuru");
  if (!fileInput.files.length) return alert("Pilih file CSV terlebih dahulu!");

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [nama, kelas, username, password] = line.split(",");
        if (nama && username) {
          await addDoc(collection(db, "users"), {
            nama, kelas, username, password, role: "guru"
          });
        }
      }
    }
    alert("Import Data Guru Berhasil!");
    bootstrap.Modal.getInstance(document.getElementById("modalImportGuru")).hide();
    loadGuru();
  };
  reader.readAsText(file);
};

window.prosesImportSiswa = function() {
  const fileInput = document.getElementById("fileCsvSiswa");
  if (!fileInput.files.length) return alert("Pilih file CSV terlebih dahulu!");

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const [nisn, nama, kelas] = line.split(",");
        const kelasFix = currentUser.role === "guru" ? currentUser.kelas : kelas;
        if (nisn && nama) {
          await addDoc(collection(db, "users"), {
            nisn: nisn.trim(),
            nama: nama.trim(),
            username: nisn.trim(),
            password: nisn.trim(),
            kelas: kelasFix ? kelasFix.trim() : "",
            role: "siswa"
          });
        }
      }
    }
    alert("Import Data Siswa Berhasil!");
    bootstrap.Modal.getInstance(document.getElementById("modalImportSiswa")).hide();
    if (currentUser.role === "guru") loadSiswaGuru();
    else loadSiswaAdmin();
  };
  reader.readAsText(file);
};

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
