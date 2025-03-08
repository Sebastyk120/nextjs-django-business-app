document.addEventListener('DOMContentLoaded', function () {
    // Function to check if response is valid JSON
    async function handleResponse(response) {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        } else if (contentType && contentType.includes("text/html")) {
            const html = await response.text();
            return { html };
        } else {
            const text = await response.text();
            throw new Error(`Expected JSON or HTML response but got something else. Status: ${response.status} - Content: ${text}`);
        }
    }

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

    // Manejar modal de Compra Nacional
    const compraNacionalModal = document.getElementById('compraNacionalModal');
    if (compraNacionalModal) {
        compraNacionalModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if (!button) {
                console.error('No se encontró el botón que activó el modal');
                return;
            }
            
            const url = button.getAttribute('data-url');
            const modalBody = compraNacionalModal.querySelector('#compraNacionalFormContent');

            fetch(url)
                .then(handleResponse)
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
                            // Limpiar los inputs de moneda
                            compraNacionalForm.querySelectorAll('.currency-input').forEach(input => {
                                let v = input.value;
                                // Remover símbolo y separador de miles, reemplazar coma decimal por punto
                                v = v.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                                input.value = v;
                            });
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
                                .then(handleResponse)
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
                                .catch(error => {
                                    console.error('Error en la respuesta:', error);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Ha ocurrido un error al procesar la solicitud. Por favor, inténtalo de nuevo.'
                                    });
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });

        // Al mostrar el modal de Compra Nacional, inicializa el formateo de moneda
        compraNacionalModal.addEventListener('shown.bs.modal', function () {
            // Asumiendo que el formulario se inyecta en este contenedor
            initCurrencyFormatting(document.getElementById('compraNacionalFormContent'));
        });
    }

    // Manejar modal de Venta Nacional 2
    const ventaNacionalModal = document.getElementById('ventaNacionalModal');
    if (ventaNacionalModal) {
        ventaNacionalModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if (!button) {
                console.error('No se encontró el botón que activó el modal');
                return;
            }
            
            const url = button.getAttribute('data-url');
            const modalBody = ventaNacionalModal.querySelector('#ventaNacionalFormContent');

            const initializeForm = (formContainer) => {
                $(formContainer).find('.select2').select2();
                $(formContainer).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                const ventaForm = formContainer.querySelector('#ventaNacionalForm');
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
                            .then(handleResponse)
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
                                    // Actualizar el formulario con errores
                                    modalBody.innerHTML = data.html;
                                    initializeForm(modalBody);

                                    // Mostrar mensaje general PERO NO TAPAR EL FORMULARIO
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error en el formulario',
                                        html: data.message,
                                        toast: true,  // Convertir en notificación tipo toast
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 3000
                                    });

                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Ocurrió un error inesperado'
                                });
                                submitButton.disabled = false;
                                submitButton.innerHTML = originalText;
                            });
                    });
                }
            };

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;
                    initializeForm(modalBody);
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });
    }

    // ---------------------------------------------------------------------------------------------------------

    // Manejar modal de Reporte Exportador
    const reporteExportadorModal = document.getElementById('reporteExportadorModal');
    if (reporteExportadorModal) {
        reporteExportadorModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const url = button.getAttribute('data-url');
            const modalBody = reporteExportadorModal.querySelector('#reporteExportadorFormContent');

            const initializeForm = (formContainer) => {
                $(formContainer).find('.select2').select2();
                $(formContainer).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                const reportexpForm = formContainer.querySelector('#reporteExportadorForm');
                if (reportexpForm) {
                    reportexpForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        // Limpiar los inputs de moneda
                        reportexpForm.querySelectorAll('.currency-input').forEach(input => {
                            let v = input.value;
                            // Remover símbolo y separador de miles, reemplazar coma decimal por punto
                            v = v.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                            input.value = v;
                        });
                        const formData = new FormData(reportexpForm);
                        const submitButton = reportexpForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        // Quitar formato moneda
                        let precioVenta = reportexpForm.querySelector('[name="precio_venta_kg_exp"]').value;
                        precioVenta = precioVenta.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                        // Nuevo control: verificar si elemento 'precio_compra_exp_value' existe
                        let precioCompraElem = document.getElementById('precio_compra_exp_value');
                        const precioCompra = precioCompraElem ? precioCompraElem.value : 0;

                        if (parseFloat(precioVenta) < parseFloat(precioCompra)) {
                            Swal.fire({
                                title: 'Atención',
                                text: `El precio de venta Kg Exportación ($${formatearMoneda(precioVenta)}) es menor que el precio de compra Kg Nacional ($${formatearMoneda(precioCompra)}). ¿Desea continuar?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Sí, guardar',
                                cancelButtonText: 'Cancelar'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    submitButton.disabled = true;
                                    submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...`;
                                    fetch(reportexpForm.action, {
                                        method: 'POST',
                                        body: formData,
                                        headers: {
                                            'X-CSRFToken': getCookie('csrftoken')
                                        }
                                    })
                                    .then(handleResponse)
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
                                            modalBody.innerHTML = data.html;
                                            initializeForm(modalBody);
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error en el formulario',
                                                html: data.message,
                                                toast: true,
                                                position: 'top-end',
                                                showConfirmButton: false,
                                                timer: 3000
                                            });
                                            submitButton.disabled = false;
                                            submitButton.innerHTML = originalText;
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Error al enviar el formulario:', error);
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Ocurrió un error inesperado'
                                        });
                                        submitButton.disabled = false;
                                        submitButton.innerHTML = originalText;
                                    });
                                } else {
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            });
                            return;
                        }

                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

                        fetch(reportexpForm.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken')
                            }
                        })
                            .then(handleResponse)
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
                                    // Actualizar el formulario con errores
                                    modalBody.innerHTML = data.html;
                                    initializeForm(modalBody);

                                    // Mostrar mensaje general PERO NO TAPAR EL FORMULARIO
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error en el formulario',
                                        html: data.message,
                                        toast: true,  // Convertir en notificación tipo toast
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 3000
                                    });

                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Ocurrió un error inesperado'
                                });
                                submitButton.disabled = false;
                                submitButton.innerHTML = originalText;
                            });
                    });
                }
            };

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;
                    initializeForm(modalBody);
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });

        // Al mostrar el modal de Compra Nacional, inicializa el formateo de moneda
        reporteExportadorModal.addEventListener('shown.bs.modal', function () {
            // Asumiendo que el formulario se inyecta en este contenedor
            initCurrencyFormatting(document.getElementById('reporteExportadorFormContent'));
        });
    }

    // Manejar modal de Reporte Proveedor
    const reporteProveedorModal = document.getElementById('reporteProveedorModal');
    if (reporteProveedorModal) {
        reporteProveedorModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const url = button.getAttribute('data-url');
            const modalBody = reporteProveedorModal.querySelector('#reporteProveedorFormContent');

            const initializeForm = (formContainer) => {
                $(formContainer).find('.select2').select2();
                $(formContainer).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                const reportprovForm = formContainer.querySelector('#reporteProveedorForm');
                if (reportprovForm) {
                    reportprovForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        const formData = new FormData(reportprovForm);
                        const submitButton = reportprovForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

                        fetch(reportprovForm.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken')
                            }
                        })
                            .then(handleResponse)
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
                                    // Actualizar el formulario con errores
                                    modalBody.innerHTML = data.html;
                                    initializeForm(modalBody);

                                    // Mostrar mensaje general PERO NO TAPAR EL FORMULARIO
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error en el formulario',
                                        html: data.message,
                                        toast: true,  // Convertir en notificación tipo toast
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 3000
                                    });

                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Ocurrió un error inesperado'
                                });
                                submitButton.disabled = false;
                                submitButton.innerHTML = originalText;
                            });
                    });
                }
            };

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;
                    initializeForm(modalBody);
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });
    }

