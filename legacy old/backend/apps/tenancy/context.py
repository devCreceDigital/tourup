def get_request_tenant(request):
    return getattr(request, "tenant", None)


def get_request_tenant_id(request):
    tenant_id = getattr(request, "tenant_id", None)
    if tenant_id:
        return tenant_id
    tenant = get_request_tenant(request)
    return getattr(tenant, "id", None) if tenant else None


def get_request_tenant_source(request):
    return getattr(request, "tenant_source", None)
