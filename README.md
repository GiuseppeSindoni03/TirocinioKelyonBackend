# SymbioCare - Backend

## Project Overview

SymbioCare backend is built with **NestJS** and provides a set of REST APIs to manage patient health data, doctor appointments, and secure authentication. This backend is the core of the **SymbioCare** platform, enabling communication between the web and mobile frontend applications and various medical devices.

## Technologies Used

- **NestJS**: A modern Node.js framework built with TypeScript. It's used for creating modular, scalable, and maintainable applications.
- **PostgreSQL**: A relational database to store all user, patient, and appointment data.
- **TypeORM**: ORM for interacting with PostgreSQL, allowing seamless management of database entities.
- **JWT Authentication**: JSON Web Token (JWT) is used for secure user authentication.
- **Docker**: For containerizing the backend service, ensuring easy deployment and scaling.
- **Bcrypt**: For securely hashing user passwords.

## Key Features

- **User Authentication**: JWT-based authentication system with support for login, registration, and secure session management.
- **Patient Management**: Add, view, and manage patient data.
- **Appointment Management**: Handle appointment booking, confirmation, and cancellations.
- **Health Data Integration**: Integration with wearable devices for automatic health data collection (e.g., SpO2, heart rate).
- **Medical Reports**: Doctors can create and manage medical visit reports for patients.

## Setup Instructions

### Step 1: Clone the repository
```bash
git clone https://github.com/your-username/symbiocare-backend.git
cd symbiocare-backend
```
### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Set up environment variables
Create a `.env` file in the root directory and configure the necessary environment variables (refer to .env.example for reference).

### Step 4: Run the server
```
  npm run start
```
The server will run at http://localhost:3000.

Folder Structure
- `src/`: Contains the entire backend code, organized by features (modules, services, controllers).
- `modules/`: Each feature (e.g., users, patients, appointments) is encapsulated in its own module for separation of concerns.
- `config/`: Configuration files for database connections, JWT secrets, etc.

## Running Tests
Run unit tests with Jest:
```
npm run test
```

## Contributing
1. Fork the repository.
2. Create a new branch for your feature.
3. Make your changes and commit them.
4. Open a pull request.

