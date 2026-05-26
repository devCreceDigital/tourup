from rest_framework.exceptions import PermissionDenied


def get_active_subscription(tenant_id):
    from apps.planes.models import Subscription
    return (
        Subscription.objects
        .filter(tenant_id=tenant_id, status__in=["active", "trialing"])
        .select_related()
        .first()
    )


def get_plan_for_tenant(tenant_id):
    from apps.planes.models import Plan, Subscription
    sub = get_active_subscription(tenant_id)
    if not sub:
        return None
    return Plan.objects.filter(id=sub.plan_id).first()


def check_trip_limit(tenant_id):
    from apps.viajes.models import Viaje
    plan = get_plan_for_tenant(tenant_id)
    if plan is None or plan.max_trips is None:
        return
    count = Viaje.objects.filter(tenant_id=tenant_id).count()
    if count >= plan.max_trips:
        raise PermissionDenied(
            f"Tu plan '{plan.nombre}' permite máximo {plan.max_trips} viajes. "
            "Actualiza tu suscripción para crear más."
        )


def check_inscription_limit(tenant_id):
    from apps.inscripciones.models import Inscripcion
    from apps.viajes.models import Viaje
    plan = get_plan_for_tenant(tenant_id)
    if plan is None or plan.max_inscriptions is None:
        return
    viaje_ids = Viaje.objects.filter(tenant_id=tenant_id).values_list("id", flat=True)
    count = Inscripcion.objects.filter(viaje_id__in=viaje_ids).count()
    if count >= plan.max_inscriptions:
        raise PermissionDenied(
            f"Tu plan '{plan.nombre}' permite máximo {plan.max_inscriptions} inscripciones. "
            "Actualiza tu suscripción para continuar."
        )
