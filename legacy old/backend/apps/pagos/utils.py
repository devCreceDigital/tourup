from apps.pagos.models import Pago


def calcular_estado_pago(inscripcion) -> str:
    """
    Calcula el estado de pagos de una inscripción.
    Devuelve: "completo", "parcial", "pendiente"
    """
    try:
        pagos = list(Pago.objects.filter(inscripcion=inscripcion))
    except Exception:
        return "pendiente"

    if not pagos:
        return "pendiente"

    verificados = [p for p in pagos if p.estado == Pago.ESTADO_VERIFICADO]
    if not verificados:
        return "pendiente"

    # Obtener cuotas obligatorias del viaje
    try:
        from apps.pagos.models import Cuota
        cuotas = list(Cuota.objects.filter(viaje=inscripcion.viaje, obligatoria=True))
    except Exception:
        cuotas = []

    if not cuotas:
        return "parcial" if verificados else "pendiente"

    monto_requerido = sum(float(c.monto) for c in cuotas)
    monto_pagado = sum(float(p.monto) for p in verificados)

    if monto_pagado >= monto_requerido:
        return "completo"
    if monto_pagado > 0:
        return "parcial"
    return "pendiente"
