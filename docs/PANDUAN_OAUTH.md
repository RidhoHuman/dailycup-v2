# 🔐 Panduan Konfigurasi OAuth - DailyCup v2

Panduan lengkap untuk mengatur OAuth Login dengan Google dan Facebook di aplikasi DailyCup v2.

---

## 📋 Daftar Isi
- [Pengenalan OAuth](#pengenalan-oauth)
- [Google OAuth Setup](#google-oauth-setup)
- [Facebook OAuth Setup](#facebook-oauth-setup)
- [Konfigurasi di Aplikasi](#konfigurasi-di-aplikasi)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Pengenalan OAuth

OAuth 2.0 adalah protokol authorization yang memungkinkan user untuk login menggunakan akun Google atau Facebook mereka tanpa perlu membuat akun baru di aplikasi kita. Ini meningkatkan user experience dan keamanan.

**Manfaat OAuth:**
- ✅ User tidak perlu mengingat password baru
- ✅ Proses registrasi lebih cepat
- ✅ Keamanan lebih baik (ditangani oleh Google/Facebook)
- ✅ Mendapatkan informasi profil user dengan mudah

---

## 🔵 Google OAuth Setup

### Langkah 1: Buat Project di Google Cloud Console

1. **Buka Google Cloud Console**
   - Kunjungi: https://console.cloud.google.com/
   - Login dengan akun Google Anda

2. **Buat Project Baru**
   - Klik dropdown "Select a project" di bagian atas
   - Klik "New Project"
   - Masukkan nama project: `DailyCup`
   - Klik "Create"

### Langkah 2: Enable Google+ API

1. **Navigate ke API Library**
   - Di sidebar kiri, pilih "APIs & Services" > "Library"
   
2. **Enable Google+ API**
   - Cari "Google+ API" di search bar
   - Klik pada "Google+ API"
   - Klik tombol "Enable"

### Langkah 3: Configure OAuth Consent Screen

1. **Buka OAuth Consent Screen**
   - Di sidebar kiri, pilih "OAuth consent screen"

2. **Pilih User Type**
   - Pilih "External" (untuk testing)
   - Klik "Create"

3. **Isi App Information**
   ```
   App name: DailyCup
   User support email: [email Anda]
   Developer contact: [email Anda]
   ```
   
4. **Tambahkan Scopes**
   - Klik "Add or Remove Scopes"
   - Pilih:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Klik "Update"

5. **Tambahkan Test Users** (untuk development)
   - Masukkan email yang akan digunakan untuk testing
   - Klik "Add"

6. **Klik "Save and Continue"** hingga selesai

### Langkah 4: Buat OAuth Client ID

1. **Navigate ke Credentials**
   - Di sidebar kiri, pilih "Credentials"
   - Klik "Create Credentials" > "OAuth client ID"

2. **Configure OAuth Client**
   ```
   Application type: Web application
   Name: DailyCup Web Client
   ```

3. **Authorized JavaScript origins**
   ```
   http://localhost:5500
   http://localhost:3000
   ```

4. **Authorized redirect URIs**
   ```
   http://localhost:3000/api/auth/google/callback
   ```

5. **Klik "Create"**

6. **Salin Credentials**
   - Copy **Client ID** dan **Client Secret**
   - Simpan di tempat aman

### Langkah 5: Tambahkan ke .env File

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## 🔵 Facebook OAuth Setup

### Langkah 1: Buat Facebook App

1. **Buka Facebook Developers**
   - Kunjungi: https://developers.facebook.com/
   - Login dengan akun Facebook Anda

2. **Buat App Baru**
   - Klik "My Apps" di pojok kanan atas
   - Klik "Create App"
   
3. **Pilih App Type**
   - Pilih "Consumer" atau "Business"
   - Klik "Next"

4. **Isi Detail App**
   ```
   App name: DailyCup
   App contact email: [email Anda]
   ```
   - Klik "Create App"

### Langkah 2: Setup Facebook Login

1. **Add Product**
   - Di dashboard app, cari "Facebook Login"
   - Klik "Set Up"
   
2. **Pilih Platform**
   - Pilih "Web"
   - Skip quick setup (klik "Next" terus)

### Langkah 3: Configure Facebook Login Settings

1. **Navigate ke Facebook Login Settings**
   - Di sidebar kiri, expand "Facebook Login"
   - Klik "Settings"

2. **Configure OAuth Settings**
   
   **Valid OAuth Redirect URIs:**
   ```
   http://localhost:3000/api/auth/facebook/callback
   ```

3. **Klik "Save Changes"**

### Langkah 4: Get App Credentials

1. **Navigate ke Settings > Basic**
   - Di sidebar kiri, klik "Settings" > "Basic"

2. **Copy Credentials**
   - Copy **App ID**
   - Klik "Show" untuk melihat **App Secret**
   - Copy **App Secret**

### Langkah 5: Set App Domain (Penting!)

1. **Di Basic Settings**
   ```
   App Domains: localhost
   ```

2. **Privacy Policy URL** (untuk production)
   ```
   http://localhost:5500/privacy-policy.html
   ```

3. **Terms of Service URL** (untuk production)
   ```
   http://localhost:5500/terms-of-service.html
   ```

4. **Klik "Save Changes"**

### Langkah 6: Switch ke Live Mode

1. **Di bagian atas dashboard**
   - Toggle switch dari "Development" ke "Live"
   - Confirm perubahan

### Langkah 7: Tambahkan ke .env File

```env
# Facebook OAuth
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback
```

---

## ⚙️ Konfigurasi di Aplikasi

### 1. Pastikan .env File Lengkap

File `.env` Anda harus berisi:

```env
# Server
PORT=3000
FRONTEND_URL=http://localhost:5500

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=dailycup2_db

# JWT
JWT_SECRET=dailycup_jwt_secret_key_2024
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/auth/facebook/callback
```

### 2. Restart Backend Server

```bash
cd backend
npm start
```

### 3. Verifikasi Konfigurasi

Pastikan server menampilkan:
```
✅ Database connected successfully
📁 Upload directories ready
🚀 Server is running on port 3000
```

---

## 🧪 Testing

### Test Google OAuth

1. **Buka Frontend**
   - Navigate ke: http://localhost:5500/frontend/pages/auth/login.html

2. **Klik "Login with Google"**
   - Anda akan diredirect ke Google consent screen
   - Pilih akun Google
   - Allow permissions
   - Akan diredirect kembali ke aplikasi dengan token

3. **Verifikasi Login Berhasil**
   - User seharusnya sudah login
   - Token tersimpan di localStorage
   - Diredirect ke halaman menu

### Test Facebook OAuth

1. **Buka Frontend**
   - Navigate ke: http://localhost:5500/frontend/pages/auth/login.html

2. **Klik "Login with Facebook"**
   - Anda akan diredirect ke Facebook consent screen
   - Login dengan Facebook
   - Allow permissions
   - Akan diredirect kembali ke aplikasi dengan token

3. **Verifikasi Login Berhasil**
   - User seharusnya sudah login
   - Token tersimpan di localStorage
   - Diredirect ke halaman menu

---

## 🔧 Troubleshooting

### Error: redirect_uri_mismatch

**Penyebab:** Redirect URI tidak cocok dengan yang terdaftar

**Solusi:**
1. Pastikan redirect URI di Google/Facebook Console **PERSIS SAMA** dengan di `.env`
2. Tidak boleh ada trailing slash (/)
3. Harus http (bukan https) untuk localhost

### Error: invalid_client

**Penyebab:** Client ID atau Secret salah

**Solusi:**
1. Double check Client ID dan Secret di `.env`
2. Pastikan tidak ada spasi di awal/akhir
3. Pastikan copy-paste dengan benar

### Google: Access blocked: This app's request is invalid

**Penyebab:** OAuth consent screen belum selesai dikonfigurasi

**Solusi:**
1. Lengkapi OAuth consent screen di Google Cloud Console
2. Tambahkan email Anda sebagai test user
3. Pastikan scopes sudah ditambahkan

### Facebook: App Not Setup

**Penyebab:** Facebook Login belum dikonfigurasi

**Solusi:**
1. Pastikan Facebook Login sudah di-setup di dashboard
2. Pastikan Valid OAuth Redirect URIs sudah diisi
3. Toggle app ke "Live" mode

### User data tidak tersimpan

**Penyebab:** Database connection issue atau table tidak ada

**Solusi:**
1. Cek database connection
2. Pastikan table `users` sudah ada
3. Check backend console untuk error messages

---

## 📝 Catatan Penting

### Untuk Production:

1. **Update Redirect URIs** dengan domain production Anda
   ```
   https://dailycup.com/api/auth/google/callback
   https://dailycup.com/api/auth/facebook/callback
   ```

2. **Enable HTTPS** - OAuth mengharuskan HTTPS untuk production

3. **Update App Domains** di Facebook ke domain production

4. **Verify Domain** di Google Cloud Console

5. **Complete OAuth Consent Screen** untuk public access

6. **Set Privacy Policy & Terms** - Wajib untuk Facebook production

---

## 🔗 Link Referensi

### Google OAuth
- Console: https://console.cloud.google.com/
- Documentation: https://developers.google.com/identity/protocols/oauth2

### Facebook OAuth
- Developer Portal: https://developers.facebook.com/
- Documentation: https://developers.facebook.com/docs/facebook-login/

---

## 💡 Tips

1. **Gunakan Test Accounts** saat development untuk menghindari rate limits

2. **Save Credentials Securely** - Jangan commit `.env` file ke Git

3. **Use Environment Variables** - Jangan hardcode credentials di code

4. **Monitor Usage** - Check quota usage di Google/Facebook console

5. **Keep Dependencies Updated** - Update libraries secara berkala untuk security

---

## ✅ Checklist Setup OAuth

- [ ] Google Cloud Project dibuat
- [ ] Google+ API enabled
- [ ] OAuth Consent Screen dikonfigurasi
- [ ] Google Client ID & Secret didapat
- [ ] Facebook App dibuat
- [ ] Facebook Login di-setup
- [ ] Facebook App ID & Secret didapat
- [ ] Redirect URIs dikonfigurasi di Google & Facebook
- [ ] Credentials ditambahkan ke .env file
- [ ] Backend server restart
- [ ] Testing Google OAuth berhasil
- [ ] Testing Facebook OAuth berhasil

---

<div align="center">
  <p><strong>Selamat! OAuth sudah terkonfigurasi ☕</strong></p>
  <p>Jika ada pertanyaan, buat issue di GitHub repository</p>
</div>
