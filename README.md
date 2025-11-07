# 🛍️ Olymarket: Olydorf Community Marketplace

Olymarket is a dedicated, hyper-local platform designed **exclusively for the residents of Olydorf (Olympic Village, Munich)**.

It provides a simple, safe, and sustainable way for neighbors to **buy, sell, and give away** pre-loved second-hand items right within their own community.

---

## 🎯 Vision and Goal

* **Fostering Community:** Strengthen connections by creating a trusted space for neighbor-to-neighbor exchange.
* **Sustainability:** Promote a circular economy by extending the life of goods and reducing local waste.
* **Convenience:** Eliminate the complexity of dealing with large, impersonal marketplaces by focusing only on Olydorf residents.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **Community Exclusive** | Intended use is for verified Olydorf residents only, ensuring trust and local relevance. |
| **Simple Listings** | Users can easily post items with photos, a description, and their contact preference. |
| **"Give Away" Category** | A dedicated section for residents to offer items for **free**, encouraging generosity and recycling. |
| **Category Filtering** | Browse items efficiently across common categories like Furniture, Electronics, Books, and Clothing. |
| **Direct Communication** | A secure system (e.g., in-app chat or email form) for buyers to contact sellers to arrange pickup and payment. |
| **User Profiles** | Basic profiles to display a user's current listings and past transaction ratings (optional). |

---

## 🛠️ Technology Stack (Proposal)

This is a suggested technology stack for building a modern web application for Olymarket. Feel free to substitute any technologies you prefer!

| Component | Suggested Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React, Vue.js, or Svelte | Provides a fast, modern, and component-based user interface. |
| **Backend & Database** | Node.js (Express) + TypeORM + PostgreSQL | Provides a self-hosted, extensible API with relational data integrity and strong typing. |
| **Styling** | Tailwind CSS or equivalent utility-first CSS framework | Enables rapid, responsive design with minimal custom CSS. |
| **Deployment** | Vercel or Netlify | Simple, continuous deployment for static frontends and serverless functions. |

---

## 🚀 Getting Started (Development Setup)

Follow these steps to get a development environment up and running locally.

### Prerequisites

* Node.js (LTS version)
* A package manager (npm or yarn)
* Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [your-repository-url]
    cd olymarket
    ```
2.  **Start the database:**
    ```bash
    docker compose up -d db
    ```
    A PostgreSQL instance will be available at `localhost:5432` with the credentials defined in `docker-compose.yml`.
3.  **Configure API environment variables:**
    ```bash
    cp api/.env.example api/.env
    ```
    Adjust the values as needed. The defaults match the Docker database service. Ensure you provide a secure value for `API_KEY`,
    which will be required by every request to the backend.
4.  **Install dependencies and run migrations:**
    ```bash
    cd api
    npm install
    npm run migration:run
    ```
5.  **Start the API server:**
    ```bash
    npm run dev
    ```
    The API will listen on `http://localhost:4000`.
    All requests must now include an `x-api-key` header whose value matches the configured `API_KEY`.
6.  **Run the frontend (optional):**
    ```bash
    cd ../frontend
    npm install
    npm run start
    ```
    The frontend development server remains available at `http://localhost:3000`.

---

## 🤝 How to Contribute

We encourage contributions from community members and developers in Olydorf!

1.  Fork the project repository.
2.  Create your feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'feat: Add New Feature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request with a clear description of your changes.

---

***Olymarket: Local. Loved. Olydorf.***
