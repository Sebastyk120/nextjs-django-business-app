from django.contrib import messages
from django.contrib.admin.views.decorators import user_passes_test
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm, PasswordResetForm
from django.contrib.auth.models import User
from django.contrib.auth.views import PasswordResetView
from django.db import IntegrityError
from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.core.mail import send_mail
from django.conf import settings
from captcha.fields import CaptchaField
from django import forms
from django.http import JsonResponse
from comercial.models import Fruta
from captcha.models import CaptchaStore
from captcha.helpers import captcha_image_url
import json
from django.views.decorators.csrf import csrf_exempt


def fruits_api(request):
    try:
        from comercial.models import Fruta
        frutas = Fruta.objects.all()
        data = []
        for f in frutas:
            try:
                if f.imagen:
                    # Build absolute URL
                    img_url = request.build_absolute_uri(f.imagen.url)
                else:
                    img_url = None
            except Exception:
                img_url = None
                
            data.append({
                'id': f.id,
                'nombre': f.nombre,
                'nombre_en': f.nombre_en,
                'descripcion': f.descripcion,
                'descripcion_en': f.descripcion_en,
                'imagen': img_url
            })
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_captcha_api(request):
    try:
        hashkey = CaptchaStore.generate_key()
        image_url = request.build_absolute_uri(captcha_image_url(hashkey))
        return JsonResponse({'key': hashkey, 'image_url': image_url})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def contact_api_submit(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Map frontend keys to form keys
            # CaptchaField expects 'captcha_0' (hash) and 'captcha_1' (text)
            form_data = {
                'name': data.get('name'),
                'email': data.get('email'),
                'country': data.get('country'),
                'message': data.get('message'),
                'captcha_0': data.get('captchaKey'),
                'captcha_1': data.get('captchaValue')
            }
            form = ContactForm(form_data)
            if form.is_valid():
                name = form.cleaned_data['name']
                email = form.cleaned_data['email']
                country = form.cleaned_data['country']
                message = form.cleaned_data['message']
                
                email_message = f'''
                Se ha recibido una nueva consulta desde el sitio web (Heavens Fruits):
                
                Nombre: {name}
                Email: {email}
                País de Importación: {country}
                
                Mensaje:
                {message}
                '''
                
                send_mail(
                    f"Contacto sitio web: Consulta de {name} - {country}",
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    ['subgerencia@heavensfruit.com', 'mabdime@heavensfruit.com', 'valentinagaray@heavensfruit.com'],
                    fail_silently=False,
                )
                return JsonResponse({'success': True, 'message': 'Message sent successfully'})
            else:
                return JsonResponse({'success': False, 'errors': form.errors}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def home(request):
    if not request.user.is_authenticated:
        return redirect('landing_page')
    return render(request, 'home.html')


def login1(request):
    if request.method == 'GET':
        return render(request, 'login2.html', {'form': AuthenticationForm})
    else:
        user = authenticate(
            request, username=request.POST['username'], password=request.POST['password'])
        if user is None:
            messages.error(request, f'Usuario o contraseña incorrecto')
            return render(request, 'login2.html',
                          {'form': AuthenticationForm})
        else:
            login(request, user)
            return redirect('home')


@login_required
def salir(request):
    logout(request)
    return redirect('/')


class CustomPasswordResetView(PasswordResetView):
    template_name = 'registration/password_reset_form.html'
    email_template_name = 'registration/password_reset_email.html'
    subject_template_name = 'registration/password_reset_subject.txt'
    success_url = '/autenticacion/reset_password_sent/'
    title = 'Restablecer Contraseña - Heaven\'s Fruits Connect'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['site_name'] = "Heaven's Fruits Connect"
        context['site_header'] = "Heaven's Fruits Connect"
        return context

    # Asegurarse de que use la plantilla correcta
    def get_template_names(self):
        return [self.template_name]


class ContactForm(forms.Form):
    name = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'Tu Nombre',
            'required': True
        })
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'placeholder': 'Tu Email Corporativo',
            'required': True
        })
    )
    country = forms.CharField(
        max_length=100,
        widget=forms.TextInput(attrs={
            'placeholder': 'País de Destino',
            'required': True
        })
    )
    message = forms.CharField(
        widget=forms.Textarea(attrs={
            'placeholder': 'Tu Consulta (Volumen, frutas de interés, etc.)',
            'required': True
        })
    )
    captcha = CaptchaField(
        error_messages={'invalid': 'Texto de verificación incorrecto, inténtalo de nuevo.'}
    )

