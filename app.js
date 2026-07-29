import { db, auth } from "./firebase-config.js"; // pastikan firebase terkonfigurasi
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Dummy Data Pengguna Aktif (Jika belum menggunakan Auth Firestore penuh)
const currentUser = {
  id: "SISWA_101",
  nama: "ZAKARIA",
  kelas: "5 A",
  username: "zakaria129"
};

// Map Nama Kebiasaan
const NAMA_KEBIASAAN = {
  1: "1. Bangun Pagi",
  2: "2. Beribadah",
  3: "3. Berolahraga",
  4: "4. Makan Makanan Sehat",
  5: "5. Gemar Membaca",
  6: "6. Bermasyarakat",
  7: "7. Tidur Cepat"
};

// Format Tanggal Hari Ini (YYYY-MM-DD)
const todayStr = new Date().toISOString().split('T')[0];

document.addEventListener("DOMContentLoaded", () => {
  // Set default tanggal form ke hari ini
  const tglInput = document.getElementById("jurnalTanggal");
  if (tglInput) tglInput.value = todayStr;

  // Render Dashboard
  renderDashboardSiswa();

  // Attach submit listener
  const formJurnal = document.getElementById("formTambahJurnal");
  if (formJurnal) {
    formJurnal.addEventListener("submit", simpanJurnalSiswa);
  }
});

// Menampilkan Dashboard Siswa
function renderDashboardSiswa() {
  const elemSidebarNama = document.getElementById("sidebarSiswaNama");
  const elemSidebarKelas = document.getElementById("sidebarSiswaKelas");
  const elemHeaderNama = document.getElementById("headerSiswaNama");

  if (elemSidebarNama) elemSidebarNama.textContent = currentUser.nama;
  if (elemSidebarKelas) elemSidebarKelas.textContent = `Kelas ${currentUser.kelas || '-'}`;
  if (elemHeaderNama) elemHeaderNama.textContent = `${currentUser.nama} (SISWA) - SD NEGERI 129 BARRU`;
  
  loadRiwayatSiswa();
}

