$(document).ready(function () {
    var itemId = null;
    var pedidoId = null;

    // Función para eliminar puntos de un número
    function removeDots(number) {
        return number ? number.toString().replace(/\./g, '') : '';
    }

    // Asignar evento para abrir el modal de edición
    $('.mover-button').click(function () {
        itemId = removeDots($(this).data('detallepedido-id'));
        pedidoId = removeDots($(this).data('pedido-id'));
        $.ajax({
            url: '/comercial/detalle_pedido_editar',  // URL sin barra al final
            type: 'get',
            data: {
                'detallepedido_id': itemId,
                'pedido_id': pedidoId
            },
            success: function (data) {
                $('#moverItemModal .modal-content').html(data.form);
                $('#moverItemModal').modal('show');
                initializeForm(itemId, pedidoId); // Inicializar la lógica del formulario al cargar el modal
                $('#id_referencia').prop('disabled', true); // Deshabilitar el campo referencia inicialmente
            }
        });
    });

    // Limpiar el contenido del modal cuando se cierra
    $('#moverItemModal').on('hidden.bs.modal', function () {
        $(this).find('.modal-content').html(''); // Limpiar el contenido del modal
        $(document).off('change', '.fruta-select'); // Desvincular eventos al cerrar el modal
        $(document).off('change', '.presentacion-select'); // Desvincular eventos al cerrar el modal
        $(document).off('submit', '#moverItemForm'); // Desvincular eventos al cerrar el modal
    });

    // Inicializar eventos de formulario
    function initializeForm(itemId, pedidoId) {
        $('#moverItemForm input[name="detallepedido_id"]').val(itemId); // Establecer el detallepedido_id
        $('#moverItemForm input[name="pedido_id"]').val(pedidoId); // Establecer el pedido_id
        $('#moverItemForm').attr('action', '/comercial/detalle_pedido_editar'); // Establecer la acción correcta del formulario
        initializeFrutaSelect(pedidoId);
        initializePresentacionSelect(pedidoId);

        // Asignar evento de submit para el formulario dentro del modal
        $(document).on('submit', '#moverItemForm', function (event) {
            event.preventDefault();
            var form = $(this);
            var serializedData = form.serialize();

            console.log(serializedData); // Imprimir los datos serializados
            $.ajax({
                url: form.attr('action'), // Usar la URL del formulario
                type: 'post',
                data: serializedData,
                success: function (data) {
                    if (data.success) {
                        $('#moverItemModal').modal('hide');
                        location.reload();
                    } else {
                        console.log(data);
                        var errorMessage = data.html;
                        $('#errores').html(errorMessage); // Mostrar los errores en el modal
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.log("AJAX Error: ", textStatus, errorThrown);
                }
            });
        });
    }

    function initializeFrutaSelect(pedidoId) {
        $(document).on('change', '.fruta-select', function () {
            var frutaId = $(this).val();
            if (frutaId) {
                $('#id_referencia').prop('disabled', false); // Habilitar el campo referencia al cambiar la fruta
                $.ajax({
                    url: '/comercial/filtrar_presentaciones',
                    data: {
                        'fruta_id': frutaId,
                        'pedido_id': pedidoId
                    },
                    dataType: 'json',
                    success: function (data) {
                        var presentacionSelect = $('#id_presentacion');
                        presentacionSelect.empty();
                        presentacionSelect.append('<option value="">Seleccione una presentación</option>');
                        $.each(data.presentaciones, function (key, value) {
                            presentacionSelect.append('<option value="' + value.id + '">' + value.nombre + ' (' + value.kilos + ' kg)</option>');
                        });
                        presentacionSelect.trigger('change'); // Disparar el cambio para actualizar las referencias
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("AJAX error: ", textStatus, errorThrown);
                    }
                });
            } else {
                $('#id_referencia').prop('disabled', true); // Deshabilitar el campo referencia si no hay fruta seleccionada
            }
        });
    }

    function initializePresentacionSelect(pedidoId) {
        $(document).on('change', '.presentacion-select', function () {
            var presentacionId = $(this).val();
            if (presentacionId) {
                $('#id_referencia').prop('disabled', false); // Habilitar el campo referencia al cambiar la presentación
                $.ajax({
                    url: '/comercial/ajax/load-referencias',
                    data: {
                        'presentacion_id': presentacionId,
                        'pedido_id': pedidoId
                    },
                    dataType: 'json',
                    success: function (data) {
                        var referenciaSelect = $('#id_referencia');
                        referenciaSelect.empty();
                        referenciaSelect.append('<option value="">Seleccione una referencia</option>');
                        $.each(data.referencias, function (key, value) {
                            referenciaSelect.append('<option value="' + value.id + '">' + value.nombre + '</option>');
                        });
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("AJAX error: ", textStatus, errorThrown);
                    }
                });
            } else {
                $('#id_referencia').prop('disabled', true); // Deshabilitar el campo referencia si no hay presentación seleccionada
            }
        });
    }
});
