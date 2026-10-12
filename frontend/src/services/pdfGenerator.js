import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatINRRaw = (amount) => {
  const num = Number(amount) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const generateClientPDF = ({
  bagStatus,
  entries,
  activeLineName = 'All Lines Combined',
  dateFilterLabel = 'All Dates'
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const primaryRed = [220, 38, 38]; // #DC2626
  const darkRed = [153, 27, 27];    // #991B1B
  const lightRedBg = [254, 242, 242]; // #FEF2F2
  const textDark = [30, 41, 59];
  const textMuted = [100, 116, 139];

  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. Header Banner
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 8, 'F'); // Red accent line at top

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryRed);
  doc.text('ASHOK FINANCE', pageWidth / 2, 40, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...textMuted);
  doc.text('ASHOK FINANCE MORNING  •  ASHOK FINANCE EVENING 1  •  ASHOK FINANCE EVENING 2', pageWidth / 2, 54, { align: 'center' });

  const generatedDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.setFontSize(8.5);
  doc.text(`Generated: ${generatedDate}  |  Branch: ${activeLineName}  |  Period: ${dateFilterLabel}`, pageWidth / 2, 68, { align: 'center' });

  // Divider
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(1.5);
  doc.line(36, 76, pageWidth - 36, 76);

  // 2. Capital & Bag Summary Box
  const startingBag = Number(bagStatus?.starting_bag) || 1000000;
  const currentBag = Number(bagStatus?.current_bag) || 1000000;
  const totalIncome = Number(bagStatus?.total_income) || 0;
  const totalOutgoing = Number(bagStatus?.total_outgoing) || 0;
  const totalNet = Number(bagStatus?.total_net) || (totalIncome - totalOutgoing);

  doc.autoTable({
    startY: 88,
    margin: { left: 36, right: 36 },
    head: [['1. EXECUTIVE CAPITAL & BAG STATUS', 'AMOUNT (INR)', 'METRIC', 'AMOUNT (INR)']],
    body: [
      [
        'Initial Starting Bag Capital',
        formatINRRaw(startingBag),
        'Total Income (+)',
        formatINRRaw(totalIncome)
      ],
      [
        'Total Outgoing (-)',
        formatINRRaw(totalOutgoing),
        'Net Cashflow (+ / -)',
        formatINRRaw(totalNet)
      ],
      [
        'CURRENT BAG BALANCE',
        formatINRRaw(currentBag),
        'Total Recorded Entries',
        `${entries.length} Records`
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: darkRed,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: textDark,
      cellPadding: 4.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 150 },
      1: { halign: 'right', fontStyle: 'bold' },
      2: { fontStyle: 'bold', cellWidth: 140 },
      3: { halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: {
      fillColor: lightRedBg,
    }
  });

  // 3. Lines Breakdown Summary
  const linesSummary = bagStatus?.lines_summary || [];
  const linesBody = linesSummary.map((l) => [
    l.line_name || l.line_id,
    `${l.entries_count || 0}`,
    formatINRRaw(l.total_income || 0),
    formatINRRaw(l.total_outgoing || 0),
    formatINRRaw(l.net_amount || 0)
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 12,
    margin: { left: 36, right: 36 },
    head: [['2. BRANCH LINE BREAKDOWN', 'ENTRIES', 'TOTAL INCOME (+)', 'TOTAL OUTGOING (-)', 'NET IMPACT']],
    body: linesBody.length ? linesBody : [['All Lines Combined', `${entries.length}`, formatINRRaw(totalIncome), formatINRRaw(totalOutgoing), formatINRRaw(totalNet)]],
    theme: 'grid',
    headStyles: {
      fillColor: primaryRed,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textDark,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // 4. Detailed Daily Transactions Log
  const entriesBody = entries.map((e) => {
    const inc = Number(e.income) || 0;
    const out = Number(e.outgoing) || 0;
    const net = inc - out;
    const netSign = net > 0 ? '+' : '';
    return [
      e.entry_date,
      e.line_name || e.line_id,
      formatINRRaw(inc),
      formatINRRaw(out),
      `${netSign}${formatINRRaw(net)}`,
      e.notes || '-'
    ];
  });

  // Calculate filtered totals
  let filteredInc = 0;
  let filteredOut = 0;
  entries.forEach((e) => {
    filteredInc += Number(e.income) || 0;
    filteredOut += Number(e.outgoing) || 0;
  });
  const filteredNet = filteredInc - filteredOut;

  const totalRow = [
    'TOTALS',
    `${entries.length} Entries`,
    formatINRRaw(filteredInc),
    formatINRRaw(filteredOut),
    formatINRRaw(filteredNet),
    ''
  ];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 12,
    margin: { left: 36, right: 36 },
    head: [['DATE', 'BRANCH LINE', 'INCOME (+)', 'OUTGOING (-)', 'NET (IN - OUT)', 'REMARKS / NOTES']],
    body: [...entriesBody, totalRow],
    theme: 'striped',
    headStyles: {
      fillColor: darkRed,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textDark,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 140, fontStyle: 'bold' },
      2: { halign: 'right', cellWidth: 75 },
      3: { halign: 'right', cellWidth: 75 },
      4: { halign: 'right', cellWidth: 75, fontStyle: 'bold' },
      5: { cellWidth: 90 }
    },
    didParseCell: (data) => {
      // Highlight the totals row
      if (data.row.index === entriesBody.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = lightRedBg;
        data.cell.styles.textColor = primaryRed;
      }
    }
  });

  // 5. Sign-off Footer
  const finalY = doc.lastAutoTable.finalY + 28;
  const pageHeight = doc.internal.pageSize.getHeight();
  const signY = finalY > pageHeight - 60 ? pageHeight - 50 : finalY;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text('Prepared By: Ashok Finance Automated Ledger', 36, signY);
  doc.text('Verified By: _________________________', pageWidth / 2 - 40, signY);
  doc.text('Authorized Signatory: _________________________', pageWidth - 190, signY);

  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text('CONFIDENTIAL & PROPRIETARY  •  ASHOK FINANCE MANAGEMENT REPORT', pageWidth / 2, signY + 18, { align: 'center' });

  // Download
  const filename = `Ashok_Finance_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
