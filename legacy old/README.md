# Totem HUB — MVP 1

Repositorio base del proyecto **Totem HUB** siguiendo la estructura y reglas de `AGENTS.md`.

## Documentación clave

- `AGENTS.md`: reglas operativas y arquitectura obligatoria.
- `CONTEXT.md`: decisiones técnicas y diseño del sistema.
- `docs/MASTER_PROMPT.md`: fuente de verdad funcional del producto.
- `docs/specs/`: specs por módulo.

## Estructura inicial

```text
totem-mvp1/
├── docs/
│   ├── MASTER_PROMPT.md
│   ├── CONTEXT.md
│   └── specs/
├── backend/
│   ├── apps/
│   ├── core/
│   └── totem_backend/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── types/
└── scripts/
```

## Inicio rápido

```bash
docker-compose up --build
```

### Levantar backend (local)

```bash
cd backend
python manage.py check
python manage.py runserver 8000
```

### Levantar frontend (local)

```bash
cd frontend
npm install
npm run dev
```

## Nota

Primero se arma la base estructural del monolito modular (backend) y del app router (frontend), luego se implementan módulos P0: viajes, inscripciones, pagos y documentos.
