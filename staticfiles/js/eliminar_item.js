$(document).ready(function () {

    var itemId = null;

    $('.eliminar-button').click(function () {
        itemId = $(this).data('item-id');
        $.ajax({
            url: '/inventarios/recibo_items_delete',
            type: 'get',
            data: {'item_id': itemId},
            success: function (data) {
                $('.modal-content').html(data.form);
                $('#eliminarItemModal').modal('show');
            }
        });
    });

    $(document).on('submit', '#eliminarItemForm', function (event) {
        event.preventDefault();
        var serializedData = $(this).serialize() + '&item_id=' + itemId;
        console.log(serializedData); // Imprimir los datos serializados
        $.ajax({
            url: '/inventarios/recibo_items_delete',
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

});