// Memuat Tabel Riwayat
async function loadRiwayatSiswa() {
  const sId = currentUser.id || currentUser.username;
  const tbody = document.getElementById("tabelRiwayatKebiasaan");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3">Memuat riwayat...</td></tr>`;

  try {
    const q = query(collection(db, "log_kebiasaan"), where("siswa_id", "==", sId));
    const snapshot = await getDocs(q);

    // Update Counter di Card Dashboard
    const totalElem = document.getElementById("statTotalJurnal");
    if (totalElem) totalElem.textContent = snapshot.size;

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Belum ada riwayat kegiatan. Klik tombol <b>"+ Tambah Kegiatan Kebiasaan"</b> untuk menambahkan.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    let no = 1;
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      
      // Format Rincian
      let rincian = "-";
      if (d.kebiasaan_id == 1 || d.kebiasaan_id == 7) rincian = `Pukul: <b>${d.jam || '-'}</b>`;
      else if (d.kebiasaan_id == 2) {
        const sh = d.sholat || {};
        const listSholat = [];
        if (sh.subuh) listSholat.push("Subuh");
        if (sh.dzuhur) listSholat.push("Dzuhur");
        if (sh.ashar) listSholat.push("Ashar");
        if (sh.maghrib) listSholat.push("Maghrib");
        if (sh.isya) listSholat.push("Isya");
        rincian = listSholat.length > 0 ? listSholat.join(", ") : "Tidak sholat";
      }
      else if (d.kebiasaan_id == 3) rincian = `Olahraga: <b>${d.jenis_olahraga || '-'}</b>`;
      else if (d.kebiasaan_id == 4) rincian = `Menu: <b>${d.menu || '-'}</b>`;
      else if (d.kebiasaan_id == 5) rincian = `Judul: <b>${d.judul || '-'}</b> (${d.ringkasan || ''})`;
      else if (d.kebiasaan_id == 6) rincian = `Kegiatan: <b>${d.kegiatan || '-'}</b>`;

      tbody.innerHTML += `
        <tr>
          <td>${no++}</td>
          <td>${d.tanggal}</td>
          <td><span class="fw-bold text-dark">${NAMA_KEBIASAAN[d.kebiasaan_id] || d.kebiasaan_id}</span></td>
          <td>${rincian}</td>
          <td class="text-center"><span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Terlaksana</span></td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

// Render Input Dinamis di Modal (Didaftarkan ke window agar onchange HTML dapat memanggilnya)
window.toggleFormDetail = function(val) {
  const container = document.getElementById("fieldDetailJurnal");
  val = parseInt(val);

  if (val === 1 || val === 7) {
    container.innerHTML = `
      <label class="form-label small fw-bold">Jam Berapa?</label>
      <input type="time" id="valJam" class="form-control form-control-sm" value="${val === 1 ? '05:00' : '21:00'}" required>
    `;
  } else if (val === 2) {
    container.innerHTML = `
      <label class="form-label small fw-bold mb-2">Ceklis Sholat yang Dilaksanakan:</label>
      <div class="d-flex flex-wrap gap-3">
        <div class="form-check"><input class="form-check-input" type="checkbox" id="sh_subuh"><label class="form-check-label small">Subuh</label></div>
        <div class="form-check"><input class="form-check-input" type="checkbox" id="sh_dzuhur"><label class="form-check-label small">Dzuhur</label></div>
        <div class="form-check"><input class="form-check-input" type="checkbox" id="sh_ashar"><label class="form-check-label small">Ashar</label></div>
        <div class="form-check"><input class="form-check-input" type="checkbox" id="sh_maghrib"><label class="form-check-label small">Maghrib</label></div>
        <div class="form-check"><input class="form-check-input" type="checkbox" id="sh_isya"><label class="form-check-label small">Isya</label></div>
      </div>
    `;
  } else if (val === 3) {
    container.innerHTML = `
      <label class="form-label small fw-bold">Jenis Olahraga</label>
      <input type="text" id="valOlahraga" class="form-control form-control-sm" placeholder="Contoh: Lari, Sepeda, Senam" required>
    `;
  } else if (val === 4) {
    container.innerHTML = `
      <label class="form-label small fw-bold">Menu Bergizi</label>
      <input type="text" id="valMenu" class="form-control form-control-sm" placeholder="Contoh: Nasi, Sayur Bayam, Telur" required>
    `;
  } else if (val === 5) {
    container.innerHTML = `
      <div class="mb-2"><label class="form-label small fw-bold">Judul Buku/Bacaan</label><input type="text" id="valJudul" class="form-control form-control-sm" placeholder="Judul Buku" required></div>
      <div><label class="form-label small fw-bold">Ringkasan</label><textarea id="valRingkasan" class="form-control form-control-sm" rows="2" placeholder="Ringkasan singkat"></textarea></div>
    `;
  } else if (val === 6) {
    container.innerHTML = `
      <label class="form-label small fw-bold">Kegiatan</label>
      <input type="text" id="valKegiatan" class="form-control form-control-sm" placeholder="Contoh: Membantu Orang Tua / Kerja Bakti" required>
    `;
  } else {
    container.innerHTML = `<p class="text-muted small mb-0">Silahkan pilih jenis kebiasaan terlebih dahulu.</p>`;
  }
};

// Simpan Data dari Modal ke Firestore
async function simpanJurnalSiswa(e) {
  e.preventDefault();
  const tglVal = document.getElementById("jurnalTanggal").value;
  const kId = parseInt(document.getElementById("jurnalJenis").value);
  const sId = currentUser.id || currentUser.username;
  const docId = `${sId}_${kId}_${tglVal}`;

  let payload = {
    siswa_id: sId,
    kebiasaan_id: kId,
    tanggal: tglVal,
    status: "Ya"
  };

  if (kId === 1 || kId === 7) payload.jam = document.getElementById("valJam").value;
  else if (kId === 2) {
    payload.sholat = {
      subuh: document.getElementById("sh_subuh").checked,
      dzuhur: document.getElementById("sh_dzuhur").checked,
      ashar: document.getElementById("sh_ashar").checked,
      maghrib: document.getElementById("sh_maghrib").checked,
      isya: document.getElementById("sh_isya").checked
    };
  } else if (kId === 3) payload.jenis_olahraga = document.getElementById("valOlahraga").value;
  else if (kId === 4) payload.menu = document.getElementById("valMenu").value;
  else if (kId === 5) {
    payload.judul = document.getElementById("valJudul").value;
    payload.ringkasan = document.getElementById("valRingkasan").value;
  } else if (kId === 6) payload.kegiatan = document.getElementById("valKegiatan").value;

  try {
    await setDoc(doc(db, "log_kebiasaan", docId), payload);
    alert("Jurnal kebiasaan berhasil ditambahkan!");
    
    // Tutup Modal
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById("modalTambahJurnal"));
    if (modalInstance) modalInstance.hide();

    // Reset Form
    document.getElementById("formTambahJurnal").reset();
    document.getElementById("fieldDetailJurnal").innerHTML = `<p class="text-muted small mb-0">Silahkan pilih jenis kebiasaan terlebih dahulu.</p>`;
    
    // Reload data tabel
    loadRiwayatSiswa();
  } catch (err) {
    alert("Gagal menyimpan data: " + err.message);
  }
}