// Manejar modal de Editar Compra Nacional
    const editCompraNacionalModal = document.getElementById('editCompraNacionalModal');
    if (editCompraNacionalModal) {
        editCompraNacionalModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const compraId = button.getAttribute('data-id');
            const url = `/nacionales/compra_nacional/edit/${compraId}/`;
            const modalBody = editCompraNacionalModal.querySelector('#editCompraNacionalFormContent');

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;

                    // Formatear valores de moneda antes de insertarlos en el formulario
                    const currencyInputs = modalBody.querySelectorAll('.currency-input');
                    currencyInputs.forEach(input => {
                        const valorOriginal = input.value;
                        input.value = formatearMoneda(valorOriginal);
                    });

                    // Inicializar select2 y datepicker
                    $(modalBody).find('.select2').select2();
                    $(modalBody).find('.datepicker').datepicker({
                        format: 'yyyy-mm-dd',
                        autoclose: true
                    });

                    // Manejar el envío del formulario en edición
                    const editForm = modalBody.querySelector('#editCompraNacionalForm');
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
                                .then(handleResponse)
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
                                    console.error('Error al enviar el formulario:', error);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Ocurrió un error inesperado'
                                    });
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });

        // Al mostrar el modal de Editar Compra Nacional, inicializa el formateo de moneda
        editCompraNacionalModal.addEventListener('shown.bs.modal', function () {
            // Asumiendo que el formulario se inyecta en este contenedor
            initCurrencyFormatting(document.getElementById('editCompraNacionalFormContent'));
        });
    }

    // Manejar modal de Editar Venta Nacional
    const editVentaNacionalModal = document.getElementById('editVentaNacionalModal');
    if (editVentaNacionalModal) {
        editVentaNacionalModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const ventaId = button.getAttribute('data-id');
            const url = `/nacionales/venta_nacional/edit/${ventaId}/`;
            const modalBody = editVentaNacionalModal.querySelector('#editVentaNacionalFormContent');

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;

                    $(modalBody).find('.select2').select2();
                    $(modalBody).find('.datepicker').datepicker({
                        format: 'yyyy-mm-dd',
                        autoclose: true
                    });

                    const editForm = modalBody.querySelector('#editVentaNacionalForm');
                    if (editForm) {
                        editForm.addEventListener('submit', function (e) {
                            e.preventDefault();
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
                                .then(handleResponse)
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
                                    console.error('Error al enviar el formulario:', error);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error',
                                        text: 'Ocurrió un error inesperado'
                                    });
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                });
                        });
                    }
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });
    }

    // Manejar modal de Editar Reporte Exportador
    const editReporteExportadorModal = document.getElementById('editReporteExportadorModal');
    if (editReporteExportadorModal) {
        editReporteExportadorModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const reporteId = button.getAttribute('data-id');
            const url = `/nacionales/reporte_exportador/edit/${reporteId}/`;
            const modalBody = editReporteExportadorModal.querySelector('#editReporteExportadorFormContent');

            const initializeForm = (formContainer) => {
                $(formContainer).find('.select2').select2();
                $(formContainer).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                const editForm = formContainer.querySelector('#editReporteExportadorForm');
                if (editForm) {
                    editForm.addEventListener('submit', function (e) {
                        e.preventDefault();
                        // Limpiar los inputs de moneda
                        editForm.querySelectorAll('.currency-input').forEach(input => {
                            let v = input.value;
                            // Remover símbolo y separador de miles, reemplazar coma decimal por punto
                            v = v.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                            input.value = v;
                        });
                        const formData = new FormData(editForm);
                        const submitButton = editForm.querySelector('button[type="submit"]');
                        const originalText = submitButton.innerHTML;

                        // Nuevo control: verificar si precio_venta_kg_exp es menor que precio_compra_exp
                        let precioVenta = editForm.querySelector('[name="precio_venta_kg_exp"]').value;
                        precioVenta = precioVenta.replace(/\$ /, '').replace(/\./g, '').replace(',', '.');
                        // Nuevo control: verificar si elemento 'precio_compra_exp_value' existe
                        let precioCompraElem = document.getElementById('precio_compra_exp_value');
                        const precioCompra = precioCompraElem ? precioCompraElem.value : 0;
                        if (parseFloat(precioVenta) < parseFloat(precioCompra)) {
                            Swal.fire({
                                title: 'Atención',
                                text: `El precio de venta Kg Exportación ($${formatearMoneda(precioVenta)}) es menor que el precio de compra Kg Nacional ($${formatearMoneda(precioCompra)}). ¿Desea continuar?`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Sí, guardar',
                                cancelButtonText: 'Cancelar'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    submitButton.disabled = true;
                                    submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Guardando...`;
                                    fetch(editForm.action, {
                                        method: 'POST',
                                        body: formData,
                                        headers: {
                                            'X-CSRFToken': getCookie('csrftoken')
                                        }
                                    })
                                    .then(handleResponse)
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
                                            modalBody.innerHTML = data.html;
                                            initializeForm(modalBody);
                                            const newForm = modalBody.querySelector('#editReporteExportadorForm');
                                            if (data.errors) {
                                                showFormErrors(newForm, data.errors);
                                            }
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Error en el formulario',
                                                html: data.message,
                                                toast: true,
                                                position: 'top-end',
                                                showConfirmButton: false,
                                                timer: 3000
                                            });
                                            submitButton.disabled = false;
                                            submitButton.innerHTML = originalText;
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Error al enviar el formulario:', error);
                                        Swal.fire({
                                            icon: 'error',
                                            title: 'Error',
                                            text: 'Ocurrió un error inesperado'
                                        });
                                        submitButton.disabled = false;
                                        submitButton.innerHTML = originalText;
                                    });
                                } else {
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            });
                            return;
                        }
                        // Continuar con el fetch si no se cumple la condición
                        submitButton.disabled = true;
                        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;
                        fetch(editForm.action, {
                            method: 'POST',
                            body: formData,
                            headers: {
                                'X-CSRFToken': getCookie('csrftoken')
                            }
                        })
                        .then(handleResponse)
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
                                // Reemplazar el contenido completo del modal con la respuesta HTML del servidor
                                modalBody.innerHTML = data.html;
                                
                                // Reinicializar el formulario para asegurar que select2, datepickers y otros componentes funcionen
                                initializeForm(modalBody);
                                
                                // Mostrar mensaje de error como toast en la esquina superior derecha
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error en el formulario',
                                    html: data.message,
                                    toast: true,
                                    position: 'top-end',
                                    showConfirmButton: false,
                                    timer: 3000
                                });
                                
                                // Restaurar el botón de submit a su estado original
                                submitButton.disabled = false;
                                submitButton.innerHTML = originalText;
                            }
                        })
                        .catch(error => {
                            console.error('Error al enviar el formulario:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Ocurrió un error inesperado'
                            });
                            submitButton.disabled = false;
                            submitButton.innerHTML = originalText;
                        });
                    });
                }
            };

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;

                    // Formatear valores de moneda antes de insertarlos en el formulario
                    const currencyInputs = modalBody.querySelectorAll('.currency-input');
                    currencyInputs.forEach(input => {
                        const valorOriginal = input.value;
                        input.value = formatearMoneda(valorOriginal);
                    });

                    initializeForm(modalBody);
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });

        // Al mostrar el modal de Editar Reporte Exportador Nacional, inicializa el formateo de moneda
        editReporteExportadorModal.addEventListener('shown.bs.modal', function () {
            // Asumiendo que el formulario se inyecta en este contenedor
            initCurrencyFormatting(document.getElementById('editReporteExportadorFormContent'));
        });
    }

    // Manejar modal de Editar Reporte Proveedor
    const editReporteProveedorModal = document.getElementById('editReporteProveedorModal');
    if (editReporteProveedorModal) {
        editReporteProveedorModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const reporteId = button.getAttribute('data-id');
            const url = `/nacionales/reporte_proveedor/edit/${reporteId}/`;
            const modalBody = editReporteProveedorModal.querySelector('#editReporteProveedorFormContent');

            const initializeForm = (formContainer) => {
                $(formContainer).find('.select2').select2();
                $(formContainer).find('.datepicker').datepicker({
                    format: 'yyyy-mm-dd',
                    autoclose: true
                });

                const editForm = formContainer.querySelector('#editReporteProveedorForm');
                if (editForm) {
                    editForm.addEventListener('submit', function (e) {
                        e.preventDefault();
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
                            .then(handleResponse)
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
                                    modalBody.innerHTML = data.html;
                                    initializeForm(modalBody);
                                    Swal.fire({
                                        icon: 'error',
                                        title: 'Error en el formulario',
                                        html: data.message,
                                        toast: true,
                                        position: 'top-end',
                                        showConfirmButton: false,
                                        timer: 3000
                                    });
                                    submitButton.disabled = false;
                                    submitButton.innerHTML = originalText;
                                }
                            })
                            .catch(error => {
                                console.error('Error al enviar el formulario:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Ocurrió un error inesperado'
                                });
                                submitButton.disabled = false;
                                submitButton.innerHTML = originalText;
                            });
                    });
                }
            };

            fetch(url)
                .then(handleResponse)
                .then(data => {
                    modalBody.innerHTML = data.html;
                    initializeForm(modalBody);
                })
                .catch(error => {
                    console.error('Error al cargar el formulario:', error);
                    modalBody.innerHTML = `
                        <div class="alert alert-danger">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar el formulario</h5>
                            <p>No se pudo cargar el formulario. Por favor, recarga la página e intenta nuevamente.</p>
                            <p>Detalles: ${error.message}</p>
                        </div>
                    `;
                });
        });
    }

    async function fetchSuggestions(term) {
        try {
            const response = await fetch(`{% url 'autocomplete_guia' %}?term=${encodeURIComponent(term)}`);
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                // ...existing code...
            } else {
                // Treat unexpected responses as an error
                console.error('Server returned HTML instead of JSON.');
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            // ...existing code...
        }
    }

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