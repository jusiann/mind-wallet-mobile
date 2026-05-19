# Mind Wallet

Mind Wallet, BTK Akademi Hackathon 2026 için geliştirilmiş yapay zeka destekli otonom finansal karar ve alışkanlık motorudur. Klasik gelir-gider takip uygulamalarından farklı olarak, kullanıcının harcamalarını analiz eder, tasarruf fırsatları sunar ve bütçeyi koruyan önleyici (guardrail) bir AI sistemine sahiptir.

## 🇹🇷 Türkçe Dokümantasyon

### Öne Çıkan Özellikler

- **Mindy AI Hub**: Gemini 3 Flash ve LangGraph mimarisi ile çalışan 3 uzman ajan (Analiz, Hedef ve Fren).
- **Otonom Tasarruf (Savings Pledges)**: Bulunan tasarruf fırsatlarını hemen aktarmak yerine dinamik bir "söz verme" mekanizması ile ay sonu doğrulamasına tabi tutar.
- **Gerçek Zamanlı Guardrail**: Yeni harcama girilirken zorunlu olmayan kategorilerde hedefleri tehdit edecek durumlara anında müdahale eder.
- **Güvenli Yetkilendirme (Auth & Şifre Sıfırlama)**: Kullanıcı güvenliği için JWT tabanlı oturum yönetimi ve SMTP tabanlı (şifre sıfırlama kodları içeren) güvenli e-posta bildirimleri.
- **Doğal Dil ile İşlem**: "Markette 150 TL harcadım" gibi metinlerle otomatik kategorizasyon ve işlem kaydı yapabilme.
- **Veri Görselleştirme**: Harcamaların kategori bazlı pasta ve çubuk grafiklerle izlenebilmesi.
- **Dışa Aktarım (Export)**: Tüm finansal geçmişin ve yapay zeka analizlerinin `.xlsx` (Excel) formatında indirilebilmesi.

### Teknoloji Yığını (Tech Stack)

**Mobil (Frontend)**
- React Native (Expo)
- TypeScript

**Sunucu (Backend)**
- Node.js & Express.js
- PostgreSQL (pg)
- LangGraph (AI Orchestration)
- Gemini API (Gemini 3 Flash)
- JWT & Nodemailer (Auth & SMTP)

### Kurulum ve Çalıştırma (Local Development)

Projeyi yerel ortamınızda ayağa kaldırmak için aşağıdaki adımları izleyebilirsiniz.

#### 1. Veritabanı Kurulumu
Bilgisayarınızda PostgreSQL'in çalıştığından emin olun ve projeye özel boş bir veritabanı oluşturun.
Tablolar ve schema yapısı, sunucu (backend) ilk kez başlatıldığında otomatik olarak oluşturulacaktır.

#### 2. Backend (Sunucu)
```bash
cd server
npm install
```
Daha sonra `.env.example` dosyasını `.env` olarak kopyalayın ve içerisindeki Veritabanı, Gemini API Anahtarı, JWT secret anahtarları ve **SMTP E-posta** ayarlarınızı (şifre sıfırlama işlemleri için) doldurun:
```bash
cp .env.example .env
```
Sunucuyu başlatın:
```bash
npm run dev
```

#### 3. Frontend (Mobil Uygulama)
```bash
cd client
npm install
```
Daha sonra `.env.example` dosyasını `.env` olarak kopyalayın ve backend adresinizi kontrol edin:
```bash
cp .env.example .env
```
Uygulamayı başlatın:
```bash
npx expo start
```

### Mimari & Geliştirici Notları

- **Sıfır Halüsinasyon (Zero Hallucination)**: Yapay zekanın yanlış bütçe hesaplaması yapmasını engellemek için tüm ay/ay karşılaştırmaları, delta hesaplamaları ve bütçe mantıkları deterministik (Node.js) kodlanmıştır. LLM (Gemini) sadece önceden hesaplanan bu kesin verileri baz alarak doğal dil metinleri üretir ve kullanıcı niyetini sınıflandırır (intent classification).
- **Agent Akışı (LangGraph)**: Sistem `ClassifierNode` -> `ExtractorNode` -> `GuardrailNode` -> `AnalysisNode` -> `RoutingNode` -> `ResponderNode` sırasıyla çalışır. Ajanlar arası durum (state) aktarımı LangGraph kullanılarak izole edilmiştir.

---

## 🇺🇸 English Documentation

Mind Wallet is an AI-powered autonomous financial decision and habit engine, built for the BTK Akademi Hackathon 2026. Unlike traditional expense trackers, it analyzes user spending, uncovers savings opportunities, and features a protective AI guardrail system to safeguard the budget.

### Key Features

- **Mindy AI Hub**: 3 specialized agents (Analysis, Goal, and Guardrail) powered by Gemini 3 Flash and orchestrated with LangGraph.
- **Autonomous Savings (Savings Pledges)**: Instead of immediately transferring detected savings, it establishes a dynamic "pledge" mechanism subject to end-of-month verification.
- **Real-time Guardrail**: Intervenes immediately when a new non-essential expense is entered that threatens active financial goals.
- **Secure Authentication & Password Reset**: Robust JWT-based session management integrated with SMTP email notifications for secure password reset flows.
- **Natural Language Processing**: Automatically categorizes and logs transactions from simple text like "I spent 150 TL at the grocery store."
- **Data Visualization**: Monitor expenses through category-based pie and bar charts.
- **Export Capabilities**: Download the entire financial history and AI analysis reports in `.xlsx` (Excel) format.

### Tech Stack

**Mobile (Frontend)**
- React Native (Expo)
- TypeScript

**Server (Backend)**
- Node.js & Express.js
- PostgreSQL (pg)
- LangGraph (AI Orchestration)
- Gemini API (Gemini 3 Flash)
- JWT & Nodemailer (Auth & SMTP)

### Local Development

Follow these steps to run the project locally.

#### 1. Database Setup
Ensure PostgreSQL is running on your machine and create a new empty database for the project.
Tables and schemas will be automatically generated upon the first initialization of the backend server.

#### 2. Backend (Server)
```bash
cd server
npm install
```
Next, copy the `.env.example` file to `.env` and fill in your Database, Gemini API Key, JWT secrets, and **SMTP Email** credentials (required for password reset flows):
```bash
cp .env.example .env
```
Start the server:
```bash
npm run dev
```

#### 3. Frontend (Mobile App)
```bash
cd client
npm install
```
Next, copy the `.env.example` file to `.env` and verify your backend API URL:
```bash
cp .env.example .env
```
Start the application:
```bash
npx expo start
```

### Architecture & Developer Notes

- **Zero Hallucination**: To prevent the AI from making incorrect budget calculations, all month-over-month comparisons, delta calculations, and budget logic are deterministically coded in Node.js. The LLM (Gemini) strictly relies on these pre-calculated, absolute numbers to generate natural language text and perform intent classification.
- **Agent Flow (LangGraph)**: The system executes in sequence: `ClassifierNode` -> `ExtractorNode` -> `GuardrailNode` -> `AnalysisNode` -> `RoutingNode` -> `ResponderNode`. State transmission between agents is securely isolated using LangGraph.
