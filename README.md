# 🚀 Task Manager (Full Stack)

A full-stack **Task Management Web Application** where users can create projects, assign tasks, and track progress with role-based access control.

---

## ✨ Features

* 🔐 Authentication (Signup / Login with JWT)
* 👥 Role-based access (Admin, Manager, Member)
* 📁 Project creation & team management
* ✅ Task creation, assignment & status tracking
* 📊 Dashboard with task statistics
* 🔔 Notifications (Approaching deadlines & overdue tasks)
* 📎 File attachments for tasks

---

## 🛠 Tech Stack

**Frontend**

* React + TypeScript
* Vite
* Tailwind CSS

**Backend**

* Node.js + Express
* Prisma ORM
* SQLite (for development)

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/bs8952521-tech/taskmanager.git
cd taskmanager
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Setup environment variables

Create a `.env` file:

```env
JWT_SECRET=your_secret_key
```

---

### 4️⃣ Setup database

```bash
npx prisma migrate dev
npx prisma generate
```

---

### 5️⃣ Run the app

```bash
npm run dev
```

App will run on:
👉 http://localhost:3000

---

## 📸 Screenshots

<img width="1879" height="883" alt="Screenshot 2026-05-01 155025" src="https://github.com/user-attachments/assets/e9bf482b-50a3-43e4-98d1-f7d33d790320" />


---

## 🚀 Deployment

You can deploy this project using:

* Railway

---

## 👨‍💻 Author

**Brijesh Shah**
