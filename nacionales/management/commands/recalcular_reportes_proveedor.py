from django.core.management.base import BaseCommand
from nacionales.models import ReporteCalidadProveedor


class Command(BaseCommand):
    help = (
        "Recalcula y guarda todos los ReporteCalidadProveedor uno a uno. "
        "Corrige los registros que tienen p_precio_kg_nal=0 debido al bug "
        "del signal que usaba .update() sin refrescar el objeto en memoria."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué registros serían actualizados sin guardar cambios.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        reportes = ReporteCalidadProveedor.objects.select_related(
            'rep_cal_exp',
            'rep_cal_exp__venta_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional',
            'rep_cal_exp__venta_nacional__compra_nacional__proveedor',
        ).all()

        total = reportes.count()
        self.stdout.write(f"Procesando {total} reportes de proveedor...\n")

        actualizados = 0
        con_precio_nal_0 = 0
        errores = 0

        for reporte in reportes:
            try:
                rep_exp = reporte.rep_cal_exp
                precio_nal_correcto = rep_exp.precio_venta_kg_nal
                precio_nal_actual = reporte.p_precio_kg_nal

                necesita_actualizacion = (
                    not precio_nal_actual or precio_nal_actual == 0
                )

                if necesita_actualizacion:
                    con_precio_nal_0 += 1
                    guia = rep_exp.venta_nacional.compra_nacional.numero_guia
                    self.stdout.write(
                        f"  [CORREGIR] Reporte #{reporte.pk} | Guía: {guia} | "
                        f"p_precio_kg_nal: {precio_nal_actual} → {precio_nal_correcto} | "
                        f"p_total_facturar actual: {reporte.p_total_facturar}"
                    )

                if not dry_run:
                    reporte.save()
                    actualizados += 1

            except Exception as e:
                errores += 1
                self.stderr.write(f"  [ERROR] Reporte #{reporte.pk}: {e}")

        self.stdout.write("\n" + "=" * 60)
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN — No se guardó nada.\n"
                    f"  Total reportes: {total}\n"
                    f"  Reportes con p_precio_kg_nal=0 (necesitan corrección): {con_precio_nal_0}\n"
                    f"  Errores detectados: {errores}"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Proceso completado.\n"
                    f"  Total reportes procesados: {total}\n"
                    f"  Reportes con precio nal corregido: {con_precio_nal_0}\n"
                    f"  Actualizados correctamente: {actualizados}\n"
                    f"  Errores: {errores}"
                )
            )