class LandingPageView(TemplateView):
    template_name = 'index.html'

    def dispatch(self, request, *args, **kwargs):
        # Redireccionar tráfico directo al dominio API hacia el sitio principal
        host = request.get_host()
        if host.startswith('api.') or host == 'api.heavensfruit.com':
            return redirect('https://www.heavensfruit.com')
        return super().dispatch(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get all fruits from the database
        from comercial.models import Fruta
        context['frutas'] = Fruta.objects.all()
        context['form'] = ContactForm()
        return context
    
    def post(self, request, *args, **kwargs):
        form = ContactForm(request.POST)
        if form.is_valid():
            # Obtener datos del formulario
            name = form.cleaned_data['name']
            email = form.cleaned_data['email']
            country = form.cleaned_data['country']
            message = form.cleaned_data['message']
            
            # Construir el mensaje de correo
            email_message = f'''
            Se ha recibido una nueva consulta desde el sitio web:
            
            Nombre: {name}
            Email: {email}
            País de Importación: {country}
            
            Mensaje:
            {message}
            '''
            
            # Mejorar el manejo de errores con detalles específicos
            try:
                import traceback
                # Usar el mismo metodo que funciona para reset password
                result = send_mail(
                    f"Contacto sitio web: Consulta de {name} - {country}",
                    email_message,
                    settings.DEFAULT_FROM_EMAIL,
                    ['subgerencia@heavensfruit.com', 'mabdime@heavensfruit.com', 'valentinagaray@heavensfruit.com'],
                    fail_silently=False,
                )
                
                print(f"Resultado del envío: {result}")  # 1 significa éxito
                
                # Determinar el idioma para mensaje adecuado
                is_english = 'en/' in request.path or request.resolver_match.url_name == 'landing_page_en'
                
                # Si llegamos aquí, el correo se envió correctamente
                if is_english:
                    messages.success(request, 'Your message has been sent successfully. We will contact you soon.')
                else:
                    messages.success(request, 'Tu mensaje ha sido enviado con éxito. Nos pondremos en contacto contigo pronto.')
            except Exception as e:
                print(f"Error detallado al enviar correo: {e}")
                print(traceback.format_exc())  # Imprime el stack trace completo
                
                # Mensaje de error según idioma
                is_english = 'en/' in request.path or request.resolver_match.url_name == 'landing_page_en'
                if is_english:
                    messages.error(request, 'An error occurred while sending your message. Please try again later or contact us directly.')
                else:
                    messages.error(request, 'Ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde o contáctanos directamente.')

            # Redireccionar independientemente del resultado para evitar reenvíos
            return redirect('landing_page_en' if is_english else 'landing_page')
        else:
            # Si el formulario no es válido, imprimir los errores para depuración
            print(f"Errores del formulario: {form.errors}")
            
            # Mensaje de error según idioma
            is_english = 'en/' in request.path or request.resolver_match.url_name == 'landing_page_en'
            if is_english:
                messages.error(request, 'Please check the form for errors and try again.')
            else:
                messages.error(request, 'Por favor, revisa el formulario para corregir los errores e inténtalo de nuevo.')
        
        context = self.get_context_data()
        context['form'] = form
        return render(request, self.template_name, context)

class EnglishLandingPageView(LandingPageView):
    template_name = 'index_en.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Optionally add any English-specific context here
        return context
