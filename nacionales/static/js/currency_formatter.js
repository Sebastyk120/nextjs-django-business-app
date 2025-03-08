// Función para inicializar Cleave en un contenedor dado (document por defecto)
function initCurrencyFormatting(scope = document) {
    if (typeof Cleave === 'undefined') {
        console.error("Cleave.js no se ha cargado correctamente.");
        return;
    }
    const currencyInputs = scope.querySelectorAll('.currency-input');
    console.log("Se encontraron", currencyInputs.length, "inputs de moneda.");
    currencyInputs.forEach(function (input) {
        // Destruir instancias existentes de Cleave (si las hay)
        if (input.cleave) {
            input.cleave.destroy();
        }
        // Inicializar Cleave
        input.cleave = new Cleave(input, {
            numeral: true,
            numeralThousandsGroupStyle: 'thousand',
            prefix: '$ ',
            numeralDecimalScale: 2,
            numeralDecimalMark: ',',
            delimiter: '.'
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initCurrencyFormatting();
});