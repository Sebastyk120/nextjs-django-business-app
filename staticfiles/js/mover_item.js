$(document).ready(function () {

    var itemId = null;

    $('.mover-button').click(function () {
        itemId = $(this).data('item-id');
        $.ajax({
            url: '/operaciones/intentariotr_items_mover',
            type: 'get',
            data: {'item_id': itemId},
            success: function (data) {
                $('.modal-content').html(data);
                $('#id_item').val(itemId).prop('disabled', true);
                $('#moverItemModal').modal('show');
            }
        });
    });

    $(document).on('submit', '#moverItemForm', function (event) {
        event.preventDefault();
        $('#id_item').prop('disabled', false);
        $.ajax({
            url: '/operaciones/intentariotr_items_mover',
            type: 'post',
            data: $(this).serialize(),
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
