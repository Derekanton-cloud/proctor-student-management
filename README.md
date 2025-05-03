# DBMS Proctor-Student Management

## Overview
The DBMS Proctor-Student Management application is designed to facilitate the management of proctors and students in an educational environment. It provides functionalities for role-based logins, user profiles, assignment viewing for students, and performance tracking for proctors. The application also incorporates encrypted account validation, form validation, and an AI feature for database maintenance.

## Features
- **Role-Based Logins**: Users can log in as either students or proctors, with access to different functionalities based on their roles.
- **User Profiles**: Each user has a profile that displays relevant information and performance metrics.
- **Assignment Viewing**: Students can view and submit assignments through their dashboard.
- **Performance Tracking**: Proctors can track student performance and write remarks.
- **Encrypted Account Validation**: User accounts are secured with encryption for sensitive information.
- **Form Validation**: Input validation is implemented to ensure data integrity during registration and assignment submissions.
- **AI Database Maintenance**: An AI service is included to optimize database queries and predict performance trends.

## Technologies Used
- **Node.js**: Server-side JavaScript runtime for building the application.
- **Express.js**: Web framework for Node.js to handle routing and middleware.
- **PostgreSQL**: Relational database management system for storing user and assignment data.
- **EJS**: Templating engine for rendering dynamic HTML pages.
- **CSS**: Stylesheets for designing the application with a peach and maroon color theme.

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd dbms-proctor-student-management
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your database connection details:
   ```
   DATABASE_URL=your_database_url
   SECRET_KEY=your_secret_key
   ```
5. Start the server:
   ```
   npm start
   ```

## Usage
- Access the application in your web browser at `http://localhost:3000`.
- Register as a new user or log in with existing credentials.
- Navigate through the student or proctor dashboards to access relevant features.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.