CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email VARCHAR(254),
    tenant_id UUID,
    role VARCHAR(50) DEFAULT '',
    evento VARCHAR(50) NOT NULL,
    entidad_tipo VARCHAR(100) DEFAULT '',
    entidad_id VARCHAR(100) DEFAULT '',
    payload JSONB DEFAULT '{}',
    ip INET,
    user_agent TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_logs_evento_idx ON audit_logs(evento);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at);
