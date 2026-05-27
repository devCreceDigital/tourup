"""Settings base para Totem HUB backend."""

import os
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "*").split(",")]

# CORS
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "True").lower() == "true"
CORS_ALLOWED_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if o]
CORS_ALLOW_CREDENTIALS = True


# Application definition

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'django_filters',
    'corsheaders',
    'apps.usuarios',
    'apps.catalogo',
    'apps.itinerarios',
    'apps.viajes',
    'apps.inscripciones',
    'apps.pagos',
    'apps.documentos',
    'apps.notificaciones',
    'apps.asistente_ia',
    'apps.tenancy',
    'apps.planes',
    'apps.soporte',
    'apps.superadmin',
    'apps.dashboard_admin',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'apps.tenancy.middleware.TenantResolutionMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'totem_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# WSGI
WSGI_APPLICATION = 'totem_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

def _database_from_url(database_url: str):
    parsed = urlparse(database_url)
    engine_map = {
        "postgres": "django.db.backends.postgresql",
        "postgresql": "django.db.backends.postgresql",
    }
    engine = engine_map.get(parsed.scheme)
    if not engine:
        raise ValueError(f"Esquema de DATABASE_URL no soportado: {parsed.scheme}")
    options = {}
    query = parse_qs(parsed.query)
    if "sslmode" in query and query["sslmode"]:
        options["sslmode"] = query["sslmode"][0]
    options.setdefault("connect_timeout", 5)
    return {
        "ENGINE": engine,
        "NAME": parsed.path.lstrip("/") or "postgres",
        "USER": parsed.username or "postgres",
        "PASSWORD": parsed.password or "",
        "HOST": parsed.hostname or "localhost",
        "PORT": str(parsed.port or "5432"),
        "OPTIONS": options,
    }


if os.getenv("DATABASE_URL"):
    DATABASES = {"default": {**_database_from_url(os.getenv("DATABASE_URL", "")), "CONN_MAX_AGE": 60, "CONN_HEALTH_CHECKS": True}}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

RUNNING_TESTS = any(arg in {"test", "pytest"} for arg in sys.argv)
if RUNNING_TESTS:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "test_db.sqlite3",
        }
    }


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'es-pe'

TIME_ZONE = 'America/Lima'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── JAZZMIN (Django Admin theme) ──────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    "site_title": "Totem HUB Admin",
    "site_header": "Totem HUB",
    "site_brand": "Totem HUB",
    "site_logo": None,
    "login_logo": None,
    "welcome_sign": "Bienvenido al panel de administración",
    "copyright": "Totem HUB © 2026",
    "search_model": ["auth.User"],

    # Íconos por app y modelo (Font Awesome)
    "icons": {
        "auth":                       "fas fa-users-cog",
        "auth.user":                  "fas fa-user",
        "auth.Group":                 "fas fa-users",
        "apps.tenancy":               "fas fa-building",
        "tenancy.Tenant":             "fas fa-building",
        "apps.planes":                "fas fa-layer-group",
        "planes.Plan":                "fas fa-layer-group",
        "apps.usuarios":              "fas fa-user-circle",
        "usuarios.Perfil":            "fas fa-id-card",
        "apps.viajes":                "fas fa-plane",
        "viajes.Viaje":               "fas fa-plane-departure",
        "apps.itinerarios":           "fas fa-map-marked-alt",
        "itinerarios.Itinerario":     "fas fa-route",
        "itinerarios.DiaItinerario":  "fas fa-calendar-day",
        "apps.catalogo":              "fas fa-th-list",
        "catalogo.Destino":           "fas fa-map-pin",
        "catalogo.Actividad":         "fas fa-hiking",
        "catalogo.Alojamiento":       "fas fa-hotel",
        "catalogo.Complemento":       "fas fa-plus-circle",
        "apps.inscripciones":         "fas fa-user-check",
        "inscripciones.Inscripcion":  "fas fa-clipboard-check",
        "apps.pagos":                 "fas fa-dollar-sign",
        "pagos.Pago":                 "fas fa-money-bill-wave",
        "pagos.Cuota":                "fas fa-calendar-check",
        "apps.documentos":            "fas fa-file-alt",
        "documentos.DocumentoViajero":"fas fa-file-contract",
    },

    # Orden de apps en el sidebar
    "order_with_respect_to": [
        "apps.tenancy",
        "apps.planes",
        "apps.usuarios",
        "apps.viajes",
    "apps.soporte",
        "apps.itinerarios",
        "apps.catalogo",
        "apps.inscripciones",
        "apps.pagos",
        "apps.documentos",
        "auth",
    ],

    # Links rápidos en el sidebar
    "custom_links": {
        "apps.viajes": [{
            "name": "Ver sitio público",
            "url": "/",
            "icon": "fas fa-globe",
            "new_window": True,
        }],
        "apps.dashboard_admin": [{
            "name": "Dashboard métricas",
            "url": "dashboard",
            "icon": "fas fa-chart-pie",
        }],
    },

    "topmenu_links": [
        {"name": "Dashboard", "url": "/admin/dashboard/", "icon": "fas fa-chart-pie"},
        {"name": "Inicio",    "url": "admin:index",       "icon": "fas fa-home"},
    ],

    # UI tweaks
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": ["apps.notificaciones", "apps.asistente_ia"],
    "hide_models": [],
    "related_modal_active": True,
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": True,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "darkly",
    "dark_mode_theme": "darkly",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.usuarios.authentication.SupabaseAuthentication",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

# Configuración de OpenRouter para Asistente IA
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_APP_URL = os.getenv("OPENROUTER_APP_URL", "https://totemhub.com")
OPENROUTER_APP_TITLE = os.getenv("OPENROUTER_APP_TITLE", "ToTem HUB Asistente IA")

# Configuración de Redis
REDIS_URL = os.getenv("REDIS_URL", "")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
APP_JWT_SECRET = os.getenv("APP_JWT_SECRET", os.getenv("DJANGO_SECRET_KEY", "dev-secret-key"))
APP_JWT_ISSUER = os.getenv("APP_JWT_ISSUER", "totem-backend")
APP_JWT_ACCESS_MINUTES = int(os.getenv("APP_JWT_ACCESS_MINUTES", "15"))
APP_JWT_REFRESH_DAYS = int(os.getenv("APP_JWT_REFRESH_DAYS", "7"))

TENANCY_HEADER_NAME = os.getenv("TENANCY_HEADER_NAME", "X-Tenant-ID")
TENANCY_ROOT_HOSTS = [
    host.strip().lower()
    for host in os.getenv("TENANCY_ROOT_HOSTS", "localhost,127.0.0.1,backend").split(",")
    if host.strip()
]
TENANCY_EXEMPT_PATH_PREFIXES = [
    "/health/",
    "/admin/",
    "/api/tenants/",
    "/api/plans/",
    "/api/subscriptions/",
    "/api/billing/",
    "/api/debug-auth/",
    "/api/usuarios/invitaciones/aceptar/",
]

# Stripe
STRIPE_SECRET_KEY  = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Frontend URL (para links en emails)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Email (opcional — usa console backend si no está configurado)
EMAIL_BACKEND    = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST       = os.getenv("EMAIL_HOST", "")
EMAIL_PORT       = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS    = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_HOST_USER  = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL  = os.getenv("DEFAULT_FROM_EMAIL", "noreply@totemhub.com")

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'hermes': {
            'format': '[HERMES] %(asctime)s %(message)s',
            'datefmt': '%H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'hermes',
        },
    },
    'loggers': {
        'hermes.pipeline': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
