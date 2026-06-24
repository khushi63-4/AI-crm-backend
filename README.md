# AI Sales CRM - Comprehensive Documentation

Welcome to the **AI Sales CRM** project documentation! This guide details the project stack, architecture, core features, setup procedures, and a comprehensive guide for managing the **Facebook Meta Ads Integration**.

---

## 📂 Project Structure & Tech Stack

The CRM is divided into a decoupled backend and frontend structure:

*   **Frontend**: React (Vite), Styled Components (Vanilla CSS), Axios.
*   **Backend**: Node.js, Express, MySQL (mysql2 client), Dotenv, Multer, CSV-Parser.
*   **Database**: MySQL (Table schemas: `leads` and `facebook_configs`).

---

## 🚀 Getting Started

### 1. Database Setup
Ensure you have MySQL installed and running locally, then create a database:
```sql
CREATE DATABASE crm;
```

### 2. Backend Installation & Setup
1. Navigate to the `/backend` folder.
2. Create a `.env` file containing your credentials:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=crm
   JWT_SECRET=your_jwt_secret_key
   FB_VERIFY_TOKEN=your_fallback_verify_token
   ```
3. Install dependencies and start the developer server:
   ```bash
   npm install
   npm run dev
   ```
   *(The database tables `leads` and `facebook_configs` will be created automatically on startup).*

### 3. Frontend Installation & Setup
1. Navigate to the `/frontend` folder.
2. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173/lead-management`.

---

## 📈 Core CRM Features

### 1. Lead Management
*   **Create/Edit/Delete**: Interactive modal actions to manage details (Name, Email, Phone, City, Occupation, Investment Amount, and Status).
*   **Selection & Bulk Management**: Clicking the select-all header checkbox selects all leads visible on the active page, allowing you to select and manage lists in one click.

### 2. Import CSV Files
*   Allows bulk uploads of leads from spreadsheet/CSV data. Automatically parses, maps headers, and bulk inserts them into the database.

### 3. Facebook Meta Lead Ads Integration
We support two synchronization modes:

#### Mode A: On-Demand Manual Sync (Recommended & Built-in)
Pulls leads directly from Meta's API without needing servers, tunnels, or complex setups:
*   **Selectable Timeline Range**: Sync leads from the **Last 24 Hours**, **Last 7 Days**, **Last 30 Days**, or **All Available (90 Days)**.
*   **Auto-Pagination**: Crawls through multiple pages of Meta's API to fetch every lead.
*   **Duplicate Protection**: Before saving a lead, the CRM performs a real-time database query on the phone/email. If the lead is already present, it is skipped.

#### Mode B: Real-Time Webhook Sync (Automated)
Sends leads instantly to your server when a customer submits a form:
*   Uses a webhook callback endpoint (`/api/leads/facebook/webhook`) to listen for Meta events.
*   Requires a public HTTP tunnel (e.g. `ngrok`) and setting up webhooks inside the Meta App Dashboard.

---

## 🔑 Meta Integration Guide & Token Management

To pull leads, you need a **Page ID** and a **Page Access Token**. Because default tokens generated in the Meta Graph API Explorer expire after 1–2 hours, follow this guide to create a **Never-Expiring Page Access Token**.

### 1. How to get your Page ID
1. Go to your Facebook Page.
2. Click **About** -> **Page Transparency**.
3. Copy the numerical **Page ID**.

### 2. How to Generate a Never-Expiring Page Access Token
1. Go to the [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App (`lead-test2`).
3. Add the following scopes/permissions to your token:
   * `pages_show_list`
   * `pages_read_engagement`
   * `leads_retrieval`
   * `pages_manage_ads`
4. Under **User or Page**, select **Get Page Access Token**, approve permissions for your Page, and choose your Page name.
5. Copy the generated Page Access Token (this is a short-lived token).
6. Open the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
7. Paste the short-lived token and click **Debug**.
8. Scroll to the bottom and click **Extend Access Token** (or **Get Long-Lived Token**).
9. Copy this extended token. It is now a **long-lived Page Access Token** which is set to **Never expire**!
10. Paste this token inside your CRM's configuration modal and click **Save**.

### 3. How to Link your Page (Required for Webhook Mode)
If you want to use real-time webhook mode, you must link your Facebook Page to your app:
1. Open [Meta Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your Page Access Token.
3. Choose **POST** method.
4. Path: `/{your-page-id}/subscribed_apps?subscribed_fields=leadgen`
5. Click **Submit**. You will receive `{"success": true}`.
