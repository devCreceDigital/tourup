"""
PDF Generator para AsistenteTripPlan usando ReportLab.
"""
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT


BRAND_GREEN  = colors.HexColor("#1D9E75")
BRAND_DARK   = colors.HexColor("#1a1a2e")
GRAY_LIGHT   = colors.HexColor("#f8f9fa")
GRAY_MID     = colors.HexColor("#e5e7eb")
TEXT_GRAY    = colors.HexColor("#6b7280")


def generate_trip_pdf(trip) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── Styles ──────────────────────────────────────────────────
    title_style = ParagraphStyle("TripTitle",
        fontSize=24, textColor=BRAND_DARK,
        spaceAfter=4, fontName="Helvetica-Bold", alignment=TA_LEFT)

    subtitle_style = ParagraphStyle("Subtitle",
        fontSize=12, textColor=BRAND_GREEN,
        spaceAfter=2, fontName="Helvetica-Bold")

    meta_style = ParagraphStyle("Meta",
        fontSize=10, textColor=TEXT_GRAY,
        spaceAfter=2, fontName="Helvetica")

    section_style = ParagraphStyle("Section",
        fontSize=13, textColor=BRAND_DARK,
        spaceBefore=14, spaceAfter=6,
        fontName="Helvetica-Bold")

    day_style = ParagraphStyle("Day",
        fontSize=11, textColor=BRAND_GREEN,
        spaceBefore=8, spaceAfter=4,
        fontName="Helvetica-Bold")

    slot_label_style = ParagraphStyle("SlotLabel",
        fontSize=9, textColor=TEXT_GRAY,
        fontName="Helvetica-Bold")

    slot_text_style = ParagraphStyle("SlotText",
        fontSize=10, textColor=BRAND_DARK,
        fontName="Helvetica", spaceAfter=3)

    normal = ParagraphStyle("Normal2",
        fontSize=10, textColor=BRAND_DARK,
        fontName="Helvetica", spaceAfter=3)

    # ── Header ──────────────────────────────────────────────────
    story.append(Paragraph(trip.title or f"Viaje a {trip.destination}", title_style))
    story.append(Paragraph(f"Destino: {trip.destination}", subtitle_style))

    meta_parts = []
    if trip.days:      meta_parts.append(f"{trip.days} días")
    if trip.travelers: meta_parts.append(f"{trip.travelers} personas")
    if meta_parts:
        story.append(Paragraph(" · ".join(meta_parts), meta_style))

    story.append(Spacer(1, 0.3*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_GREEN))
    story.append(Spacer(1, 0.4*cm))

    # ── Clima ───────────────────────────────────────────────────
    weather = trip.weather or {}
    if weather:
        story.append(Paragraph("Clima", section_style))
        temp = weather.get("temperature") or weather.get("temp", "")
        desc = weather.get("description") or weather.get("condition", "")
        best = weather.get("best_time") or weather.get("mejor_epoca", "")
        if temp: story.append(Paragraph(f"Temperatura: {temp}°C", normal))
        if desc: story.append(Paragraph(f"Condición: {desc}", normal))
        if best: story.append(Paragraph(f"Mejor época: {best}", normal))
        story.append(Spacer(1, 0.2*cm))

    # ── Presupuesto ─────────────────────────────────────────────
    budget = trip.budget or {}
    if budget:
        story.append(Paragraph("Presupuesto estimado", section_style))

        total    = budget.get("total_soles") or budget.get("total", "")
        por_pers = budget.get("por_persona") or budget.get("per_person", "")
        hospedaje    = budget.get("hospedaje") or budget.get("accommodation", "")
        alimentacion = budget.get("alimentacion") or budget.get("food", "")
        transporte   = budget.get("transporte") or budget.get("transport", "")
        extras       = budget.get("extras", "")

        budget_data = [["Concepto", "Monto (S/.)"],]
        if hospedaje:    budget_data.append(["Hospedaje",    f"S/. {hospedaje:,}"])
        if alimentacion: budget_data.append(["Alimentación", f"S/. {alimentacion:,}"])
        if transporte:   budget_data.append(["Transporte",   f"S/. {transporte:,}"])
        if extras:       budget_data.append(["Extras",       f"S/. {extras:,}"])
        if total:        budget_data.append(["TOTAL",        f"S/. {total:,}"])
        if por_pers:     budget_data.append(["Por persona",  f"S/. {por_pers:,}"])

        if len(budget_data) > 1:
            t = Table(budget_data, colWidths=[10*cm, 5*cm])
            t.setStyle(TableStyle([
                ("BACKGROUND",  (0,0), (-1,0), BRAND_GREEN),
                ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
                ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE",    (0,0), (-1,-1), 10),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [GRAY_LIGHT, colors.white]),
                ("GRID",        (0,0), (-1,-1), 0.5, GRAY_MID),
                ("FONTNAME",    (0,-1), (-1,-1), "Helvetica-Bold"),
                ("TOPPADDING",  (0,0), (-1,-1), 6),
                ("BOTTOMPADDING",(0,0), (-1,-1), 6),
            ]))
            story.append(t)
        story.append(Spacer(1, 0.3*cm))

    # ── Itinerario ──────────────────────────────────────────────
    itinerary = trip.itinerary or []
    if itinerary:
        story.append(Paragraph("Itinerario día a día", section_style))

        SLOT_ICONS = {"mañana": "🌄 Mañana", "tarde": "☀️ Tarde", "noche": "🌙 Noche"}

        for day in itinerary:
            dia     = day.get("dia", "")
            destino = day.get("destino", trip.destination)
            slots   = day.get("slots") or {}

            story.append(Paragraph(f"Día {dia} — {destino}", day_style))

            if slots:
                for key, label in SLOT_ICONS.items():
                    val = slots.get(key, "")
                    if val:
                        story.append(Paragraph(label, slot_label_style))
                        story.append(Paragraph(str(val), slot_text_style))
            elif day.get("actividad"):
                story.append(Paragraph(str(day["actividad"]), slot_text_style))

        story.append(Spacer(1, 0.3*cm))

    # ── Footer ──────────────────────────────────────────────────
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY_MID))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "Generado por ToTem HUB · AI Travel Peru",
        ParagraphStyle("Footer", fontSize=8, textColor=TEXT_GRAY,
                       fontName="Helvetica", alignment=TA_CENTER)
    ))

    doc.build(story)
    return buffer.getvalue()
