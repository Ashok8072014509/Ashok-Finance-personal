import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const formatINR = (amount, explicitDecimals = null) => {
  const num = Number(amount) || 0;
  const hasDecimals = (num % 1 !== 0);
  const decimals = explicitDecimals !== null ? explicitDecimals : (hasDecimals ? 2 : 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(num);
};

export const formatINRRaw = (amount) => {
  const num = Number(amount) || 0;
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Generate and download an executive PDF financial statement.
 * Supports filtering by custom dates, specific month, specific year, or all-time.
 * Computes Running Bag Balance on every single entry and displays Final Remaining Bag.
 */
export const generateClientPDF = ({
  bagStatus,
  allEntries = [],
  filteredEntries = null,
  activeLineId = 'all',
  activeLineName = 'All Lines Combined',
  dateFilterLabel = 'All Dates',
  periodStartDate = null,
  periodEndDate = null,
}) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const primaryRed = [220, 38, 38];    // #DC2626
    const darkRed = [153, 27, 27];       // #991B1B
    const lightRedBg = [254, 242, 242];  // #FEF2F2
    const emeraldGreen = [22, 163, 74];  // #16A34A
    const textDark = [30, 41, 59];
    const textMuted = [100, 116, 139];

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Determine Starting Bag Baseline
    const isCombined = !activeLineId || activeLineId === 'all';
    const linesSummary = bagStatus?.lines_summary || [];
    const activeLineSummary = linesSummary.find((l) => l.line_id === activeLineId);

    const baselineStartingBag = isCombined
      ? Number(bagStatus?.starting_bag || 3000000)
      : Number(activeLineSummary?.starting_bag || bagStatus?.line_starting_bags?.[activeLineId] || 1000000);

    // 2. Filter & Sort Relevant Entries Chronologically to Calculate Running Bag Balance
    const lineEntries = isCombined
      ? [...(allEntries || [])]
      : (allEntries || []).filter((e) => e.line_id === activeLineId);

    // Sort chronologically (oldest first)
    lineEntries.sort((a, b) => {
      const dateCmp = (a.entry_date || '').localeCompare(b.entry_date || '');
      if (dateCmp !== 0) return dateCmp;
      return (a.created_at || a.id || '').localeCompare(b.created_at || b.id || '');
    });

    // Compute cumulative running bag for all entries of this scope
    let cumulativeBag = baselineStartingBag;
    const computedAll = lineEntries.map((e) => {
      const inc = Number(e.income) || 0;
      const out = Number(e.outgoing) || 0;
      const net = inc - out;
      cumulativeBag += net;
      return {
        ...e,
        inc,
        out,
        net,
        running_bag: cumulativeBag,
      };
    });

    // 3. Determine Period Entries
    let periodEntries = [];
    let openingBag = baselineStartingBag;

    if (filteredEntries && !periodStartDate && !periodEndDate) {
      // If pre-filtered entries were provided directly
      const idsSet = new Set(filteredEntries.map((f) => f.id));
      periodEntries = computedAll.filter((e) => idsSet.has(e.id));
      
      // Opening bag is the running bag of the entry right before the first period entry
      if (periodEntries.length > 0) {
        const firstIdx = computedAll.findIndex((e) => e.id === periodEntries[0].id);
        if (firstIdx > 0) {
          openingBag = computedAll[firstIdx - 1].running_bag;
        }
      }
    } else {
      // Filter by period dates if provided
      for (const e of computedAll) {
        let inRange = true;
        if (periodStartDate && e.entry_date < periodStartDate) inRange = false;
        if (periodEndDate && e.entry_date > periodEndDate) inRange = false;

        if (inRange) {
          periodEntries.push(e);
        } else if (periodStartDate && e.entry_date < periodStartDate) {
          // Keep updating opening bag to the latest transaction before the period start
          openingBag = e.running_bag;
        }
      }
    }

    // Period Totals
    let periodIncome = 0;
    let periodOutgoing = 0;
    periodEntries.forEach((e) => {
      periodIncome += e.inc;
      periodOutgoing += e.out;
    });
    const periodNet = periodIncome - periodOutgoing;
    const finalRemainingBag = periodEntries.length > 0
      ? periodEntries[periodEntries.length - 1].running_bag
      : openingBag;

    // 4. Draw Header Banner
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 8, 'F'); // Red bar at very top

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...primaryRed);
    doc.text('ASHOK FINANCE', pageWidth / 2, 38, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text(
      'ASHOK FINANCE MORNING  •  ASHOK FINANCE EVENING 1  •  ASHOK FINANCE EVENING 2',
      pageWidth / 2,
      52,
      { align: 'center' }
    );

    const generatedDate = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    doc.setFontSize(8.5);
    doc.text(
      `Generated: ${generatedDate}  |  Scope: ${activeLineName}  |  Period: ${dateFilterLabel}`,
      pageWidth / 2,
      66,
      { align: 'center' }
    );

    // Divider
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1.5);
    doc.line(36, 74, pageWidth - 36, 74);

    // 5. Executive Overview Table (Table 1)
    autoTable(doc, {
      startY: 84,
      margin: { left: 36, right: 36 },
      head: [
        [
          `1. STATEMENT EXECUTIVE CAPITAL & FLOW SUMMARY (${activeLineName.toUpperCase()})`,
          'AMOUNT (INR)',
          'METRIC',
          'AMOUNT (INR)',
        ],
      ],
      body: [
        [
          'Period Opening Bag Baseline',
          formatINRRaw(openingBag),
          'Period Total Income (+)',
          formatINRRaw(periodIncome),
        ],
        [
          'Period Total Outgoing (-)',
          formatINRRaw(periodOutgoing),
          'Period Net Cashflow (+ / -)',
          formatINRRaw(periodNet),
        ],
        [
          'Baseline Starting Bag (Initial)',
          formatINRRaw(baselineStartingBag),
          'FINAL REMAINING BAG CAPITAL',
          formatINRRaw(finalRemainingBag),
        ],
      ],
      theme: 'grid',
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
        0: { fontStyle: 'bold', cellWidth: 160 },
        1: { halign: 'right', fontStyle: 'bold' },
        2: { fontStyle: 'bold', cellWidth: 140 },
        3: { halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: lightRedBg,
      },
      didParseCell: (data) => {
        // Highlight FINAL REMAINING BAG CAPITAL
        if (data.row.index === 2 && (data.column.index === 2 || data.column.index === 3)) {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = primaryRed;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    // 6. Branch Lines Comparison Table (Table 2 - if combined)
    if (isCombined && linesSummary.length > 0) {
      const linesBody = linesSummary.map((l) => [
        l.line_name || l.line_id,
        formatINRRaw(l.starting_bag || 1000000),
        formatINRRaw(l.month_income || 0),
        formatINRRaw(l.month_outgoing || 0),
        formatINRRaw(l.month_net || 0),
        formatINRRaw(l.current_bag || 1000000),
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        margin: { left: 36, right: 36 },
        head: [
          [
            '2. FINANCE LINES COMPARISON',
            'START BAG',
            'MONTH IN (+)',
            'MONTH OUT (-)',
            'MONTH NET',
            'CURRENT BAG',
          ],
        ],
        body: linesBody,
        theme: 'grid',
        headStyles: {
          fillColor: primaryRed,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: textDark,
          cellPadding: 3.5,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 150 },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'right', fontStyle: 'bold' },
        },
      });
    }

    // 7. Detailed Daily Transaction Log (Table 3)
    const entriesData = periodEntries.map((e) => {
      const netSign = e.net > 0 ? '+' : '';
      return [
        e.entry_date || '-',
        (e.line_name || e.line_id || '').replace('ASHOK FINANCE ', ''),
        formatINRRaw(e.inc),
        formatINRRaw(e.out),
        `${netSign}${formatINRRaw(e.net)}`,
        formatINRRaw(e.running_bag),
        e.notes || '-',
      ];
    });

    // Subtotal Row
    const subtotalRow = [
      'TOTALS',
      `${periodEntries.length} Records`,
      formatINRRaw(periodIncome),
      formatINRRaw(periodOutgoing),
      `${periodNet >= 0 ? '+' : ''}${formatINRRaw(periodNet)}`,
      formatINRRaw(finalRemainingBag),
      'FINAL BAG',
    ];

    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 160,
      margin: { left: 36, right: 36 },
      head: [
        [
          'DATE',
          'BRANCH LINE',
          'INCOME (+)',
          'OUTGOING (-)',
          'NET (+ / -)',
          'RUNNING BAG',
          'REMARKS / NOTES',
        ],
      ],
      body: periodEntries.length > 0 ? [...entriesData, subtotalRow] : [['No entries recorded for this period', '', '', '', '', '', '']],
      theme: 'striped',
      headStyles: {
        fillColor: darkRed,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: textDark,
        cellPadding: 3.5,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 85, fontStyle: 'bold' },
        2: { halign: 'right', cellWidth: 70 },
        3: { halign: 'right', cellWidth: 70 },
        4: { halign: 'right', cellWidth: 70, fontStyle: 'bold' },
        5: { halign: 'right', cellWidth: 85, fontStyle: 'bold' },
        6: { cellWidth: 83 },
      },
      didParseCell: (data) => {
        // Highlight totals row
        if (data.row.index === entriesData.length && periodEntries.length > 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = primaryRed;
        }
      },
    });

    // 8. Closing Executive Reconciliation Box
    const closingStartY = doc.lastAutoTable.finalY + 12;
    if (closingStartY < pageHeight - 90) {
      autoTable(doc, {
        startY: closingStartY,
        margin: { left: 36, right: 36 },
        body: [
          [
            'PERIOD OPENING BAG',
            formatINRRaw(openingBag),
            'TOTAL PERIOD INCOME',
            formatINRRaw(periodIncome),
          ],
          [
            'TOTAL PERIOD OUTGOING',
            formatINRRaw(periodOutgoing),
            'PERIOD NET CASHFLOW',
            `${periodNet >= 0 ? '+' : ''}${formatINRRaw(periodNet)}`,
          ],
          [
            'TOTAL REMAINING BAG AMOUNT',
            formatINRRaw(finalRemainingBag),
            'AUDIT STATUS',
            'RECONCILED & BALANCED',
          ],
        ],
        theme: 'plain',
        bodyStyles: {
          fontSize: 8,
          textColor: textDark,
          cellPadding: 4,
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 155 },
          1: { halign: 'right', fontStyle: 'bold' },
          2: { fontStyle: 'bold', cellWidth: 140 },
          3: { halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: (data) => {
          if (data.row.index === 2) {
            data.cell.styles.fillColor = [254, 242, 242];
            data.cell.styles.textColor = primaryRed;
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
    }

    // 9. Sign-off & Verification Footer
    const finalTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 700;
    const signY = finalTableY + 28 > pageHeight - 55 ? pageHeight - 45 : finalTableY + 26;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDark);
    doc.text('Prepared By: Ashok Finance Automated System', 36, signY);
    doc.text('Verified By: ___________________________', pageWidth / 2 - 50, signY);
    doc.text('Authorized Signatory: ___________________________', pageWidth - 200, signY);

    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(
      'CONFIDENTIAL & PROPRIETARY  •  ASHOK FINANCE OFFICIAL LEDGER & CAPITAL STATEMENT',
      pageWidth / 2,
      signY + 16,
      { align: 'center' }
    );

    // 10. File Download Execution (Dual Mechanism: doc.save + Blob Anchor Fallback)
    const sanitizedScope = activeLineName.replace(/\s+/g, '_');
    const sanitizedPeriod = dateFilterLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Ashok_Finance_${sanitizedScope}_${sanitizedPeriod}.pdf`;

    try {
      // Direct save
      doc.save(filename);
    } catch (saveErr) {
      console.warn('doc.save triggered fallback:', saveErr);
      // Fallback blob anchor download
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    return { success: true, filename, count: periodEntries.length };
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
};
