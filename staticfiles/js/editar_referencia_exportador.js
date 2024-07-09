$(document).ready(function () {

    var itemId = null;

    $('.mover-button').click(function () {
        itemId = $(this).data('referencia-id');
        $.ajax({
            url: '/comercial/referencia_editar_general',
            type: 'get',
            data: {'referencia_id': itemId},
            success: function (data) {
                $('.modal-content').html(data.form);
                $('#moverItemModal').modal('show');
            }
        });
    });

    $(document).on('submit', '#moverItemForm', function (event) {
        event.preventDefault();
        var serializedData = $(this).serialize() + '&referencia_id=' + itemId;
        console.log(serializedData); // Imprimir los datos serializados
        $.ajax({
            url: '/comercial/referencia_editar_general',
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

});