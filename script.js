// Oturum kontrolü: giriş yapılmamışsa login sayfasına yönlendir
if (sessionStorage.getItem("oturumAcildi") !== "evet") {
    window.location.href = "login.html";
}

// Giriş yapan kullanıcıyı üst barda karşılama
const girisYapanKullanici = sessionStorage.getItem("kullaniciAdi");
const selamEtiketi = document.getElementById("kullaniciSelam");
if (selamEtiketi && girisYapanKullanici) {
    selamEtiketi.textContent = "Hoş geldin, " + girisYapanKullanici + " 👋";
}

// Çıkış yapma
function cikisYap() {
    sessionStorage.removeItem("oturumAcildi");
    sessionStorage.removeItem("kullaniciAdi");
    window.location.href = "login.html";
}

//veritabanı
let arizalar = JSON.parse(localStorage.getItem("arizaKayitlari")) || [];

// Bekleyen tablosu için arama metni
let aramaMetni = "";

const form = document.getElementById('arizaform');

form.addEventListener('submit', function(olay) {
    olay.preventDefault(); // Sayfa yenilenmesini engelle

    // Form verilerini al
    const musteriAd = document.getElementById('musteriad').value;
    const musteriTel = document.getElementById('musteritel').value;
    const cihazMdl = document.getElementById('cihazmdl').value;
    const seriNo = document.getElementById('serino').value;
    const sikayet = document.getElementById('sikayet').value;

    const tarih = new Date().toLocaleDateString('tr-TR');

    // Yeni kayıt nesnesi
    const yeniAriza = {
        id: Date.now(), // Eşsiz kimlik (Milisaniye cinsinden o anki zaman)
        ad: musteriAd,
        tel: musteriTel,
        cihaz: cihazMdl,
        seri: seriNo,
        hata: sikayet,
        gelisTarihi: tarih,
        gidisTarihi: "-", // Başlangıçta gidiş tarihi yok
        durum: 'bekliyor'
    };

    // Diziye ekle ve LocalStorage'ı güncelle
    arizalar.push(yeniAriza);
    localStorage.setItem("arizaKayitlari", JSON.stringify(arizalar));

    // Formu temizle ve tabloyu güncelle
    form.reset();
    tablolariGuncelle();
    bildirimGoster("Cihaz kaydedildi ✅", "basarili");
});

// --- TELEFON NUMARASINI YAZARKEN OTOMATİK BİÇİMLENDİR ---
const telefonInput = document.getElementById('musteritel');
telefonInput.addEventListener('input', function() {
    const rakamlar = telefonInput.value.replace(/\D/g, '').slice(0, 11);
    let bicimli = rakamlar;
    if (rakamlar.length > 4)  bicimli = rakamlar.slice(0, 4) + ' ' + rakamlar.slice(4);
    if (rakamlar.length > 7)  bicimli = rakamlar.slice(0, 4) + ' ' + rakamlar.slice(4, 7) + ' ' + rakamlar.slice(7);
    if (rakamlar.length > 9)  bicimli = rakamlar.slice(0, 4) + ' ' + rakamlar.slice(4, 7) + ' ' + rakamlar.slice(7, 9) + ' ' + rakamlar.slice(9);
    telefonInput.value = bicimli;
});

// --- BEKLEYEN İŞLERDE ARAMA ---
const aramaKutusu = document.getElementById('aramaKutusu');
if (aramaKutusu) {
    aramaKutusu.addEventListener('input', function() {
        aramaMetni = aramaKutusu.value.toLocaleLowerCase('tr-TR');
        tablolariGuncelle();
    });
}

