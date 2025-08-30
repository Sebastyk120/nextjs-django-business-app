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

# Configuración de logging
loglevel = 'info'
accesslog = '-'  # Log a stdout
errorlog = '-'   # Log a stderr
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

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

# Configuración de señales para graceful shutdown
def when_ready(server):
    server.log.info("Gunicorn server is ready. Listening on: %s", server.address)

def worker_int(worker):
    worker.log.info("Worker received INT or QUIT signal")

def pre_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def worker_abort(worker):
    worker.log.info("Worker received SIGABRT signal")