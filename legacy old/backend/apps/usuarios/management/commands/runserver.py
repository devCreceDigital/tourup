from django.contrib.staticfiles.management.commands.runserver import Command as StaticRunserver


class Command(StaticRunserver):
    """runserver sin chequeo de migraciones (todos los modelos son managed=False en Supabase)."""

    def check_migrations(self):
        pass
