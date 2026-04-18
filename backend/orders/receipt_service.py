import os
import io
from datetime import datetime
from django.conf import settings
from django.http import FileResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


def generate_order_receipt(order):
    """Generate PDF receipt for an order"""
    buffer = io.BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Container for elements
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#ec4899'),
        spaceAfter=30,
        alignment=1  # Center
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=12
    )
    
    # Logo/Title
    elements.append(Paragraph("✨ GLOW BEYOND BEAUTY ✨", title_style))
    elements.append(Paragraph("Official Receipt", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Order Info
    order_info = [
        ["Order Number:", order.order_number],
        ["Date:", order.created_at.strftime('%B %d, %Y at %H:%M')],
        ["Status:", order.status.upper()],
        ["Customer:", order.customer_name],
        ["Email:", order.customer_email],
        ["Phone:", order.customer_phone or 'N/A'],
    ]
    
    order_table = Table(order_info, colWidths=[2*inch, 4*inch])
    order_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(order_table)
    elements.append(Spacer(1, 20))
    
    # Shipping Address
    elements.append(Paragraph("Shipping Address:", heading_style))
    elements.append(Paragraph(order.shipping_address.replace('\n', '<br/>'), styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Items Table
    elements.append(Paragraph("Order Items:", heading_style))
    
    items_data = [['Product', 'Qty', 'Unit Price', 'Total']]
    for item in order.items.all():
        items_data.append([
            item.product.name,
            str(item.quantity),
            f"KSh {item.unit_price:,.2f}",
            f"KSh {item.total_price:,.2f}"
        ])
    
    # Add totals
    items_data.append(['', '', '', ''])
    items_data.append(['', '', 'Subtotal:', f"KSh {order.subtotal:,.2f}"])
    items_data.append(['', '', f"Tax (8%):", f"KSh {order.tax_amount:,.2f}"])
    items_data.append(['', '', 'Shipping:', f"KSh {order.shipping_cost:,.2f}"])
    items_data.append(['', '', 'TOTAL:', f"KSh {order.total_amount:,.2f}"])
    
    items_table = Table(items_data, colWidths=[3*inch, 0.8*inch, 1.1*inch, 1.1*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#374151')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -6), colors.white),
        ('ALIGN', (1, 1), (1, -6), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -6), 'RIGHT'),
        ('FONTNAME', (0, -4), (-1, -4), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.HexColor('#ec4899')),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
        ('ALIGN', (2, -4), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (2, -4), (-1, -4), 1, colors.gray),
        ('LINEABOVE', (2, -1), (-1, -1), 2, colors.HexColor('#ec4899')),
        ('GRID', (0, 0), (-1, -6), 1, colors.HexColor('#e5e7eb')),
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 30))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.gray,
        alignment=1
    )
    elements.append(Paragraph("Thank you for shopping with Glow Beyond Beauty!", footer_style))
    elements.append(Paragraph("For questions about your order, contact support@glowbeyond.com", footer_style))
    elements.append(Paragraph(f"Receipt generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}", footer_style))
    
    # Build PDF
    doc.build(elements)
    
    # Get the value of the BytesIO buffer
    pdf = buffer.getvalue()
    buffer.close()
    
    return pdf


def get_receipt_response(order):
    """Generate and return PDF receipt as HTTP response"""
    pdf = generate_order_receipt(order)
    
    response = FileResponse(
        io.BytesIO(pdf),
        content_type='application/pdf',
        as_attachment=True,
        filename=f"receipt_{order.order_number}.pdf"
    )
    
    return response
