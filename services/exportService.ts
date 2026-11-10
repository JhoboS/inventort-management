import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Employee, Assignment, Product } from '../types';

/**
 * Exports currently held assets for an employee as an Excel spreadsheet (.xlsx)
 */
export const exportEmployeeAssetsToExcel = (
  employee: Employee,
  assignments: Assignment[],
  products: Product[]
): void => {
  const activeAssignments = assignments.filter(
    a => a.employeeId === employee.id && a.status === 'Active'
  );

  const totalUnits = activeAssignments.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  
  let totalValuation = 0;
  const rows = activeAssignments.map((assign, index) => {
    const prod = products.find(p => p.id === assign.productId || p.name === assign.productName);
    const unitPrice = prod?.price ?? 0;
    const itemTotal = (Number(assign.quantity) || 0) * unitPrice;
    totalValuation += itemTotal;

    return {
      'No.': index + 1,
      'Asset Name (EN)': assign.productName,
      'Asset Name (CN)': assign.productNameZh || prod?.nameZh || '',
      'SKU': prod?.sku || 'N/A',
      'Category': prod?.category || 'General',
      'Quantity': assign.quantity,
      'Unit Price ($)': Number(unitPrice.toFixed(2)),
      'Total Value ($)': Number(itemTotal.toFixed(2)),
      'Assigned Date': new Date(assign.assignedDate).toLocaleDateString(),
      'Status': assign.status,
      'Issued By': assign.performedBy || 'System'
    };
  });

  // Build Excel Workbook
  const wb = XLSX.utils.book_new();

  // Create custom header structure
  const headerData = [
    ['GREAT RIVER STOCK MANAGEMENT - EMPLOYEE ASSET CUSTODY REPORT'],
    [`Employee: ${employee.name}`, `Department: ${employee.department}`, `Role: ${employee.role}`, `Email: ${employee.email}`],
    [`Generated: ${new Date().toLocaleString()}`, `Active Items: ${activeAssignments.length}`, `Total Units: ${totalUnits}`, `Total Valuation: $${totalValuation.toFixed(2)}`],
    [], // empty row separator
  ];

  const ws = XLSX.utils.aoa_to_sheet(headerData);

  // Append items table starting from row 5
  XLSX.utils.sheet_add_json(ws, rows, { origin: 'A5' });

  // Add summary row at the bottom
  const summaryRowIndex = 5 + rows.length + 1;
  XLSX.utils.sheet_add_aoa(ws, [
    ['TOTAL', '', '', '', '', totalUnits, '', Number(totalValuation.toFixed(2)), '', '', '']
  ], { origin: `A${summaryRowIndex}` });

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // No.
    { wch: 28 }, // Asset Name EN
    { wch: 20 }, // Asset Name CN
    { wch: 16 }, // SKU
    { wch: 16 }, // Category
    { wch: 10 }, // Quantity
    { wch: 14 }, // Unit Price
    { wch: 14 }, // Total Value
    { wch: 16 }, // Assigned Date
    { wch: 12 }, // Status
    { wch: 16 }, // Issued By
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Assigned Assets');

  // Trigger download
  const sanitizedName = employee.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${sanitizedName}_Asset_List_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Loads an image safely without throwing CORS errors
 */
const loadImageSafely = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    // Timeout after 800ms to avoid blocking PDF generation
    setTimeout(() => resolve(null), 800);
    img.src = url;
  });
};

/**
 * Generates and downloads an official Employee Asset Custody PDF Handover Slip
 * Using a high-resolution Canvas renderer to guarantee perfect rendering of
 * Chinese characters, tables, borders, and signature blocks.
 */
