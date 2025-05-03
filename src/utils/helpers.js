// This file contains utility functions that assist with various tasks throughout the application, such as formatting data and error handling.

const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
};

const handleError = (error) => {
    console.error(error);
    return { message: 'An error occurred. Please try again later.' };
};

const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const validatePassword = (password) => {
    return password.length >= 6; // Example validation rule
};

module.exports = {
    formatDate,
    handleError,
    validateEmail,
    validatePassword,
};