$(document).ready(function () {
    // Función para actualizar presentaciones
    function updatePresentaciones() {
        var frutaId = $('#id_fruta').val();
        var pedidoId = $('#pedido_id').val();

        if (frutaId) {
            $.ajax({
                url: "{% url 'filtrar_presentaciones' %}", // Asegúrate de que esta URL está correcta
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
                }
            });
        } else {
            $('#id_presentacion').empty();
        }
    }

    // Función para actualizar referencias
    function updateReferencias() {
        var frutaId = $('#id_fruta').val();
        var presentacionId = $('#id_presentacion').val();
        var tipoCajaId = $('#id_tipo_caja').val();
        var pedidoId = $('#pedido_id').val();

        if (frutaId && presentacionId && tipoCajaId) {
            $.ajax({
                url: "{% url 'ajax_load_referencias' %}", // Asegúrate de que esta URL está correcta
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
                }
            });
        } else {
            $('#id_referencia').empty();
        }
    }

    // Delegar el envío del formulario para evitar múltiples binding
    $('#adddetalleItemModal').on('submit', 'form', function (e) {
        e.preventDefault();

        $.ajax({
            type: 'POST',
            url: $(this).attr('action'),
            data: $(this).serialize(),
            success: function (data) {
                if (data.success) {
                    $('#adddetalleItemModal').modal('hide');
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

    // Limpia el contenido del modal al cerrarlo
    $('#adddetalleItemModal').on('hidden.bs.modal', function () {
        $(this).find('.modal-content').html(''); // Limpiar el contenido del modal
    });

    // Eventos para actualizar presentaciones y referencias
    $('#adddetalleItemModal').on('change', '#id_fruta', updatePresentaciones);
    $('#adddetalleItemModal').on('change', '#id_presentacion, #id_tipo_caja', updateReferencias);
});
