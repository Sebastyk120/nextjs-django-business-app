document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const passwordField = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const inputs = loginForm.querySelectorAll('.form-control-custom');

    // Bootstrap-like form validation handling
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            // Custom validation logic before submitting if needed
            // For now, we rely on HTML5 'required' and apply classes

            let formIsValid = true;
            inputs.forEach(input => {
                if (!input.checkValidity()) {
                    input.classList.add('is-invalid');
                    // Show custom feedback message (if not handled by CSS :invalid ~ .invalid-feedback)
                    const feedback = input.parentElement.querySelector('.invalid-feedback') || input.parentElement.parentElement.querySelector('.invalid-feedback');
                    if (feedback) feedback.style.display = 'block';
                    formIsValid = false;
                } else {
                    input.classList.remove('is-invalid');
                    const feedback = input.parentElement.querySelector('.invalid-feedback') || input.parentElement.parentElement.querySelector('.invalid-feedback');
                     if (feedback) feedback.style.display = 'none';
                }
            });

            if (!formIsValid) {
                event.preventDefault();
                event.stopPropagation();
            }
            // No need for loginForm.classList.add('was-validated'); unless Bootstrap JS is fully used
        }, false);

        // Clear validation on input
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    this.classList.remove('is-invalid');
                    const feedback = this.parentElement.querySelector('.invalid-feedback') || this.parentElement.parentElement.querySelector('.invalid-feedback');
                    if (feedback) feedback.style.display = 'none';
                }
            });
        });
    }

    // Toggle password visibility
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function() {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);

            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Add focus class to parent for label styling
    inputs.forEach(input => {
        const parentGroup = input.closest('.form-group');
        if (parentGroup) {
            input.addEventListener('focus', function() {
                parentGroup.classList.add('is-focused');
            });
            input.addEventListener('blur', function() {
                parentGroup.classList.remove('is-focused');
                 // If you want to re-check validity on blur
                if (!this.checkValidity() && loginForm.classList.contains('submitted')) { // 'submitted' class to be added on submit attempt
                    this.classList.add('is-invalid');
                    const feedback = this.parentElement.querySelector('.invalid-feedback') || this.parentElement.parentElement.querySelector('.invalid-feedback');
                    if (feedback) feedback.style.display = 'block';
                }
            });
        }
    });
    
    // Trigger animations after a slight delay to ensure DOM is fully ready if needed
    // Or simply rely on CSS animation delays
    // Example: Animate elements on scroll or after load if they are off-screen initially
});