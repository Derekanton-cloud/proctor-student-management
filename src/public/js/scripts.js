// This file contains JavaScript code for client-side functionalities, including form validation and dynamic content updates.

document.addEventListener('DOMContentLoaded', function() {
    // Form validation for login and registration
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            if (!validateLoginForm()) {
                event.preventDefault();
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            if (!validateRegisterForm()) {
                event.preventDefault();
            }
        });
    }

    function validateLoginForm() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) {
            alert('Please fill in all fields.');
            return false;
        }
        return true;
    }

    function validateRegisterForm() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields.');
            return false;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return false;
        }

        return true;
    }

    // Dynamic content updates for student dashboard
    const assignmentList = document.getElementById('assignmentList');
    if (assignmentList) {
        fetch('/api/assignments')
            .then(response => response.json())
            .then(data => {
                data.forEach(assignment => {
                    const listItem = document.createElement('li');
                    listItem.textContent = assignment.title;
                    assignmentList.appendChild(listItem);
                });
            })
            .catch(error => console.error('Error fetching assignments:', error));
    }
});