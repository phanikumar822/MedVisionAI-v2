import os
import uuid
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.screening import Screening
from app.models.patient import Patient

REPORTS_DIR = "reports_output"
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_pdf_report(screening: Screening, patient: Patient) -> str:
    filename = f"report_{screening.screening_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = os.path.join(REPORTS_DIR, filename)
    
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    alert_style = ParagraphStyle(
        'Alert',
        parent=styles['Normal'],
        textColor=colors.red if screening.risk_level == "HIGH" else colors.green,
        fontSize=12,
        spaceAfter=14
    )
    
    story = []
    
    story.append(Paragraph("MedVisionAI Screening Report", title_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph(f"<b>Patient:</b> {patient.first_name} {patient.last_name}", normal_style))
    story.append(Paragraph(f"<b>Screening ID:</b> {screening.screening_id}", normal_style))
    story.append(Paragraph(f"<b>Date:</b> {screening.created_at.strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>AI Screening Result:</b>", styles['Heading2']))
    story.append(Paragraph(f"Prediction: {screening.prediction}", alert_style))
    story.append(Paragraph(f"Confidence: {screening.confidence * 100:.1f}%", normal_style))
    story.append(Paragraph(f"Risk Level: {screening.risk_level}", normal_style))
    story.append(Spacer(1, 12))
    
    story.append(Paragraph("<b>Recommendation:</b>", styles['Heading3']))
    story.append(Paragraph(screening.recommendation, normal_style))
    story.append(Spacer(1, 12))
    
    # Images
    if screening.image_path and os.path.exists(screening.image_path) and screening.heatmap_path and os.path.exists(screening.heatmap_path):
        story.append(Paragraph("<b>Images:</b>", styles['Heading3']))
        # Table with original and heatmap
        img_orig = RLImage(screening.image_path, width=200, height=200)
        img_heat = RLImage(screening.heatmap_path, width=200, height=200)
        
        data = [[img_orig, img_heat], ["Original Image", "AI Attention Map"]]
        t = Table(data)
        t.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 12))
        
    disclaimer = """<b>Disclaimer:</b> AI-assisted screening result. Not a definitive medical diagnosis. 
    Final clinical assessment must be performed by an appropriately qualified healthcare professional."""
    story.append(Paragraph(disclaimer, styles['Italic']))
    
    doc.build(story)
    
    return file_path
