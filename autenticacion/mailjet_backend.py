import os
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.message import EmailMessage
from mailjet_rest import Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MailjetEmailBackend(BaseEmailBackend):
    """
    Backend personalizado para enviar emails usando la API de Mailjet
    """
    
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        
        # Obtener las credenciales de Mailjet desde variables de entorno
        self.api_key = os.environ.get('MJ_APIKEY_PUBLIC')
        self.api_secret = os.environ.get('MJ_APIKEY_PRIVATE')
        
        if not self.api_key or not self.api_secret:
            if not self.fail_silently:
                raise ValueError("Las variables de entorno MJ_APIKEY_PUBLIC y MJ_APIKEY_PRIVATE deben estar definidas")
            logger.error("Credenciales de Mailjet no encontradas en variables de entorno")
            return
            
        # Inicializar el cliente de Mailjet
        self.mailjet = Client(auth=(self.api_key, self.api_secret), version='v3.1')
    
    def send_messages(self, email_messages):
        """
        Envía una lista de mensajes de email usando Mailjet
        """
        if not hasattr(self, 'mailjet'):
            return 0
            
        num_sent = 0
        
        for message in email_messages:
            try:
                if self._send_message(message):
                    num_sent += 1
            except Exception as e:
                logger.error(f"Error enviando email: {e}")
                if not self.fail_silently:
                    raise
                    
        return num_sent
    
    def _send_message(self, message):
        """
        Envía un mensaje individual usando Mailjet
        """
        try:
            # Preparar los destinatarios
            to_recipients = []
            for email in message.to:
                to_recipients.append({
                    "Email": email,
                    "Name": email.split('@')[0]  # Usar la parte antes del @ como nombre por defecto
                })
            
            # Preparar los datos para Mailjet
            mailjet_data = {
                'Messages': [
                    {
                        "From": {
                            "Email": message.from_email or settings.DEFAULT_FROM_EMAIL,
                            "Name": getattr(settings, 'DEFAULT_FROM_NAME', 'Heavens Fruits')
                        },
                        "To": to_recipients,
                        "Subject": message.subject,
                        "TextPart": message.body,
                    }
                ]
            }
            
            # Si el mensaje tiene contenido HTML, agregarlo
            if hasattr(message, 'alternatives') and message.alternatives:
                for content, mimetype in message.alternatives:
                    if mimetype == 'text/html':
                        mailjet_data['Messages'][0]['HTMLPart'] = content
                        break
            
            # Agregar CC si existe
            if message.cc:
                cc_recipients = []
                for email in message.cc:
                    cc_recipients.append({
                        "Email": email,
                        "Name": email.split('@')[0]
                    })
                mailjet_data['Messages'][0]['Cc'] = cc_recipients
            
            # Agregar BCC si existe
            if message.bcc:
                bcc_recipients = []
                for email in message.bcc:
                    bcc_recipients.append({
                        "Email": email,
                        "Name": email.split('@')[0]
                    })
                mailjet_data['Messages'][0]['Bcc'] = bcc_recipients
            
            # Enviar el email
            result = self.mailjet.send.create(data=mailjet_data)
            
            # Verificar el resultado
            if result.status_code == 200:
                response_data = result.json()
                if response_data.get('Messages') and response_data['Messages'][0].get('Status') == 'success':
                    logger.info(f"Email enviado exitosamente a {message.to}")
                    return True
                else:
                    logger.error(f"Error en respuesta de Mailjet: {response_data}")
                    return False
            else:
                logger.error(f"Error HTTP de Mailjet: {result.status_code} - {result.text}")
                return False
                
        except Exception as e:
            logger.error(f"Excepción al enviar email: {e}")
            if not self.fail_silently:
                raise
            return False