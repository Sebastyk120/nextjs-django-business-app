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
            url: '/comercial/detalle_pedido_editar',
            type: 'get',
            data: {
                'detallepedido_id': itemId,
                'pedido_id': pedidoId
            },
            success: function (data) {
                $('#moverItemModal .modal-content').html(data.form);
                $('#moverItemModal').modal('show');
                initializeForm(pedidoId); // Inicializar la lógica del formulario al cargar el modal
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

    // Asignar evento para abrir el modal de eliminación
    $('.eliminar-button').click(function () {
        itemId = removeDots($(this).data('detallepedido-id'));
        pedidoId = removeDots($(this).data('pedido-id'));
        $('#eliminarModal').modal('show');
    });

    // Limpiar el contenido del modal de eliminación cuando se cierra
    $('#eliminarModal').on('hidden.bs.modal', function () {
        itemId = null;
        pedidoId = null;
    });

    // Inicializar eventos de formulario
    function initializeForm(pedidoId) {
        initializeFrutaSelect(pedidoId);
        initializePresentacionSelect(pedidoId);

        // Asignar evento de submit para el formulario dentro del modal
        $(document).on('submit', '#moverItemForm', function (event) {
            event.preventDefault();
            var serializedData = $(this).serialize() + '&detallepedido_id=' + itemId + '&pedido_id=' + pedidoId;
            console.log(serializedData); // Imprimir los datos serializados
            $.ajax({
                url: '/comercial/detalle_pedido_editar',
                type: 'post',
                data: serializedData,
                success: function (data) {
                    if (data.success) {
                        $('#moverItemModal').modal('hide');
                        location.reload();
                    } else {
                        console.log(data);
                        var errorMessage = data.error;
                        $('#errores').html('<div class="alert alert-danger">' + errorMessage + '</div>');
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
                        // Actualizar las referencias después de cambiar la presentación
                        updateReferencias();
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log("AJAX error: ", textStatus, errorThrown);
                    }
                });
            }
        });
    }

    function initializePresentacionSelect(pedidoId) {
        $(document).on('change', '.presentacion-select', function () {
            updateReferencias();
        });
    }

    function updateReferencias() {
        var presentacionId = $('#id_presentacion').val();
        var pedidoId = $('input[name="pedido_id"]').val();
        if (presentacionId) {
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
        }
    }
});