// --- 2. TABLOLARI EKRANA BASMA ---
function tablolariGuncelle() {
    const aktifTablo = document.getElementById('aktifTablo');
    const arsivTablo = document.getElementById('arsivTablo');

    // Önce tabloları temizle
    aktifTablo.innerHTML = '';
    arsivTablo.innerHTML = '';

    const bekleyenler = arizalar.filter(a => a.durum === 'bekliyor');
    const teslimEdilenler = arizalar.filter(a => a.durum === 'teslim_edildi');

    // Arama kutusuna göre bekleyenleri filtrele
    const gosterilecekler = bekleyenler.filter(function(ariza) {
        if (!aramaMetni) return true;
        const metin = (ariza.ad + ' ' + ariza.cihaz + ' ' + ariza.seri).toLocaleLowerCase('tr-TR');
        return metin.includes(aramaMetni);
    });

    if (gosterilecekler.length === 0) {
        aktifTablo.innerHTML = `
            <tr><td colspan="5">
                <div class="bos-durum">
                    <span class="bos-ikon">${aramaMetni ? '🔍' : '🎉'}</span>
                    <p>${aramaMetni ? 'Aramanızla eşleşen cihaz bulunamadı.' : 'Atölyede bekleyen cihaz yok. Yeni bir kayıt ekleyerek başlayın.'}</p>
                </div>
            </td></tr>`;
    } else {
        gosterilecekler.forEach(function(ariza) {
            aktifTablo.innerHTML += `
                <tr>
                    <td>${ariza.ad} <br> <small style="color: rgba(13,30,84,.6);">${ariza.tel}</small></td>
                    <td>${ariza.cihaz} <br> <small style="color: rgba(13,30,84,.6);">Şikayet: ${ariza.hata}</small></td>
                    <td class="mono">${ariza.seri}</td>
                    <td>${ariza.gelisTarihi}<br><span class="badge badge-bekliyor">Bekliyor</span></td>
                    <td>
                        <button onclick="teslimEt(${ariza.id})" class="btn-teslim">Teslim</button>
                        <button onclick="kaydiSil(${ariza.id})" class="btn-sil">Sil</button>
                    </td>
                </tr>
            `;
        });
    }

    if (teslimEdilenler.length === 0) {
        arsivTablo.innerHTML = `
            <tr><td colspan="4">
                <div class="bos-durum">
                    <span class="bos-ikon">📦</span>
                    <p>Henüz teslim edilen cihaz yok.</p>
                </div>
            </td></tr>`;
    } else {
        teslimEdilenler.forEach(function(ariza) {
            arsivTablo.innerHTML += `
                <tr>
                    <td>${ariza.ad}</td>
                    <td>${ariza.cihaz}</td>
                    <td>${ariza.gelisTarihi}</td>
                    <td>${ariza.gidisTarihi}<br><span class="badge badge-tamam">Teslim Edildi</span></td>
                </tr>
            `;
        });
    }

    istatistikleriGuncelle(bekleyenler.length, teslimEdilenler.length);
}

// --- İSTATİSTİK ŞERİDİNİ GÜNCELLE ---
function istatistikleriGuncelle(bekleyenSayisi, teslimSayisi) {
    const bugun = new Date().toLocaleDateString('tr-TR');
    const bugunGelenSayisi = arizalar.filter(a => a.gelisTarihi === bugun).length;

    document.getElementById('statToplam').textContent = arizalar.length;
    document.getElementById('statBekleyen').textContent = bekleyenSayisi;
    document.getElementById('statTeslim').textContent = teslimSayisi;
    document.getElementById('statBugun').textContent = bugunGelenSayisi;

    document.getElementById('bekleyenSayac').textContent = '(' + bekleyenSayisi + ')';
    document.getElementById('teslimSayac').textContent = '(' + teslimSayisi + ')';
}

// --- 3. CİHAZ TESLİM ETME ---
function teslimEt(id) {
    // Tıklanan cihazı id'sinden bul
    const cihazIndex = arizalar.findIndex(a => a.id === id);

    if (cihazIndex !== -1) {
        // Durumunu değiştir ve çıkış tarihini ekle
        arizalar[cihazIndex].durum = 'teslim_edildi';
        arizalar[cihazIndex].gidisTarihi = new Date().toLocaleDateString('tr-TR');

        // LocalStorage'ı güncelle ve tabloları yeniden çiz
        localStorage.setItem("arizaKayitlari", JSON.stringify(arizalar));
        tablolariGuncelle();
        bildirimGoster("Cihaz teslim edildi 🎉", "basarili");
    }
}

// --- 4. KAYIT SİLME ---
function kaydiSil(id) {
    // Yanlışlıkla silmelere karşı bir uyarı çıkar
    if (confirm("Bu kaydı tamamen silmek istediğine emin misin?")) {
        // İlgili id'ye sahip olmayanları filtrele (seçili id'yi at)
        arizalar = arizalar.filter(a => a.id !== id);

        // LocalStorage'ı güncelle ve tabloları yeniden çiz
        localStorage.setItem("arizaKayitlari", JSON.stringify(arizalar));
        tablolariGuncelle();
        bildirimGoster("Kayıt silindi 🗑️", "silindi");
    }
}

// --- 5. ARŞİVİ CSV OLARAK DIŞA AKTARMA ---
function csvDisaAktar() {
    const teslimEdilenler = arizalar.filter(a => a.durum === 'teslim_edildi');

    if (teslimEdilenler.length === 0) {
        bildirimGoster("Dışa aktarılacak teslim edilmiş cihaz yok.", "silindi");
        return;
    }

    let csv = "\ufeffMüşteri;Cihaz;Seri No;Geliş Tarihi;Gidiş Tarihi;Şikayet\n";
    teslimEdilenler.forEach(function(a) {
        csv += [a.ad, a.cihaz, a.seri, a.gelisTarihi, a.gidisTarihi, a.hata].join(';') + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'teslim_edilenler.csv';
    link.click();

    bildirimGoster("CSV dosyası indirildi 📤", "basarili");
}

// --- 6. BİLDİRİM (TOAST) GÖSTERME ---
function bildirimGoster(mesaj, tur) {
    const kutu = document.getElementById('toastKutu');
    if (!kutu) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + (tur || '');
    toast.textContent = mesaj;
    kutu.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('cikiyor');
        setTimeout(function() { toast.remove(); }, 250);
    }, 2800);
}

// Sayfa ilk yüklendiğinde tablolardaki verileri çek ve doldur
tablolariGuncelle();
