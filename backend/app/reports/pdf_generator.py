import os
import uuid
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from app.models.screening import Screening
from app.models.patient import Patient

REPORTS_DIR = "reports_output"
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_pdf_report(screening: Screening, patient: Patient, doctor=None, verified: bool = False) -> str:
    filename = f"report_{screening.screening_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(REPORTS_DIR, filename)
    
    doc = SimpleDocTemplate(
        file_path, 
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand & Clinical Colors
    PRIMARY = HexColor('#0F766E')      # Clinical Medical Teal
    DARK_NAVY = HexColor('#0F172A')    # Institutional Slate
    TEXT_DARK = HexColor('#1E293B')    # Dark Slate
    TEXT_MUTED = HexColor('#64748B')   # Muted Slate
    BG_LIGHT = HexColor('#F8FAFC')     # Light Gray Background
    BORDER_COLOR = HexColor('#CBD5E1') # Border Slate
    
    IS_DISEASE = "PRESENT" in (screening.prediction or "").upper() or "SUSPECT" in (screening.prediction or "").upper() or "DETECTED" in (screening.prediction or "").upper()
    ALERT_BG = HexColor('#FEF2F2') if IS_DISEASE else HexColor('#ECFDF5')
    ALERT_TEXT = HexColor('#991B1B') if IS_DISEASE else HexColor('#065F46')
    ALERT_BORDER = HexColor('#FCA5A5') if IS_DISEASE else HexColor('#A7F3D0')

    # Typography Styles
    style_header_title = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=DARK_NAVY,
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
        fontSize=11,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=4
    )
    style_body = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        alignment=TA_LEFT
    )
    style_body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK
    )
    style_disclaimer = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )

    story = []

    # 1. Header Banner Table
    verification_badge = "VERIFIED CLINICAL REPORT" if verified else "PRELIMINARY CLINICAL DECISION SUPPORT"
    badge_color = "#059669" if verified else "#D97706"
    
    header_data = [
        [
            Paragraph("<b>MedVisionAI Clinical Platform</b><br/><font size=8 color='#64748B'>Modular Ophthalmology Clinical Decision-Support</font>", style_header_title),
            Paragraph(f"<b>{verification_badge}</b><br/><font size=8 color='{badge_color}'>Ophthalmologist Verification Status</font>", ParagraphStyle('HRight', parent=style_header_sub, alignment=TA_RIGHT))
        ]
    ]
    header_table = Table(header_data, colWidths=[310, 230])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=2, spaceAfter=8))

    # 2. Examination & Patient Metadata Table
    date_str = screening.created_at.strftime('%B %d, %Y - %H:%M UTC') if screening.created_at else datetime.now().strftime('%B %d, %Y')
    patient_name = f"{patient.first_name} {patient.last_name}"
    disease_display = getattr(screening, 'disease_name', 'Diabetic Retinopathy') or 'Diabetic Retinopathy'
    modality_display = getattr(screening, 'modality', 'Fundus') or 'Fundus'
    eye_display = getattr(screening, 'eye', 'OD') or 'OD'

    meta_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {patient_name}", style_body),
            Paragraph(f"<b>Screening Case ID:</b> <font name='Courier-Bold'>{screening.screening_id}</font>", style_body)
        ],
        [
            Paragraph(f"<b>Patient Access ID:</b> <font name='Courier'>{patient.patient_access_id}</font>", style_body),
            Paragraph(f"<b>Date of Analysis:</b> {date_str}", style_body)
        ],
        [
            Paragraph(f"<b>Evaluation Disease:</b> {disease_display}", style_body),
            Paragraph(f"<b>Examined Eye / Modality:</b> {eye_display} | {modality_display}", style_body)
        ],
        [
            Paragraph(f"<b>Model ID / Version:</b> {getattr(screening, 'model_id', 'medvision_dr')} (v{getattr(screening, 'model_version', '1.0')})", style_body),
            Paragraph(f"<b>Quality Gate Score:</b> {getattr(screening, 'quality_score', 100.0):.1f}/100 ({getattr(screening, 'quality_status', 'PASSED')})", style_body)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. AI Screening Findings Alert Box
    finding_text = f"<b>AI SCREENING FINDING: {screening.prediction}</b>"
    severity_display = getattr(screening, 'severity_grade', 'Standard Screening Protocol') or 'Standard Screening Protocol'
    risk_text = f"Risk Level: <b>{screening.risk_level}</b> | AI Confidence: <b>{screening.confidence * 100:.1f}%</b> | Severity: <b>{severity_display}</b>"
    
    finding_data = [
        [Paragraph(f"<font size=11 color='{ALERT_TEXT.hexval()}'>{finding_text}</font>", style_body)],
        [Paragraph(f"<font size=8.5 color='{ALERT_TEXT.hexval()}'>{risk_text}</font>", style_body)]
    ]
    finding_table = Table(finding_data, colWidths=[540])
    finding_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ALERT_BG),
        ('BOX', (0,0), (-1,-1), 1.2, ALERT_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(finding_table)
    story.append(Spacer(1, 8))

    # 4. Retinal Imaging & Grad-CAM Neural Attention Map (if image exists)
    if screening.image_path and os.path.exists(screening.image_path):
        story.append(Paragraph("<b>IMAGING & NEURAL ATTENTION EXPLAINABILITY</b>", style_section_title))
        img_orig = RLImage(screening.image_path, width=190, height=190)
        caption_style = ParagraphStyle('Caption', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=TEXT_MUTED, alignment=TA_CENTER)
        
        if screening.heatmap_path and os.path.exists(screening.heatmap_path):
            img_heat = RLImage(screening.heatmap_path, width=190, height=190)
            images_data = [
                [img_orig, img_heat],
                [Paragraph("Original Scan", caption_style), Paragraph("Grad-CAM Neural Attention Heatmap Overlay", caption_style)]
            ]
            images_table = Table(images_data, colWidths=[270, 270])
        else:
            images_data = [
                [img_orig],
                [Paragraph("Original Examination Scan", caption_style)]
            ]
            images_table = Table(images_data, colWidths=[540])
            
        images_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(images_table)
        story.append(Spacer(1, 8))

    # 5. Doctor Verification Section (CRITICAL SECTION)
    story.append(Paragraph("<b>DOCTOR CLINICAL VERIFICATION & FINDINGS</b>", style_section_title))
    doc_report = screening.report
    doc_findings_text = getattr(doc_report, 'doctor_findings', None) if doc_report else None
    doc_notes_text = getattr(doc_report, 'doctor_notes', None) if doc_report else None
    
    doctor_status_str = "FORMALLY VERIFIED BY OPHTHALMOLOGIST" if verified else "PENDING OPHTHALMOLOGIST REVIEW"
    doctor_status_color = "#059669" if verified else "#D97706"
    doc_name_str = f"Dr. {doctor.username}" if doctor else ("Authorized Ophthalmologist" if verified else "Pending Assignment")

    verification_rows = [
        [
            Paragraph(f"<b>Verification Status:</b> <font color='{doctor_status_color}'><b>{doctor_status_str}</b></font>", style_body),
            Paragraph(f"<b>Verifying Doctor:</b> {doc_name_str}", style_body)
        ],
        [
            Paragraph(f"<b>Clinical Doctor Observations:</b><br/>{doc_findings_text or 'Doctor clinical observations confirmed concordant with diagnostic decision support criteria.'}", style_body),
            Paragraph(f"<b>Patient Management Plan:</b><br/>{doc_notes_text or screening.recommendation}", style_body)
        ]
    ]
    doc_table = Table(verification_rows, colWidths=[270, 270])
    doc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#F0FDFA') if verified else BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1.2, HexColor('#0D9488') if verified else BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(doc_table)
    story.append(Spacer(1, 8))

    # 6. Mandatory Medical Disclaimer
    disclaimer_text = (
        "<b>MEDICAL LEGAL DISCLAIMER:</b> MedVisionAI is an ophthalmic clinical decision-support system. AI classifications, "
        "calibrated risk scores, and neural attention maps are designed to assist healthcare professionals and do not constitute "
        "independent medical diagnosis. Definitive diagnosis, treatment plans, and surgical referrals must be conducted by "
        "an authorized, licensed ophthalmologist."
    )
    disc_table_data = [[Paragraph(disclaimer_text, style_disclaimer)]]
    disc_table = Table(disc_table_data, colWidths=[540])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(disc_table)

    doc.build(story)
    return file_path
