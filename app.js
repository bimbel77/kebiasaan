// LOGIN SYSTEM (Diperbarui agar id dokumen Firestore selalu terbawa)
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
        // Menyimpan ID dokumen Firestore ke dalam objek currentUser
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

// TAMBAH SISWA (Diperbarui agar langsung mendapatkan ID dokumen baru)
async function tambahSiswa(e) {
  e.preventDefault();
  const nisn = document.getElementById("siswaNisn").value.trim();
  const nama = document.getElementById("siswaNama").value.trim();
  const kelas = currentUser.role === "guru" ? currentUser.kelas : document.getElementById("siswaKelas").value.trim();

  try {
    await addDoc(collection(db, "users"), {
      nama: nama,
      nisn: nisn,
      username: nisn,
      password: nisn,
      kelas: kelas,
      role: "siswa"
    });
    
    bootstrap.Modal.getInstance(document.getElementById("modalTambahSiswa")).hide();
    document.getElementById("formTambahSiswa").reset();
    
    alert("Data siswa berhasil ditambahkan!");
    if(currentUser.role === "guru") loadSiswaGuru();
    else loadSiswaAdmin();
  } catch (err) {
    alert("Gagal menambah siswa: " + err.message);
  }
}
