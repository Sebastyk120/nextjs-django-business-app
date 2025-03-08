document.addEventListener('DOMContentLoaded', function () {
    // Manejar modal de Compra Nacional
    const compraNacionalModal = document.getElementById('compraNacionalModal');
    compraNacionalModal.addEventListener('show.bs.modal', function (event) {
        const url = event.relatedTarget.getAttribute('data-url');
        const modalBody = compraNacionalModal.querySelector('#compraNacionalFormContent');

        fetch(url)
            .then(response => response.json())
            .then(data => {
                modalBody.innerHTML = data.html;

                // Inicializar select2 y datepicker
                $(modalBody).find('.select2').select2();
                $(modalBody).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                // Manejar el envío del formulario
                const compraNacionalForm = modalBody.querySelector('#compraNacionalForm');
                if (compraNacionalForm) {
                    compraNacionalForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        const formData = new FormData(compraNacionalForm);
                        const submitButton = compraNacionalForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

                        fetch(compraNacionalForm.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken')
                            }
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: '¡Éxito!',
                                        html: `<strong>${data.message}</strong>`,
                                        showConfirmButton: true,
                                        timer: 3000
                                    }).then(() => {
                                        window.location.reload();
                                    });
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        html: `<strong>${data.message}</strong>`,
                                    });
                                    showFormErrors(compraNacionalForm, data.errors);
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            })
                    });
                }
            })
            .catch(error => {
                console.error('Error al cargar el formulario:', error);
                modalBody.innerHTML = '<p>Error al cargar el formulario. Por favor, intenta nuevamente.</p>';
            });
    });

    // Manejar modal de Venta Nacional
    const ventaNacionalModal = document.getElementById('ventaNacionalModal');
    ventaNacionalModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const url = button.getAttribute('data-url');
        const modalBody = ventaNacionalModal.querySelector('#ventaNacionalFormContent');

        fetch(url)
            .then(response => response.json())
            .then(data => {
                modalBody.innerHTML = data.html;

                // Inicializar plugins
                $(modalBody).find('.select2').select2();
                $(modalBody).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                // Manejar submit del formulario
                const ventaForm = modalBody.querySelector('#ventaNacionalForm');
                if (ventaForm) {
                    ventaForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        const formData = new FormData(ventaForm);
                        const submitButton = ventaForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

                        fetch(ventaForm.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken')
                            }
                        })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    Swal.fire({
                                        icon: 'success',
                                        title: '¡Éxito!',
                                        html: `<strong>${data.message}</strong>`,
                                        showConfirmButton: true,
                                        timer: 3000
                                    }).then(() => {
                                        window.location.reload();
                                    });
                                } else {
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        html: `<strong>${data.message}</strong>`,
                                    });
                                    showFormErrors(ventaForm, data.errors);
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            });
                    });
                }
            })
            .catch(error => {
                console.error('Error al cargar el formulario:', error);
                modalBody.innerHTML = '<p>Error al cargar el formulario. Por favor, intenta nuevamente.</p>';
            });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function showFormErrors(form, errors) {
        // Elimina errores previos
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
        Array.from(form.elements).forEach(element => {
            element.classList.remove('is-invalid');
        });
        // Agrega los nuevos errores según cada campo
        for (let field in errors) {
            const input = form.elements[field];
            if (input) {
                input.classList.add('is-invalid');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.innerText = errors[field].join(' ');
                input.parentNode.appendChild(errorDiv);
            }
        }
    }
});