$(document).ready(function () {
    var itemId = null;
    var pedidoId = null;

    function removeDots(number) {
        return number ? number.toString().replace(/\./g, '') : '';
    }

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
                initializeForm(pedidoId);
            }
        });
    });

    $('#moverItemModal').on('hidden.bs.modal', function () {
        $(this).find('.modal-content').html('');
        $(document).off('change', '.fruta-select');
        $(document).off('change', '.presentacion-select');
        $(document).off('change', '.tipo-caja-select');
        $(document).off('submit', '#moverItemForm');
    });

    $('.eliminar-button').click(function () {
        itemId = removeDots($(this).data('detallepedido-id'));
        pedidoId = removeDots($(this).data('pedido-id'));
        $('#eliminarModal').modal('show');
    });

    $('#eliminarModal').on('hidden.bs.modal', function () {
        itemId = null;
        pedidoId = null;
    });

    function initializeForm(pedidoId) {
        initializeFrutaSelect(pedidoId);
        initializePresentacionSelect(pedidoId);
        initializeTipoCajaSelect(pedidoId);

        $(document).on('submit', '#moverItemForm', function (event) {
            event.preventDefault();
            var form = $(this);
            var serializedData = form.serialize();
            var additionalData = '';

            if (!form.find('input[name="pedido_id"]').length) {
                additionalData += '&pedido_id=' + pedidoId;
            }

            if (!form.find('input[name="detallepedido_id"]').length) {
                additionalData += '&detallepedido_id=' + itemId;
            }

            serializedData += additionalData;
            console.log(serializedData);
            $.ajax({
                url: '/comercial/detalle_pedido_editar',
                type: 'post',
                data: serializedData,
                headers: {
                    'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val()
                },
                success: function (data) {
                    if (data.success) {
                        $('#moverItemModal').modal('hide');
                        location.reload();
                    } else {
                        console.log(data);
                        $('#moverItemModal .modal-content').html(data.form_html);
                        initializeForm(pedidoId);
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

    function initializeTipoCajaSelect(pedidoId) {
        $(document).on('change', '.tipo-caja-select', function () {
            updateReferencias();
        });
    }

    function updateReferencias() {
        var presentacionId = $('#id_presentacion').val();
        var tipoCajaId = $('#id_tipo_caja').val();
        var frutaId = $('#id_fruta').val();
        var pedidoId = $('input[name="pedido_id"]').val();
        if (presentacionId && tipoCajaId && frutaId) {
            $.ajax({
                url: '/comercial/ajax/load-referencias',
                data: {
                    'presentacion_id': presentacionId,
                    'tipo_caja_id': tipoCajaId,
                    'fruta_id': frutaId,
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
