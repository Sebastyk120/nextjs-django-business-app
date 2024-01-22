$(document).ready(function () {
    $("#adddetalleItemModal").on('show.bs.modal', function (e) {
        var link = $(e.relatedTarget);
        $(this).find(".modal-content").load(link.attr("href"));
    });

    $(document).off('submit', '#modalCreateItem');

    $("#adddetalleItemModal").on('submit', 'form', function (e) {
        e.preventDefault();//#modalCreateItem

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
});