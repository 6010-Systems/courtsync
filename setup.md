# CourtSync - Local Development Setup Guide

Welcome to the CourtSync project! This guide will walk you through setting up the project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your PC:
- **PHP** (v8.3 or higher)
- **Composer**
- **Node.js & NPM**
- **MySQL Database Server** (If you are using Laragon, XAMPP, or similar, this is included)
- **Git**

## Installation Steps

1. **Clone the Repository**
   Open your terminal and clone the repository to your local machine (e.g., inside your Laragon `www` folder):
   ```bash
   git clone <repository-url>
   cd courtsync
   ```

2. **Install PHP Dependencies**
   Run Composer to install the required PHP packages:
   ```bash
   composer install
   ```

3. **Install JavaScript Dependencies**
   Run NPM to install React, Inertia, Tailwind, and other frontend dependencies:
   ```bash
   npm install
   ```

4. **Set Up the Environment File**
   Duplicate the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt, you can use `copy .env.example .env`)*

5. **Generate the Application Key**
   Generate a unique key for your application, which will be automatically added to your `.env` file:
   ```bash
   php artisan key:generate
   ```

6. **Configure the Database**
   Open the `.env` file in your code editor and update the database connection settings. Use the following configuration:

   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=courtsync
   DB_USERNAME=root
   DB_PASSWORD=
   ```

   > **Note:** Ensure that your local MySQL server is running and that you have created a database named `courtsync` before proceeding to the next step. If you are using Laragon, you can create it via HeidiSQL or phpMyAdmin.

7. **Run Database Migrations**
   Create the necessary tables in your database by running:
   ```bash
   php artisan migrate
   ```

8. **Start the Development Servers**
   To work on the project, you need to run the frontend build process. Since you're likely using Laragon, you can access the app at `http://courtsync.test`. Just run:
   ```bash
   npm run dev
   ```
   *If you are not using Laragon, you also need to start the PHP server in a separate terminal tab using `php artisan serve` and access it at `http://localhost:8000`.*

---

## Should You Run `php artisan install:api`?

**Short Answer:** No, your team members should not run this on their individual PCs if it's already been done.

**Detailed Explanation:**
In Laravel 11 and later, API routing (`routes/api.php`) is opt-in. The command `php artisan install:api` sets up Laravel Sanctum, creates the `routes/api.php` file, and updates `bootstrap/app.php` to register the API routes. 

**This command only needs to be run ONCE per project.** 
The lead developer (or whoever needs to build the API first) should run this command, commit the resulting changes (`routes/api.php`, migrations, and modifications to `bootstrap/app.php`), and push them to the repository. Once pushed, other team members will automatically get the API setup when they pull the code and run `php artisan migrate`.

---

## Project Structure Overview

Here is a quick overview of the key directories in this project to help you navigate:

- **`app/`**: Contains the core logic of the application (Models, Controllers, Middleware).
- **`bootstrap/`**: Contains files that bootstrap the framework (like `app.php`).
- **`config/`**: Contains all of your application's configuration files.
- **`database/`**: Contains database migrations, model factories, and seeders.
- **`public/`**: The public-facing directory. This is the entry point (`index.php`) and holds compiled assets (CSS, JS).
- **`resources/`**: Contains your uncompiled assets. Since this is an Inertia.js + React project, your React components are located in `resources/js/`.
- **`routes/`**: Contains all route definitions.
  - `web.php`: Routes for the web interface.
  - `api.php`: (If installed) Routes for the API.
- **`storage/`**: Contains compiled Blade templates, sessions, file caches, and user-uploaded files.
- **`tests/`**: Contains your automated tests (PHPUnit/Pest).
- **`vite.config.js` / `tailwind.config.js`**: Configuration files for Vite (asset bundling) and Tailwind CSS (styling).

---

## Where is the React Starter Kit Located?

This project uses **Laravel Inertia** combined with **React**. 

If you're looking for the React components and the frontend "starter kit" (like Laravel Breeze's scaffolding), you will find all of this under the **`resources/js/`** directory. 

Here is how the React frontend is structured:

- **`resources/js/app.jsx`**: The main entry point for the React application. This is where React and Inertia are initialized.
- **`resources/js/Pages/`**: This folder acts as your "views". Each file here (like `Welcome.jsx`) corresponds to a full page rendered by a Laravel controller. When a Laravel controller returns `Inertia::render('Welcome')`, it is loading the React component from `resources/js/Pages/Welcome.jsx`.
- **`resources/js/Components/`**: This directory holds reusable UI components (e.g., Buttons, Inputs, Modals) that are used across different pages.
- **`resources/js/Layouts/`**: Contains layout components (like an `AuthenticatedLayout` or `GuestLayout`) that wrap your pages to provide consistent headers, footers, and navigation.

**To start editing the UI**, simply open any file in `resources/js/Pages/` or `resources/js/Components/` while `npm run dev` is running, and you will see your changes reflect instantly in the browser thanks to Vite's Hot Module Replacement (HMR).

---

## Where are the Authentication Controllers (Laravel Breeze)?

This project uses **Laravel Breeze** to handle authentication (login, registration, password reset, etc.). The backend logic that processes these requests is cleanly separated into its own directory.

You will find all authentication-related controllers in:
**`app/Http/Controllers/Auth/`**

Here are some of the key controllers you might interact with:
- **`AuthenticatedSessionController.php`**: Handles logging users in and out.
- **`RegisteredUserController.php`**: Handles new user registration.
- **`PasswordResetLinkController.php` & `NewPasswordController.php`**: Handle the "forgot password" flow.
- **`EmailVerificationPromptController.php` & `VerifyEmailController.php`**: Handle the email verification process.

*(These controllers act as the bridge between the frontend React components in `resources/js/Pages/Auth/` and the backend authentication system).*
