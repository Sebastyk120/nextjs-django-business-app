from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Prueba el envío de correos usando Mailjet'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--to',
            type=str,
            default='test@example.com',
            help='Email de destino para la prueba'
        )
        parser.add_argument(
            '--subject',
            type=str,
            default='Prueba de Mailjet - Heavens Fruits',
            help='Asunto del email de prueba'
        )
    
    def handle(self, *args, **options):
        to_email = options['to']
        subject = options['subject']
        
        # Verificar que las variables de entorno estén configuradas
        if not os.environ.get('MJ_APIKEY_PUBLIC') or not os.environ.get('MJ_APIKEY_PRIVATE'):
            self.stdout.write(
                self.style.ERROR('Error: Las variables de entorno MJ_APIKEY_PUBLIC y MJ_APIKEY_PRIVATE no están configuradas')
            )
            return
        
        self.stdout.write(f'Enviando email de prueba a: {to_email}')
        self.stdout.write(f'Asunto: {subject}')
        self.stdout.write(f'Desde: {settings.DEFAULT_FROM_EMAIL}')
        
        message = f"""
        ¡Hola!
        
        Este es un email de prueba enviado desde Heavens Fruits usando Mailjet.
        
        Detalles de la prueba:
        - Backend de email: {settings.EMAIL_BACKEND}
        - Email origen: {settings.DEFAULT_FROM_EMAIL}
        - Email destino: {to_email}
        - Fecha: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Si recibes este mensaje, ¡la configuración de Mailjet está funcionando correctamente!
        
        Saludos,
        Equipo de Heavens Fruits
        """
        
        html_message = f"""
        <html>
        <body>
            <h2>¡Hola!</h2>
            
            <p>Este es un email de prueba enviado desde <strong>Heavens Fruits</strong> usando <strong>Mailjet</strong>.</p>
            
            <h3>Detalles de la prueba:</h3>
            <ul>
                <li><strong>Backend de email:</strong> {settings.EMAIL_BACKEND}</li>
                <li><strong>Email origen:</strong> {settings.DEFAULT_FROM_EMAIL}</li>
                <li><strong>Email destino:</strong> {to_email}</li>
                <li><strong>Fecha:</strong> {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
            </ul>
            
            <p>Si recibes este mensaje, ¡la configuración de Mailjet está funcionando correctamente!</p>
            
            <p><em>Saludos,<br>
            Equipo de Heavens Fruits</em></p>
        </body>
        </html>
        """
        
        try:
            result = send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                html_message=html_message,
                fail_silently=False
            )
            
            if result == 1:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Email enviado exitosamente a {to_email}')
                )
                self.stdout.write(
                    self.style.SUCCESS('La configuración de Mailjet está funcionando correctamente.')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'⚠️  El email no se pudo enviar. Resultado: {result}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error al enviar el email: {str(e)}')
            )
            self.stdout.write(
                self.style.ERROR('Verifica que las variables de entorno MJ_APIKEY_PUBLIC y MJ_APIKEY_PRIVATE estén correctamente configuradas.')
            )