export const exportEmployeeAssetsToPdf = async (
  employee: Employee,
  assignments: Assignment[],
  products: Product[]
): Promise<void> => {
  const activeAssignments = assignments.filter(
    a => a.employeeId === employee.id && a.status === 'Active'
  );

  const totalUnits = activeAssignments.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0);
  const totalValuation = activeAssignments.reduce((sum, a) => {
    const prod = products.find(p => p.id === a.productId || p.name === a.productName);
    return sum + (Number(a.quantity) || 0) * (prod?.price ?? 0);
  }, 0);

  // Setup Canvas Dimensions (A4 aspect ratio: ~1200 x 1700 at 2x resolution)
  const canvas = document.createElement('canvas');
  const width = 1200;
  
  // Calculate height dynamically
  const headerHeight = 310;
  const tableHeaderHeight = 44;
  const rowHeight = 48;
  const rowsHeight = Math.max(1, activeAssignments.length) * rowHeight;
  const footerHeight = 360;
  const minHeight = 1697; // A4 standard 1200 * (842/595)
  const totalContentHeight = headerHeight + tableHeaderHeight + rowsHeight + footerHeight;
  const height = Math.max(minHeight, totalContentHeight);

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }

  // 1. Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative Top Header Bar
  ctx.fillStyle = '#1E3A8A'; // Deep blue
  ctx.fillRect(0, 0, width, 14);

  const margin = 60;
  const contentWidth = width - margin * 2;
  let currentY = 55;

  // 3. Organization & Document Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('GREAT RIVER STOCK MANAGEMENT', margin, currentY);

  ctx.fillStyle = '#2563EB';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('OFFICIAL ASSET CUSTODY STATEMENT / 员工资产领用与保管清单', margin, currentY + 26);

  // Date and Doc ID on right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748B';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, width - margin, currentY);
  ctx.fillText(`Doc ID: GR-AST-${Date.now().toString().slice(-6)}`, width - margin, currentY + 22);
  ctx.textAlign = 'left';

  currentY += 65;

  // Horizontal divider
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin, currentY);
  ctx.lineTo(width - margin, currentY);
  ctx.stroke();

  currentY += 25;

  // 4. Employee Information Card
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(margin, currentY, contentWidth, 120);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.strokeRect(margin, currentY, contentWidth, 120);

  // Avatar / Badge
  ctx.fillStyle = '#3B82F6';
  ctx.beginPath();
  ctx.arc(margin + 45, currentY + 60, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(employee.name.charAt(0).toUpperCase(), margin + 45, currentY + 69);
  ctx.textAlign = 'left';

  // Details
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(employee.name, margin + 95, currentY + 42);

  ctx.fillStyle = '#475569';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(`Department: ${employee.department}   |   Role: ${employee.role}`, margin + 95, currentY + 70);
  ctx.fillText(`Email: ${employee.email}`, margin + 95, currentY + 95);

  // Summary Badges on right side of card
  const badgeX = width - margin - 230;
  ctx.fillStyle = '#EEF2FF';
  ctx.fillRect(badgeX, currentY + 20, 210, 38);
  ctx.strokeStyle = '#C7D2FE';
  ctx.strokeRect(badgeX, currentY + 20, 210, 38);
  ctx.fillStyle = '#4338CA';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`Active Items: ${totalUnits} Units`, badgeX + 15, currentY + 44);

  ctx.fillStyle = '#ECFDF5';
  ctx.fillRect(badgeX, currentY + 66, 210, 38);
  ctx.strokeStyle = '#A7F3D0';
  ctx.strokeRect(badgeX, currentY + 66, 210, 38);
  ctx.fillStyle = '#065F46';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`Total Value: $${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, badgeX + 15, currentY + 90);

  currentY += 150;

  // 5. Assets Table Header
  const colX = {
    num: margin + 12,
    thumb: margin + 50,
    asset: margin + 105,
    sku: margin + 450,
    category: margin + 600,
    qty: margin + 740,
    unitPrice: margin + 830,
    totalPrice: margin + 940,
    assignedDate: margin + 1045,
  };

  ctx.fillStyle = '#0F172A';
  ctx.fillRect(margin, currentY, contentWidth, tableHeaderHeight);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('#', colX.num, currentY + 27);
  ctx.fillText('ITEM', colX.thumb, currentY + 27);
  ctx.fillText('ASSET NAME / DESCRIPTION', colX.asset, currentY + 27);
  ctx.fillText('SKU', colX.sku, currentY + 27);
  ctx.fillText('CATEGORY', colX.category, currentY + 27);
  ctx.fillText('QTY', colX.qty, currentY + 27);
  ctx.fillText('UNIT PRICE', colX.unitPrice, currentY + 27);
  ctx.fillText('TOTAL VAL', colX.totalPrice, currentY + 27);
  ctx.fillText('ASSIGNED', colX.assignedDate, currentY + 27);

  currentY += tableHeaderHeight;

  // Pre-load images if any
  const images = await Promise.all(
    activeAssignments.map(a => {
      const prod = products.find(p => p.id === a.productId || p.name === a.productName);
      return prod?.imageUrl ? loadImageSafely(prod.imageUrl) : Promise.resolve(null);
    })
  );

  // 6. Assets Table Rows
  if (activeAssignments.length === 0) {
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(margin, currentY, contentWidth, 70);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(margin, currentY, contentWidth, 70);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No active assets currently assigned to this employee. / 该员工名下当前无领用资产。', width / 2, currentY + 42);
    ctx.textAlign = 'left';
    currentY += 70;
  } else {
    activeAssignments.forEach((assign, index) => {
      const prod = products.find(p => p.id === assign.productId || p.name === assign.productName);
      const unitPrice = prod?.price ?? 0;
      const itemTotal = (Number(assign.quantity) || 0) * unitPrice;

      // Alternating row background
      ctx.fillStyle = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      ctx.fillRect(margin, currentY, contentWidth, rowHeight);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin, currentY + rowHeight);
      ctx.lineTo(width - margin, currentY + rowHeight);
      ctx.stroke();

      // Index
      ctx.fillStyle = '#64748B';
      ctx.font = '13px sans-serif';
      ctx.fillText(String(index + 1), colX.num, currentY + 29);

      // Thumbnail Image or fallback
      const img = images[index];
      const thumbBoxSize = 34;
      const thumbY = currentY + 7;
      if (img) {
        try {
          ctx.drawImage(img, colX.thumb, thumbY, thumbBoxSize, thumbBoxSize);
          ctx.strokeStyle = '#CBD5E1';
          ctx.strokeRect(colX.thumb, thumbY, thumbBoxSize, thumbBoxSize);
        } catch {
          // If tainted or failed
          drawFallbackThumbnail(ctx, colX.thumb, thumbY, thumbBoxSize);
        }
      } else {
        drawFallbackThumbnail(ctx, colX.thumb, thumbY, thumbBoxSize);
      }

      // Name EN & CN
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      const maxNameWidth = 330;
      const truncatedEn = truncateText(ctx, assign.productName, maxNameWidth);
      ctx.fillText(truncatedEn, colX.asset, currentY + 22);

      const cnName = assign.productNameZh || prod?.nameZh || '';
      if (cnName) {
        ctx.fillStyle = '#64748B';
        ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
        const truncatedCn = truncateText(ctx, cnName, maxNameWidth);
        ctx.fillText(truncatedCn, colX.asset, currentY + 38);
      }

      // SKU
      ctx.fillStyle = '#475569';
      ctx.font = '12px Courier, monospace';
      ctx.fillText(prod?.sku || '-', colX.sku, currentY + 29);

      // Category
      ctx.fillStyle = '#334155';
      ctx.font = '12px sans-serif';
      ctx.fillText(prod?.category || 'General', colX.category, currentY + 29);

      // Quantity
      ctx.fillStyle = '#2563EB';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(String(assign.quantity), colX.qty, currentY + 29);

      // Unit Price
      ctx.fillStyle = '#475569';
      ctx.font = '12px sans-serif';
      ctx.fillText(`$${unitPrice.toFixed(2)}`, colX.unitPrice, currentY + 29);

      // Total Value
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`$${itemTotal.toFixed(2)}`, colX.totalPrice, currentY + 29);

      // Assigned Date
      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(new Date(assign.assignedDate).toLocaleDateString(), colX.assignedDate, currentY + 29);

      currentY += rowHeight;
    });

    // 7. Summary Row
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(margin, currentY, contentWidth, 42);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(margin, currentY, contentWidth, 42);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('TOTAL ACTIVE CUSTODY', colX.asset, currentY + 26);

    ctx.fillStyle = '#1D4ED8';
    ctx.fillText(String(totalUnits), colX.qty, currentY + 26);

    ctx.fillStyle = '#047857';
    ctx.fillText(`$${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colX.totalPrice, currentY + 26);

    currentY += 60;
  }

  currentY += 20;

  // 8. Custody Agreement & Legal Undertaking Box
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(margin, currentY, contentWidth, 110);
  ctx.strokeStyle = '#E2E8F0';
  ctx.strokeRect(margin, currentY, contentWidth, 110);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('CUSTODIAN ACKNOWLEDGMENT & UNDERTAKING / 资产保管承诺与责任确认', margin + 20, currentY + 28);

  ctx.fillStyle = '#64748B';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('1. The employee acknowledges receipt of the company property listed above in good working condition and agrees to exercise reasonable care.', margin + 20, currentY + 50);
  ctx.fillText('2. Assets must be returned in full upon department transfer, resignation, or termination of employment. Loss or damage due to negligence must be reported immediately.', margin + 20, currentY + 68);
  ctx.fillText('本人确认已全数核对并领用上述完好无损的资产，承诺妥善保管并仅用于公司日常公务，在离职或调岗时全数归还。如有损坏或遗失将及时上报处理。', margin + 20, currentY + 90);

  currentY += 140;

  // 9. Signatures Block
  const sigBoxWidth = (contentWidth - 60) / 2;

  // Employee Signature Box
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.strokeRect(margin, currentY, sigBoxWidth, 120);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('EMPLOYEE SIGNATURE / 领用人签字', margin + 18, currentY + 30);

  ctx.strokeStyle = '#94A3B8';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(margin + 18, currentY + 85);
  ctx.lineTo(margin + sigBoxWidth - 18, currentY + 85);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64748B';
  ctx.font = '11px sans-serif';
  ctx.fillText(`Signed by: ${employee.name}`, margin + 18, currentY + 104);
  ctx.fillText('Date: ________________', margin + sigBoxWidth - 140, currentY + 104);

  // Manager / Custodian Signature Box
  const managerX = margin + sigBoxWidth + 60;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.strokeRect(managerX, currentY, sigBoxWidth, 120);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText('ASSET CONTROLLER / 库管发料人签字', managerX + 18, currentY + 30);

  ctx.strokeStyle = '#94A3B8';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(managerX + 18, currentY + 85);
  ctx.lineTo(managerX + sigBoxWidth - 18, currentY + 85);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64748B';
  ctx.font = '11px sans-serif';
  ctx.fillText('Authorized Signature: ________________', managerX + 18, currentY + 104);
  ctx.fillText('Date: ________________', managerX + sigBoxWidth - 140, currentY + 104);

  // 10. Footer
  currentY += 150;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Great River Stock Management System • Official Confidential Handover Slip • Page 1 of 1', width / 2, currentY);
  ctx.textAlign = 'left';

  // 11. Convert Canvas to PDF via jsPDF
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (height * pdfWidth) / width;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  const sanitizedName = employee.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  pdf.save(`${sanitizedName}_Asset_Handover_${dateStr}.pdf`);
};

/**
 * Draws a neat fallback box when an asset has no image
 */
const drawFallbackThumbnail = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#CBD5E1';
  ctx.strokeRect(x, y, size, size);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📦', x + size / 2, y + size / 2 + 4);
  ctx.textAlign = 'left';
};

/**
 * Truncates text with ellipsis if it exceeds max width
 */
const truncateText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
};
