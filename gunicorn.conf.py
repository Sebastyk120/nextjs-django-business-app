# Configuración optimizada de Gunicorn para prevenir WORKER TIMEOUT
import multiprocessing
import os

# Configuración de workers optimizada para memoria
# Reducir workers para evitar alto uso de RAM
workers = int(os.environ.get('WEB_CONCURRENCY', min(4, multiprocessing.cpu_count() + 1)))
worker_class = 'sync'
worker_connections = 500  # Reducido para menor uso de memoria

# Configuración de timeouts - CRÍTICO para resolver WORKER TIMEOUT
timeout = 300  # 5 minutos para requests largos (exports, bulk updates)
keepalive = 5
graceful_timeout = 120

# Configuración de memoria para prevenir OOM (Out of Memory)
max_requests = 500   # Reiniciar worker más frecuentemente para liberar memoria
max_requests_jitter = 50   # Reducir jitter
worker_tmp_dir = '/dev/shm'  # Usar memoria compartida si está disponible

# Configuración adicional para optimizar memoria
worker_rlimit_as = 1073741824  # Límite de memoria virtual por worker (1GB)
worker_rlimit_data = 536870912  # Límite de memoria de datos por worker (512MB)

# Configuración de logging optimizada para producción
loglevel = 'warning'  # Solo warnings y errores críticos
accesslog = None      # Desactivar access logs para mejor rendimiento
errorlog = '-'        # Mantener error logs en stderr
# access_log_format no es necesario cuando accesslog = None

# Configuración de bind
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Configuración de preload para mejor rendimiento
preload_app = True

# Configuración de límites
limit_request_line = 8190
limit_request_fields = 100
limit_request_field_size = 8190

# Configuración de procesos
user = None
group = None
tmp_upload_dir = None

# Configuración de señales para graceful shutdown (optimizada para producción)
def when_ready(server):
    server.log.warning("Gunicorn server is ready. Listening on: %s", server.address)

def worker_int(worker):
    # Solo log en caso de problemas, no en operación normal
    pass

def pre_fork(server, worker):
    # Reducir logs de workers para producción
    pass

def post_fork(server, worker):
    # Reducir logs de workers para producción
    pass

def worker_abort(worker):
    worker.log.error("Worker received SIGABRT signal - PID: %s", worker.pid)