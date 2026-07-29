// Nama Kebiasaan Map
const NAMA_KEBIASAAN = {
  1: "1. Bangun Pagi",
  2: "2. Beribadah",
  3: "3. Berolahraga",
  4: "4. Makan Makanan Sehat",
  5: "5. Gemar Membaca",
  6: "6. Bermasyarakat",
  7: "7. Tidur Cepat"
};

// Event listener form tambah jurnal
document.getElementById("formTambahJurnal").addEventListener("submit", simpanJurnalSiswa);

// Set tanggal default ke hari ini
document.getElementById("jurnalTanggal").value = todayStr;

// Menampilkan Dashboard Siswa
function renderDashboardSiswa() {
  document.getElementById("sidebarSiswaNama").textContent = currentUser.nama;
  document.getElementById("sidebarSiswaKelas").textContent = `Kelas ${currentUser.kelas || '-'}`;
  document.getElementById("headerSiswaNama").textContent = `${currentUser.nama} (SISWA)`;
  
  loadRiwayatSiswa();
}

// Memuat Tabel Riwayat
async function loadRiwayatSiswa() {
  const sId = currentUser.id || currentUser.username;
  const tbody = document.getElementById("tabelRiwayatKebiasaan");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-3">Memuat riwayat...</td></tr>`;

  try {
    const q = query(collection(db, "log_kebiasaan"), where("siswa_id", "==", sId));
    const snapshot = await getDocs(q);

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
      if (d.kebiasaan_id == 1 || d.kebiasaan_id == 7) rincian = `Pukul: ${d.jam || '-'}`;
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
      else if (d.kebiasaan_id == 3) rincian = `Olahraga: ${d.jenis_olahraga || '-'}`;
      else if (d.kebiasaan_id == 4) rincian = `Menu: ${d.menu || '-'}`;
      else if (d.kebiasaan_id == 5) rincian = `Judul: ${d.judul || '-'} (${d.ringkasan || ''})`;
      else if (d.kebiasaan_id == 6) rincian = `Kegiatan: ${d.kegiatan || '-'}`;

      tbody.innerHTML += `
        <tr>
          <td>${no++}</td>
          <td>${d.tanggal}</td>
          <td><span class="fw-bold">${NAMA_KEBIASAAN[d.kebiasaan_id] || d.kebiasaan_id}</span></td>
          <td>${rincian}</td>
          <td><span class="badge bg-success">Terlaksana</span></td>
        </tr>
      `;
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

// Render Input Dinamis di Modal
window.toggleFormDetail = function(val) {
  const container = document.getElementById("fieldDetailJurnal");
  val = parseInt(val);

  if (val === 1 || val === 7) {
    container.innerHTML = `
      <label class="form-label small fw-bold">Jam Jam Berapa?</label>
      <input type="time" id="valJam" class="form-control form-control-sm" value="${val === 1 ? '05:00' : '21:00'}" required>
    `;
  } else if (val === 2) {
    container.innerHTML = `
      <label class="form-label small fw-bold mb-2">Ceklis Sholat yang Dilaksanakan:</label>
      <div class="d-flex flex-wrap gap-2">
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
    bootstrap.Modal.getInstance(document.getElementById("modalTambahJurnal")).hide();
    document.getElementById("formTambahJurnal").reset();
    document.getElementById("fieldDetailJurnal").innerHTML = `<p class="text-muted small mb-0">Silahkan pilih jenis kebiasaan terlebih dahulu.</p>`;
    loadRiwayatSiswa();
  } catch (err) {
    alert("Gagal menyimpan data: " + err.message);
  }
}
