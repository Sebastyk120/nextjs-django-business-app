import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(num?: number): string {
    if (num === undefined || num === null) return '-';
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(num);
}

export function formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function numeroALetras(num: number): string {
    if (num === 0) return 'CERO PESOS M/CTE';

    const units = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return '';
        if (n === 100) return 'CIEN';
        
        let result = '';
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        
        if (hundred > 0) result += hundreds[hundred];
        
        if (remainder >= 10 && remainder < 20) {
            result += (result ? ' ' : '') + teens[remainder - 10];
        } else {
            const ten = Math.floor(remainder / 10);
            const unit = remainder % 10;
            
            if (ten > 0) result += (result ? ' ' : '') + tens[ten];
            if (unit > 0) {
                if (ten > 2) result += ' Y ' + units[unit];
                else if (ten === 2) result += (unit === 1 ? 'IUNO' : units[unit]);
                else result += (result ? ' ' : '') + units[unit];
            }
        }
        return result;
    };

    let result = '';
    const absNum = Math.abs(Math.floor(num));
    
    const billions = Math.floor(absNum / 1000000000);
    const millions = Math.floor((absNum % 1000000000) / 1000000);
    const thousands = Math.floor((absNum % 1000000) / 1000);
    const remainder = Math.floor(absNum % 1000);

    if (billions > 0) result += convertLessThanThousand(billions) + ' MIL MILLONES';
    if (millions > 0) result += (result ? ' ' : '') + convertLessThanThousand(millions) + (millions === 1 ? ' MILLON' : ' MILLONES');
    if (thousands > 0) result += (result ? ' ' : '') + (thousands === 1 ? 'MIL' : convertLessThanThousand(thousands) + ' MIL');
    if (remainder > 0) result += (result ? ' ' : '') + convertLessThanThousand(remainder);

    return (num < 0 ? 'MENOS ' : '') + result + ' PESOS M/CTE';
}
