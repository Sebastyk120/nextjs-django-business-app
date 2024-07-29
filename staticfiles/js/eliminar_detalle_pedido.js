$(document).ready(function () {
    var itemId = null;

    $('.eliminar-button').click(function () {
        itemId = $(this).data('detallepedido-id');
        $.ajax({
            url: '/comercial/detalle_pedido_eliminar',
            type: 'get',
            data: {'detallepedido_id': itemId},
            success: function (data) {
                $('#eliminarItemModal .modal-content').html(data.form);
                $('#eliminarItemModal').modal('show');
            }
        });
    });

    $(document).off('submit', '#eliminarItemForm');

    $(document).on('submit', '#eliminarItemForm', function (event) {
        event.preventDefault();
        var serializedData = $(this).serialize() + '&detallepedido_id=' + itemId;
        console.log(serializedData); // Imprimir los datos serializados
        $.ajax({
            url: '/comercial/detalle_pedido_eliminar',
            type: 'post',
            data: serializedData,
            success: function (data) {
                if (data.success) {
                    $('#eliminarItemModal').modal('hide');
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

    $('#eliminarItemModal').on('hidden.bs.modal', function () {
        $(this).find('.modal-content').html(''); // Limpiar el contenido del modal
    });
});
