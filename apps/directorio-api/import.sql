-- Columnas de transformación reutilizables como CTE
WITH src AS (
  SELECT
    COALESCE(NULLIF(TRIM(razon_social),''), 'Sin nombre') AS legal_name,
    COALESCE(NULLIF(TRIM(nombre_comercial),''), NULLIF(TRIM(razon_social),''), 'Sin nombre') AS commercial_name,
    NULLIF(TRIM(ruc),'') AS ruc,
    COALESCE(
      CASE UPPER(TRIM(departamento))
        WHEN 'AMAZONAS'      THEN 'Amazonas'
        WHEN 'ANCASH'        THEN 'Ancash'
        WHEN 'APURIMAC'      THEN 'Apurimac'
        WHEN 'AREQUIPA'      THEN 'Arequipa'
        WHEN 'AYACUCHO'      THEN 'Ayacucho'
        WHEN 'CAJAMARCA'     THEN 'Cajamarca'
        WHEN 'CALLAO'        THEN 'Callao'
        WHEN 'CUSCO'         THEN 'Cusco'
        WHEN 'HUANCAVELICA'  THEN 'Huancavelica'
        WHEN 'HUANUCO'       THEN 'Huanuco'
        WHEN 'ICA'           THEN 'Ica'
        WHEN 'JUNIN'         THEN 'Junin'
        WHEN 'LA LIBERTAD'   THEN 'La Libertad'
        WHEN 'LAMBAYEQUE'    THEN 'Lambayeque'
        WHEN 'LIMA'          THEN 'Lima'
        WHEN 'LORETO'        THEN 'Loreto'
        WHEN 'MADRE DE DIOS' THEN 'Madre de Dios'
        WHEN 'MOQUEGUA'      THEN 'Moquegua'
        WHEN 'PASCO'         THEN 'Pasco'
        WHEN 'PIURA'         THEN 'Piura'
        WHEN 'PUNO'          THEN 'Puno'
        WHEN 'SAN MARTIN'    THEN 'San Martin'
        WHEN 'TACNA'         THEN 'Tacna'
        WHEN 'TUMBES'        THEN 'Tumbes'
        WHEN 'UCAYALI'       THEN 'Ucayali'
        ELSE INITCAP(TRIM(departamento))
      END, 'Lima') AS region,
    NULLIF(TRIM(provincia),'') AS province,
    NULLIF(TRIM(distrito),'') AS district,
    COALESCE(NULLIF(TRIM(clase),''), 'Operador de Turismo') AS clase_val,
    LEAST(75,
      20 + 25
      + CASE WHEN NULLIF(TRIM(pagina_web),'') IS NOT NULL THEN 15 ELSE 0 END
      + CASE WHEN NULLIF(TRIM(email),'')      IS NOT NULL THEN 8  ELSE 0 END
      + CASE WHEN NULLIF(TRIM(telef1),'')     IS NOT NULL THEN 5  ELSE 0 END
      + CASE WHEN modalidad_autorizada ILIKE '%Digital%'  THEN 12 ELSE 0 END
      + CASE WHEN NULLIF(TRIM(nro_certificado),'') IS NOT NULL THEN 5 ELSE 0 END
    )::DECIMAL(5,2) AS score,
    CASE WHEN NULLIF(TRIM(pagina_web),'') IS NOT NULL
      THEN CASE WHEN LOWER(TRIM(pagina_web)) LIKE 'http%'
                THEN LOWER(TRIM(pagina_web))
                ELSE 'https://' || LOWER(TRIM(pagina_web)) END
      ELSE NULL END AS website,
    NULLIF(TRIM(telef1),'') AS phone,
    LOWER(NULLIF(TRIM(email),'')) AS email,
    NULLIF(TRIM(modalidad_autorizada),'') AS modalidad_val,
    NULLIF(TRIM(rep_legal),'') AS rep_legal_val,
    NULLIF(TRIM(nro_certificado),'') AS nro_cert_val,
    NULLIF(TRIM(fecha_expedicion),'') AS fecha_exp_val,
    NULLIF(TRIM(ubigeo),'') AS ubigeo_val,
    NULLIF(TRIM(fecha_corte),'') AS fecha_corte_val,
    ROW_NUMBER() OVER (PARTITION BY NULLIF(TRIM(ruc),'') ORDER BY ctid) AS rn
  FROM mincetur_staging
),
deduped AS (
  SELECT * FROM src
  WHERE ruc IS NULL OR rn = 1
)
INSERT INTO operators (
  legal_name, commercial_name, ruc, region, province, district,
  operator_type, niche, languages, verified, ttdmi_score, level,
  website, logo_url, description, phone, email,
  rank_nacional, created_at, updated_at,
  clase, modalidad_autorizada, rep_legal, nro_certificado,
  fecha_expedicion, ubigeo, fecha_corte, source
)
SELECT
  legal_name, commercial_name, ruc, region, province, district,
  clase_val, NULL, ARRAY['es'], false, score,
  CASE WHEN score >= 70 THEN 'advanced' WHEN score >= 40 THEN 'emerging' ELSE 'risk' END,
  website, NULL, NULL, phone, email, NULL, NOW(), NOW(),
  clase_val, modalidad_val, rep_legal_val, nro_cert_val,
  fecha_exp_val, ubigeo_val, fecha_corte_val, 'mincetur'
FROM deduped
ON CONFLICT (ruc) DO UPDATE SET
  commercial_name = EXCLUDED.commercial_name,
  region          = EXCLUDED.region,
  updated_at      = NOW();

SELECT COUNT(*) AS total_importados FROM operators;
