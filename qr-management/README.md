# Advanced QR Code Management System Backend

A robust, enterprise-grade, and strictly typed Next.js 16 Web API backend for creating, managing, tracking, and dynamically distributing stylized QR codes across printable layout matrices. Built following strict software engineering principles, optimized database lookup configurations, and 100% compliant with TypeScript strict mode parameters.

---

## 🛠️ Architecture & Technology Choices

### 1. Next.js 16 (App Router) & Type Safety
* **Reasoning**: Next.js App Router route handlers were selected to establish an asynchronous RESTful JSON processing layer. 
* **Strict TypeScript Compliance**: Explicit `any` type casting has been thoroughly eliminated from the engine. The system relies entirely on strict interface declarations, web standard payloads (`Uint8Array`), and structural type assertions (`unknown`) inside execution catch boundaries to satisfy advanced project compilation filters.

### 2. MongoDB & Mongoose Modeling
* **Optimization**: The schema utilizes a flat design architecture to speed up data pipelines. To handle intense scan query loads, the unique `12-character alphanumeric uppercase tracking tokens` are indexed (`index: true`) and normalized, reducing index traversal times.
* **Scan Audits**: Real-time traffic metadata analytics are appended seamlessly into an embedded atomic log schema tracking accurate timestamps, IP headers, and client User-Agent identifiers.

### 3. Native QR Engine & Multi-Page Layout Printing (PDFKit)
* **Image Processing**: Generates raw tracking buffers securely using cryptographic library components.
* **Infinite Page Breakouts**: Built with a custom geometric grid layout script leveraging `pdfkit`. If an incoming matrix payload exceeds the page limitations defined by column and row multiplication steps, the application seamlessly splits the grid markers, initializes subsequent pages, and returns a multi-page print document streaming directly to client requests.

---

## 🚀 Getting Started & Installation

### 1. Clone the project and install standard dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create an `.env.local` file in the project root folder and specify your connection keys:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/qr_db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server or Production Compilation
```bash
# Run local dev instance
npm run dev

# Run strict production compilation build check
npm run build
```

---

## 📡 Core RESTful API Endpoint Matrix

All endpoint error structures strictly conform to standard system criteria payloads containing: `{ error: true, code: string, message: string, statusCode: number }`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/qr/generate` | Accepts target destinations and builds a unique, colorized QR asset saved to disk. |
| **GET** | `/api/qr` | Fetches a paginated, sorted list of all active QR records with substring label search filters. |
| **GET** | `/api/qr/:uniqueCode` | Obtains full structural parameters and configuration specs for a single token. |
| **DELETE**| `/api/qr/:uniqueCode` | Soft-deletes a record by toggling its active visibility state to `false`. |
| **PATCH** | `/api/qr/:uniqueCode/reactivate` | Re-enables code scanning visibility, bringing a deactivated token back online. |
| **GET** | `/api/qr/:uniqueCode/scan-logs` | Retrieves a chronological, paginated array breakdown of a token's scan metadata history. |
| **POST** | `/api/qr/print-layout` | Takes an array of codes and streams a custom-aligned, multi-page print PDF. |
| **POST** | `/api/qr/upload-logo` | Multi-part form handler that verifies and saves custom image branding assets. |
| **GET** | `/verify/:uniqueCode` | Dual-response entry route. Streams an elegant HTML meta redirect tracker page to browsers, or a secure verification JSON string to programmatic API clients. |

---

## 📐 Input Specifications & Validation

* **Tracking Identity Tokens**: Exactly 12 alphanumeric characters, uppercase, collision-safe, using a clean legibility character distribution array (excluding confusing symbols like `0, O, 1, I`).
* **URL Destinations**: Validated securely against maximum input thresholds of **2048 characters**.
* **Color Handling**: Hexadecimal validation enforces the exact styling specification pattern ruleset: `^#([A-Fa-f0-9]{6})$` (supporting transparent layers).
