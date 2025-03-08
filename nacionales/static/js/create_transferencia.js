document.addEventListener('DOMContentLoaded', function () {

    // Función para formatear moneda
    function formatearMoneda(valor) {
        if (isNaN(valor)) {
            return valor; // Devuelve el valor sin cambios si no es un número
        }
        return Number(valor).toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    // Manejar modal de Transferencia
    const transferenciaModal = document.getElementById('addTransferenciaModal');
    transferenciaModal.addEventListener('show.bs.modal', function (event) {
        const url = event.relatedTarget.getAttribute('data-url');
        const modalBody = transferenciaModal.querySelector('.modal-body');

        // Mostrar el spinner de carga al inicio
        const spinner = modalBody.querySelector('.spinner-border');
        spinner.classList.remove('d-none');

        fetch(url)
            .then(response => response.json())
            .then(data => {
                spinner.classList.add('d-none');
                modalBody.innerHTML = data.html;

                // Inicializar select2 y datepicker
                $(modalBody).find('.select2').select2();
                $(modalBody).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                // Inicializar Cleave.js en los inputs de moneda
                initCurrencyFormatting(modalBody);

                // Manejar el envío del formulario dentro del modal de transferencia
                const transferenciaForm = modalBody.querySelector('#transferenciaNacionalForm'); // Selector específico por ID
                if (transferenciaForm) {
                    transferenciaForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        // Limpiar los inputs de moneda, antes de enviar el formulario.
                        transferenciaForm.querySelectorAll('.currency-input').forEach(input => {
                            let v = input.value;
                            v = v.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                            input.value = v;
                        });
                        const formData = new FormData(transferenciaForm);
                        const submitButton = transferenciaForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

                        fetch(transferenciaForm.action, {
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
                                    showFormErrors(transferenciaForm, data.errors);
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

    transferenciaModal.addEventListener('hidden.bs.modal', function () {
        const modalBody = transferenciaModal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="spinner-border text-primary d-none" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>`;
    });

    // Manejar modal de Editar Transferencia
    const editModal = document.getElementById('editTransferenciaModal');
    editModal.addEventListener('show.bs.modal', function (event) {
        const url = event.relatedTarget.getAttribute('data-url');
        const modalBody = editModal.querySelector('.modal-body');
        const spinner = modalBody.querySelector('.spinner-border');
        spinner.classList.remove('d-none');

        fetch(url)
            .then(response => response.json())
            .then(data => {
                spinner.classList.add('d-none');
                modalBody.innerHTML = data.html;

                // Formatear valores de moneda antes de insertarlos en el formulario
                const currencyInputs = modalBody.querySelectorAll('.currency-input');
                currencyInputs.forEach(input => {
                    const valorOriginal = input.value;
                    input.value = formatearMoneda(valorOriginal);
                });

                $(modalBody).find('.select2').select2();
                $(modalBody).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                // Inicializar Cleave.js
                initCurrencyFormatting(modalBody);

                const editForm = modalBody.querySelector('#transferenciaNacionalForm');
                if (editForm) {
                    editForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        // Limpiar los inputs de moneda, antes de enviar el formulario.
                        editForm.querySelectorAll('.currency-input').forEach(input => {
                            let v = input.value;
                            v = v.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                            input.value = v;
                        });
                        const formData = new FormData(editForm);
                        const submitButton = editForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

                        fetch(editForm.action, {
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
                                    showFormErrors(editForm, data.errors);
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            })
                            .catch(error => {
                                console.error('Error al editar la transferencia:', error);
                                // Manejo de error adicional...
                            });
                    });
                }
            })
            .catch(error => {
                console.error('Error al cargar el formulario:', error);
                modalBody.innerHTML = '<p>Error al cargar el formulario. Por favor, intenta nuevamente.</p>';
            });
    });
    editModal.addEventListener('hidden.bs.modal', function () {
        const modalBody = editModal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="spinner-border text-primary d-none" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>`;
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