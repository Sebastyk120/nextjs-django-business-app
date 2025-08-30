# Configuración optimizada de Gunicorn para prevenir WORKER TIMEOUT
import multiprocessing
import os

# Configuración de workers
workers = int(os.environ.get('WEB_CONCURRENCY', multiprocessing.cpu_count() * 2 + 1))
worker_class = 'sync'
worker_connections = 1000

# Configuración de timeouts - CRÍTICO para resolver WORKER TIMEOUT
timeout = 300  # 5 minutos para requests largos (exports, bulk updates)
keepalive = 5
graceful_timeout = 120

# Configuración de memoria para prevenir OOM (Out of Memory)
max_requests = 1000  # Reiniciar worker después de 1000 requests
max_requests_jitter = 100  # Añadir variabilidad para evitar reinicio simultáneo
worker_tmp_dir = '/dev/shm'  # Usar memoria compartida si está disponible

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