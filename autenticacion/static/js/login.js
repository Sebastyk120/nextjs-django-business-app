document.addEventListener('DOMContentLoaded', function() {
    // Toggle password visibility
    const togglePassword = document.querySelector('.toggle-password');
    const passwordField = document.getElementById('password');
    
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function() {
            const type = passwordField.getAttribute('type') === 'password' ? 'email' : 'password';
            passwordField.setAttribute('type', type);
            
            // Change eye icon
            const eyeIcon = this.querySelector('i');
            eyeIcon.classList.toggle('fa-eye');
            eyeIcon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form validation
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            let isValid = true;
            
            // Simple validation
            if (username.trim() === '') {
                showError('username', 'Por favor, ingrese su nombre de usuario');
                isValid = false;
            } else {
                removeError('username');
            }
            
            if (password.trim() === '') {
                showError('password', 'Por favor, ingrese su contraseña');
                isValid = false;
            } else {
                removeError('password');
            }
            
            if (!isValid) {
                event.preventDefault();
            }
        });
    }
    
    // Animation for fruit elements
    const fruits = document.querySelectorAll('.fruit');
    
    if (fruits.length) {
        fruits.forEach(fruit => {
            // Add random rotation to fruit animations
            const randomRotation = Math.floor(Math.random() * 10) - 5;
            fruit.style.transform = `rotate(${randomRotation}deg)`;
        });
    }
    
    // Helper functions for form validation
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorMessage = document.createElement('div');
        
        // Remove any existing error
        removeError(fieldId);
        
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = message;
        errorMessage.style.color = '#FF5252';
        errorMessage.style.fontSize = '12px';
        errorMessage.style.marginTop = '5px';
        
        field.parentNode.appendChild(errorMessage);
        field.style.boxShadow = '0 0 0 2px #FF5252';
    }
    
    function removeError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorMessage = field.parentNode.querySelector('.error-message');
        
        if (errorMessage) {
            field.parentNode.removeChild(errorMessage);
        }
        
        field.style.boxShadow = '';
    }
    
    // Add focus and blur effects
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
    
    if (inputs.length) {
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.parentNode.style.transform = 'translateY(-3px)';
            });
            
            input.addEventListener('blur', function() {
                this.parentNode.style.transform = 'translateY(0)';
            });
        });
    }
});
