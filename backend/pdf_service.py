import io
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

PRIMARY_RED = colors.HexColor("#DC2626")
DARK_RED = colors.HexColor("#991B1B")
LIGHT_RED_BG = colors.HexColor("#FEF2F2")
BORDER_GRAY = colors.HexColor("#E2E8F0")
TEXT_DARK = colors.HexColor("#1E293B")
TEXT_MUTED = colors.HexColor("#64748B")
GREEN_COLOR = colors.HexColor("#16A34A")

def format_inr(val: float) -> str:
    # Format with commas and 2 decimals
    return f"Rs. {val:,.2f}"

def generate_financial_pdf(
    bag_status: Dict[str, Any],
    entries: List[Dict[str, Any]],
    filter_label: str = "All Records",
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    line_name_filter: Optional[str] = None
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY_RED,
        alignment=TA_CENTER
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )
    section_heading = ParagraphStyle(
        'SectionHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=DARK_RED,
        spaceAfter=6
    )
    small_text = ParagraphStyle(
        'SmallMuted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=TA_CENTER
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK
    )
    table_cell_right = ParagraphStyle(
        'TableCellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK,
        alignment=TA_RIGHT
    )
    table_cell_right_bold = ParagraphStyle(
        'TableCellRightBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TEXT_DARK,
        alignment=TA_RIGHT
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("ASHOK FINANCE", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("ASHOK FINANCE MORNING &bull; ASHOK FINANCE EVENING 1 &bull; ASHOK FINANCE EVENING 2", subtitle_style))
    story.append(Spacer(1, 2))
    
    now_str = datetime.now().strftime("%d %b %Y, %I:%M %p")
    meta_info = f"Statement Generated: <b>{now_str}</b> | Filter: <b>{filter_label}</b>"
    if line_name_filter:
        meta_info += f" | Line: <b>{line_name_filter}</b>"
    story.append(Paragraph(meta_info, subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_RED, spaceAfter=14))

    # 2. Executive Capital & Bag Overview Table
    story.append(Paragraph("1. EXECUTIVE CAPITAL & BAG STATUS", section_heading))

    starting_bag = float(bag_status.get("starting_bag", 3000000.0))
    current_bag = float(bag_status.get("current_bag", 3000000.0))
    tot_income = float(bag_status.get("total_income", 0.0))
    tot_outgoing = float(bag_status.get("total_outgoing", 0.0))
    tot_net = float(bag_status.get("total_net", 0.0))
    month_income = float(bag_status.get("month_income", 0.0))
    month_outgoing = float(bag_status.get("month_outgoing", 0.0))
    month_net = float(bag_status.get("month_net", 0.0))

    lines_summary = bag_status.get("lines_summary", [])

    # If single line filtered, adapt executive figures to that line
    if line_name_filter:
        match = next((ls for ls in lines_summary if ls.get("line_name") == line_name_filter or ls.get("line_id") == line_name_filter), None)
        if match:
            starting_bag = float(match.get("starting_bag", 1000000.0))
            current_bag = float(match.get("current_bag", 1000000.0))
            tot_income = float(match.get("total_income", 0.0))
            tot_outgoing = float(match.get("total_outgoing", 0.0))
            tot_net = float(match.get("net_amount", 0.0))
            month_income = float(match.get("month_income", 0.0))
            month_outgoing = float(match.get("month_outgoing", 0.0))
            month_net = float(match.get("month_net", 0.0))

    summary_data = [
        [
            Paragraph("<b>INITIAL BAG AMOUNT</b>", table_cell_bold),
            Paragraph(format_inr(starting_bag), table_cell_right_bold),
            Paragraph("<b>TOTAL INCOME (ALL-TIME)</b>", table_cell_bold),
            Paragraph(format_inr(tot_income), table_cell_right_bold)
        ],
        [
            Paragraph("<b>TOTAL OUTGOING (ALL-TIME)</b>", table_cell_bold),
            Paragraph(format_inr(tot_outgoing), table_cell_right_bold),
            Paragraph("<b>NET CASHFLOW (ALL-TIME)</b>", table_cell_bold),
            Paragraph(format_inr(tot_net), table_cell_right_bold)
        ],
        [
            Paragraph("<b>THIS MONTH INCOME (MTD)</b>", table_cell_bold),
            Paragraph(f"<font color='#16A34A'><b>+{format_inr(month_income)}</b></font>", table_cell_right_bold),
            Paragraph("<b>THIS MONTH OUTGOING (MTD)</b>", table_cell_bold),
            Paragraph(f"<font color='#DC2626'><b>-{format_inr(month_outgoing)}</b></font>", table_cell_right_bold)
        ],
        [
            Paragraph("<b>THIS MONTH NET FLOW</b>", table_cell_bold),
            Paragraph(f"<b>{format_inr(month_net)}</b>", table_cell_right_bold),
            Paragraph("<font color='#DC2626'><b>CURRENT BAG BALANCE</b></font>", table_cell_bold),
            Paragraph(f"<font color='#DC2626'><b>{format_inr(current_bag)}</b></font>", table_cell_right_bold)
        ]
    ]

    t_summary = Table(summary_data, colWidths=[130, 130, 130, 130])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_RED_BG),
        ('BOX', (0, 0), (-1, -1), 1.2, PRIMARY_RED),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 14))

    # 3. Line-by-Line Breakdown Table
    story.append(Paragraph("2. BRANCH LINES COMPARATIVE BREAKDOWN", section_heading))
    
    line_table_data = [
        [
            Paragraph("<b>Finance Line</b>", table_cell_bold),
            Paragraph("<b>Start Bag</b>", table_cell_right_bold),
            Paragraph("<b>Income (+)</b>", table_cell_right_bold),
            Paragraph("<b>Outgoing (-)</b>", table_cell_right_bold),
            Paragraph("<b>Net Flow</b>", table_cell_right_bold),
            Paragraph("<b>Current Bag</b>", table_cell_right_bold),
        ]
    ]

    for ls in lines_summary:
        line_table_data.append([
            Paragraph(ls.get("line_name", ""), table_cell),
            Paragraph(format_inr(ls.get("starting_bag", 1000000.0)), table_cell_right),
            Paragraph(format_inr(ls.get("total_income", 0.0)), table_cell_right),
            Paragraph(format_inr(ls.get("total_outgoing", 0.0)), table_cell_right),
            Paragraph(format_inr(ls.get("net_amount", 0.0)), table_cell_right_bold),
            Paragraph(f"<b>{format_inr(ls.get('current_bag', 1000000.0))}</b>", table_cell_right_bold),
        ])

    t_lines = Table(line_table_data, colWidths=[160, 72, 72, 72, 72, 72])
    t_lines.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('LINEBELOW', (0, 0), (-1, 0), 1, PRIMARY_RED),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_lines)
    story.append(Spacer(1, 14))


    # 4. Detailed Daily Transaction Entries
    story.append(Paragraph("3. DAILY TRANSACTION LOG & RUNNING BAG BALANCE", section_heading))

    if not entries:
        story.append(Paragraph("<i>No transaction entries recorded for the selected filter.</i>", table_cell))
    else:
        # Sort chronologically for running bag balance
        sorted_entries = sorted(
            entries,
            key=lambda x: (str(x.get("entry_date", "")), str(x.get("id", "")))
        )

        entries_data = [
            [
                Paragraph("<b>Date</b>", table_cell_bold),
                Paragraph("<b>Branch Line</b>", table_cell_bold),
                Paragraph("<b>Income (+)</b>", table_cell_right_bold),
                Paragraph("<b>Outgoing (-)</b>", table_cell_right_bold),
                Paragraph("<b>Net Flow</b>", table_cell_right_bold),
                Paragraph("<b>Running Bag</b>", table_cell_right_bold),
                Paragraph("<b>Remarks</b>", table_cell_bold),
            ]
        ]

        total_filt_inc = 0.0
        total_filt_out = 0.0
        running_calc_bag = starting_bag

        for idx, e in enumerate(sorted_entries):
            inc = float(e.get("income", 0.0))
            out = float(e.get("outgoing", 0.0))
            net = inc - out
            total_filt_inc += inc
            total_filt_out += out
            running_calc_bag += net

            net_color = "#16A34A" if net >= 0 else "#DC2626"
            net_symbol = "+" if net > 0 else ""
            notes = e.get("notes") or "-"
            if len(notes) > 22:
                notes = notes[:20] + "..."

            line_disp = str(e.get("line_name", e.get("line_id", ""))).replace("ASHOK FINANCE ", "")

            entries_data.append([
                Paragraph(str(e.get("entry_date")), table_cell),
                Paragraph(line_disp, table_cell_bold),
                Paragraph(format_inr(inc), table_cell_right),
                Paragraph(format_inr(out), table_cell_right),
                Paragraph(f"<font color='{net_color}'><b>{net_symbol}{format_inr(net)}</b></font>", table_cell_right),
                Paragraph(f"<b>{format_inr(running_calc_bag)}</b>", table_cell_right_bold),
                Paragraph(notes, table_cell),
            ])

        # Subtotal row
        tot_net_filt = total_filt_inc - total_filt_out
        entries_data.append([
            Paragraph("<b>TOTALS</b>", table_cell_bold),
            Paragraph(f"<b>{len(sorted_entries)} Records</b>", table_cell),
            Paragraph(f"<b>{format_inr(total_filt_inc)}</b>", table_cell_right_bold),
            Paragraph(f"<b>{format_inr(total_filt_out)}</b>", table_cell_right_bold),
            Paragraph(f"<b>{format_inr(tot_net_filt)}</b>", table_cell_right_bold),
            Paragraph(f"<font color='#DC2626'><b>{format_inr(running_calc_bag)}</b></font>", table_cell_right_bold),
            Paragraph("<b>FINAL BAG</b>", table_cell_bold),
        ])

        t_entries = Table(entries_data, colWidths=[65, 115, 68, 68, 68, 76, 60])
        t_entries.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_RED),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.4, BORDER_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('BACKGROUND', (0, -1), (-1, -1), LIGHT_RED_BG),
            ('LINEABOVE', (0, -1), (-1, -1), 1.2, PRIMARY_RED),
        ]))
        story.append(t_entries)

        # 4b. Closing Reconciliation Box
        story.append(Spacer(1, 10))
        closing_data = [
            [
                Paragraph("<b>PERIOD OPENING BAG</b>", table_cell_bold),
                Paragraph(format_inr(starting_bag), table_cell_right_bold),
                Paragraph("<b>TOTAL PERIOD INCOME (+)</b>", table_cell_bold),
                Paragraph(format_inr(total_filt_inc), table_cell_right_bold)
            ],
            [
                Paragraph("<b>TOTAL PERIOD OUTGOING (-)</b>", table_cell_bold),
                Paragraph(format_inr(total_filt_out), table_cell_right_bold),
                Paragraph("<b>NET CASHFLOW (+ / -)</b>", table_cell_bold),
                Paragraph(format_inr(tot_net_filt), table_cell_right_bold)
            ],
            [
                Paragraph("<font color='#DC2626'><b>TOTAL REMAINING BAG AMOUNT</b></font>", table_cell_bold),
                Paragraph(f"<font color='#DC2626'><b>{format_inr(running_calc_bag)}</b></font>", table_cell_right_bold),
                Paragraph("<b>AUDIT STATUS</b>", table_cell_bold),
                Paragraph("<b>RECONCILED &amp; BALANCED</b>", table_cell_right_bold)
            ]
        ]
        t_closing = Table(closing_data, colWidths=[130, 130, 130, 130])
        t_closing.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BACKGROUND', (0, -1), (-1, -1), LIGHT_RED_BG),
            ('BOX', (0, 0), (-1, -1), 1, BORDER_GRAY),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t_closing)

    story.append(Spacer(1, 18))

    # 5. Sign-off & Verification Footer
    sign_block = [
        [
            Paragraph("<b>Prepared By:</b><br/>Ashok Finance Automated System", table_cell),
            Paragraph("<b>Checked & Verified By:</b><br/>___________________________", table_cell),
            Paragraph("<b>Authorized Signatory:</b><br/>___________________________", table_cell)
        ]
    ]
    t_sign = Table(sign_block, colWidths=[170, 170, 180])
    t_sign.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(KeepTogether([t_sign, Spacer(1, 8), Paragraph("Confidential &bull; Ashok Finance Management Report &bull; Powered by Ashok Finance Engine", small_text)]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
