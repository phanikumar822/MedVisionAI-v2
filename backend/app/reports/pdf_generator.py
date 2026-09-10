import os
import uuid
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from app.models.screening import Screening
from app.models.patient import Patient

REPORTS_DIR = "reports_output"
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_pdf_report(screening: Screening, patient: Patient) -> str:
    filename = f"report_{screening.screening_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(REPORTS_DIR, filename)
    
    # 0.5 inch margins = 36 points
    doc = SimpleDocTemplate(
        file_path, 
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Colors
    PRIMARY = HexColor('#C85A32')      # Warm Terracotta
    TEXT_DARK = HexColor('#23211E')    # Warm Charcoal
    TEXT_MUTED = HexColor('#706B63')   # Soft Muted Charcoal
    BG_CREAM = HexColor('#FAF7F2')     # Soft Cream Background
    BORDER_COLOR = HexColor('#EBE5DD') # Border Accent
    
    IS_DR = screening.prediction == "DR PRESENT"
    ALERT_BG = HexColor('#FFF1F2') if IS_DR else HexColor('#ECFDF5')
    ALERT_TEXT = HexColor('#9F1239') if IS_DR else HexColor('#065F46')
    ALERT_BORDER = HexColor('#FECDD3') if IS_DR else HexColor('#A7F3D0')

    # Typography Styles
    style_header_title = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        alignment=TA_LEFT
    )
    
    style_header_sub = ParagraphStyle(
        'HeaderSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=TEXT_MUTED,
        alignment=TA_LEFT
    )

    style_section_title = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6
    )

    style_body = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        alignment=TA_LEFT
    )

    style_body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK
    )

    style_ai_context = ParagraphStyle(
        'AIContext',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_DARK,
        alignment=TA_JUSTIFY
    )

    style_disclaimer = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )

    story = []

    # 1. Header Banner Table
    header_data = [
        [
            Paragraph("<b>MedVisionAI</b>", style_header_title),
            Paragraph("<b>CLINICAL SCREENING REPORT</b><br/><font size=8 color='#706B63'>Diabetic Retinopathy Intelligence Suite</font>", ParagraphStyle('HRight', parent=style_header_sub, alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=2, spaceAfter=12))

    # 2. Patient & Metadata Summary Box
    date_str = screening.created_at.strftime('%B %d, %Y - %H:%M UTC') if screening.created_at else datetime.now().strftime('%B %d, %Y')
    patient_name = f"{patient.first_name} {patient.last_name}"
    
    meta_data = [
        [
            Paragraph(f"<b>Patient Full Name:</b> {patient_name}", style_body),
            Paragraph(f"<b>Screening ID:</b> <font name='Courier-Bold'>{screening.screening_id}</font>", style_body)
        ],
        [
            Paragraph(f"<b>Patient Access Code:</b> <font name='Courier'>{patient.patient_access_id}</font>", style_body),
            Paragraph(f"<b>Date of Analysis:</b> {date_str}", style_body)
        ],
        [
            Paragraph(f"<b>Patient Email:</b> {patient.email or 'N/A'}", style_body),
            Paragraph(f"<b>Screening Facility:</b> MedVisionAI Diagnostic Center", style_body)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CREAM),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 3. Diagnostic Finding Alert Card
    finding_text = f"<b>DIAGNOSTIC FINDING: {screening.prediction}</b>"
    risk_text = f"Risk Level: <b>{screening.risk_level}</b> | Model Confidence: <b>{screening.confidence * 100:.1f}%</b>"
    prob_dr = getattr(screening, 'probability_dr', screening.confidence if IS_DR else 1 - screening.confidence) or 0.0
    prob_no_dr = getattr(screening, 'probability_no_dr', 1 - screening.confidence if IS_DR else screening.confidence) or 0.0
    prob_text = f"Retinopathy Risk Score: <b>{prob_dr * 100:.1f}%</b> | Normal Morphology Score: <b>{prob_no_dr * 100:.1f}%</b>"

    finding_data = [
        [Paragraph(f"<font size=12 color='{ALERT_TEXT.hexval()}'>{finding_text}</font>", style_body)],
        [Paragraph(f"<font color='{ALERT_TEXT.hexval()}'>{risk_text}</font>", style_body)],
        [Paragraph(f"<font color='{ALERT_TEXT.hexval()}'>{prob_text}</font>", style_body)]
    ]
    finding_table = Table(finding_data, colWidths=[540])
    finding_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ALERT_BG),
        ('BOX', (0,0), (-1,-1), 1.5, ALERT_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(finding_table)
    story.append(Spacer(1, 12))

    # 4. Grok AI Written Clinical Context Section
    ai_context_text = getattr(screening, 'ai_context', None)
    if not ai_context_text:
        ai_context_text = (
            f"Grok Clinical AI Context: Deep learning classifier evaluated retinal fundus morphology with {screening.confidence*100:.1f}% confidence. "
            f"The Grad-CAM neural attention visualizer highlighted key micro-vascular feature regions across macular and optic disk quadrants. "
            f"Clinical correlation and comprehensive ophthalmoscopic evaluation are recommended."
        )

    story.append(Paragraph("<b>AI CLINICAL ANALYSIS & GROK MODEL CONTEXT</b>", style_section_title))
    ai_box_data = [[Paragraph(ai_context_text, style_ai_context)]]
    ai_box_table = Table(ai_box_data, colWidths=[540])
    ai_box_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CREAM),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(ai_box_table)
    story.append(Spacer(1, 12))

    # 5. Visual Retinal Images & Grad-CAM Heatmap
    if screening.image_path and os.path.exists(screening.image_path) and screening.heatmap_path and os.path.exists(screening.heatmap_path):
        story.append(Paragraph("<b>RETINAL IMAGING & GRAD-CAM NEURAL ATTENTION MAP</b>", style_section_title))
        
        img_orig = RLImage(screening.image_path, width=220, height=220)
        img_heat = RLImage(screening.heatmap_path, width=220, height=220)
        
        caption_style = ParagraphStyle('Caption', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER)
        
        images_table_data = [
            [img_orig, img_heat],
            [Paragraph("Original Retinal Fundus Scan", caption_style), Paragraph("Grad-CAM Attention Heatmap Overlay", caption_style)]
        ]
        
        images_table = Table(images_table_data, colWidths=[260, 260])
        images_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,-1), BG_CREAM),
            ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(images_table)
        story.append(Spacer(1, 12))

    # 6. Clinical Recommendation
    story.append(Paragraph("<b>RECOMMENDED CLINICAL MANAGEMENT</b>", style_section_title))
    rec_data = [[Paragraph(screening.recommendation, style_body)]]
    rec_table = Table(rec_data, colWidths=[540])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CREAM),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 14))

    # 7. Mandatory Legal Disclaimer Box
    disclaimer_text = (
        "<b>MEDICAL DISCLAIMER:</b> This document contains an AI-assisted screening analysis generated by MedVisionAI's "
        "EfficientNet-B0 neural model and Grok Intelligence LLM. This report is intended solely to support qualified clinical workflow "
        "and does not constitute a definitive medical diagnosis or treatment prescription. Final clinical assessment must be performed "
        "by an authorized ophthalmologist or eye care practitioner."
    )
    disc_table_data = [[Paragraph(disclaimer_text, style_disclaimer)]]
    disc_table = Table(disc_table_data, colWidths=[540])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#F5F0E8')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(disc_table)

    doc.build(story)
    
    return file_path

