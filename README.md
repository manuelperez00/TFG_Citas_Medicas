# ⚙️ AutoCita — Guía de ejecución (Backend + Frontend)

Este proyecto está dividido en dos módulos independientes:

- 📂**autocita-backend** → API REST desarrollada con **Spring Boot**
- 📂**autocita-frontend** → Aplicación web desarrollada con **React**

A continuación se explica cómo ejecutar cada parte, cómo detenerla y cómo navegar entre carpetas.

---

## 🟦 1. Requisitos previos

### ✔️ Backend (Spring Boot)
- Java 17 o superior  
- Maven instalado

### ✔️ Frontend (React)
- Node.js (versión recomendada: 18+)  
- npm (incluido con Node)

---

## 🟩 2. Cómo ejecutar el BACKEND

### 📌 1. Entrar en la carpeta del backend
```bash
cd autocita-backend
```

### 📌 2. Ejecutar el backend
```bash
mvn spring-boot:run
```

### 📌 3. El backend se iniciará en
```bash
http://localhost:8080
```

### 📌 4. Detener el backend
```bash
CTRL + C
```

---

## 🟩 3. Cómo ejecutar el FRONTEND
### 📌 1. Entrar en la carpeta del frontend
```bash
cd autocita-frontend
```

### 📌 2. Instalar dependencias (solo la primera vez)
```bash
npm install
```

### 📌 3. Ejecutar el frontend
```bash
npm start
```

### 📌 4. El frontend se iniciará en
```bash
http://localhost:3000
```

### 📌 5. Detener el frontend
```bash
CTRL + C
```
