def calcular_estado_docs(inscripcion) -> str:
    """
    Calcula el estado de documentos de una inscripción.
    Devuelve: "completo", "incompleto", "faltante", "pendiente"
    """
    documentos = list(inscripcion.documentos.all())

    if not documentos:
        return "faltante"

    estados = {d.estado for d in documentos}

    if "rechazado" in estados:
        return "incompleto"

    if all(d.estado == "aprobado" for d in documentos):
        return "completo"

    if any(d.estado in ("pendiente", "en_revision") for d in documentos):
        return "pendiente"

    return "incompleto"
