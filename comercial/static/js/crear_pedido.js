$(document).ready(function () {

    $(document).off('show.bs.modal', '#modalCreateItem');
    $(document).off('hidden.bs.modal', '#modalCreateItem');
    $(document).off('submit', '#modalCreateItem form');
    
    // Load content when modal is shown
    $("#modalCreateItem").on('show.bs.modal', function (e) {
        var link = $(e.relatedTarget);
        $(this).find(".modal-content").load(link.attr("href"));
    });

    // Clear modal content when hidden to prevent style persistence
    $("#modalCreateItem").on('hidden.bs.modal', function () {
        $(this).find(".modal-content").empty();
    });

    // Handle form submission
    $("#modalCreateItem").on('submit', 'form', function (e) {
        e.preventDefault();

        $.ajax({
            type: 'POST',
            url: $(this).attr('action'),
            data: $(this).serialize(),
            success: function (data) {
                if (data.success) {
                    $('#modalCreateItem').modal('hide');
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