import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Employee, Assignment, Product } from '../types';
import { COMPANY_LOGO_BASE64 } from './logoData';

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
    ['GREAT RIVER NEW ENERGY SERVICE SpA - EMPLOYEE ASSET CUSTODY REPORT'],
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
const loadImageSafely = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    setTimeout(() => resolve(null), 1000);
    img.src = src;
  });
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

/**
 * Draws a neat fallback box when an asset has no image
 */
const drawFallbackThumbnail = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📦', x + size / 2, y + size / 2 + 5);
  ctx.textAlign = 'left';
};

/**
 * Column width configuration (Total width = 1080px between 60px margins on 1200px width page)
 * Note: Price and Valuation columns are removed per user request.
 * All 7 columns fit comfortably with zero overflow.
 */
const TABLE_COL_CONFIG = {
  num: { xOffset: 12, width: 50 },
  thumb: { xOffset: 50, width: 70 },
  asset: { xOffset: 120, width: 400 },
  sku: { xOffset: 520, width: 170 },
  category: { xOffset: 690, width: 150 },
  qty: { xOffset: 840, width: 100 },
  date: { xOffset: 940, width: 140 },
};

/**
 * Draws the company logo in the header at top right maintaining the exact aspect ratio from the template
 */
const drawHeaderLogo = (
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement | null,
  pageWidth: number,
  margin: number,
  topY: number
) => {
  // Logo aspect ratio is 872 x 96 (~9.083 : 1)
  const logoWidth = 360;
  const logoHeight = Math.round(logoWidth * (96 / 872)); // ~40px
  const logoX = pageWidth - margin - logoWidth;

  if (logoImg) {
    try {
      ctx.drawImage(logoImg, logoX, topY, logoWidth, logoHeight);
      return;
    } catch {
      // Fallback below
    }
  }

  // Pure canvas vector fallback matching template
  ctx.fillStyle = '#7AB800'; // Green from logo
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Great River New Energy Service SpA', pageWidth - margin, topY + 18);

  ctx.fillStyle = '#7AB800';
  ctx.fillRect(pageWidth - margin - logoWidth, topY + 23, logoWidth, 2);

  ctx.fillStyle = '#18181B';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Your Trusted Renewable Energy Service Provider', pageWidth - margin, topY + 37);
  ctx.textAlign = 'left';
};

/**
 * Draws the table header on any page
 */
const drawTableHeader = (
  ctx: CanvasRenderingContext2D,
  margin: number,
  contentWidth: number,
  currentY: number
): number => {
  const headerHeight = 38;

  // Dark charcoal slate header bar with subtle green bottom border
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(margin, currentY, contentWidth, headerHeight);

  ctx.fillStyle = '#7AB800';
  ctx.fillRect(margin, currentY + headerHeight - 2, contentWidth, 2);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';

  ctx.fillText('#', margin + TABLE_COL_CONFIG.num.xOffset, currentY + 24);
  ctx.fillText('PHOTO', margin + TABLE_COL_CONFIG.thumb.xOffset, currentY + 24);
  ctx.fillText('ASSET NAME / DESCRIPTION', margin + TABLE_COL_CONFIG.asset.xOffset, currentY + 24);
  ctx.fillText('SKU CODE', margin + TABLE_COL_CONFIG.sku.xOffset, currentY + 24);
  ctx.fillText('CATEGORY', margin + TABLE_COL_CONFIG.category.xOffset, currentY + 24);
  ctx.fillText('QUANTITY', margin + TABLE_COL_CONFIG.qty.xOffset, currentY + 24);
  ctx.fillText('ASSIGNED DATE', margin + TABLE_COL_CONFIG.date.xOffset, currentY + 24);

  return currentY + headerHeight;
};

/**
 * Draws the footer on each page ("Page X of Y") matching template
 */
const drawPageFooter = (
  ctx: CanvasRenderingContext2D,
  pageNumber: number,
  totalPages: number,
  pageWidth: number,
  pageHeight: number
) => {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 48);
  ctx.textAlign = 'left';
};

/**
 * Generates and downloads an official multi-page Employee Asset Custody PDF
 * conforming strictly to the company template styling:
 * - Top-right company logo with preserved aspect ratio
 * - Clean corporate color scheme (green & dark slate)
 * - NO unit price or total price displayed
 * - 100% of columns visible with zero cutoff
 * - Automatic pagination if items exceed one page
 * - Centered "Page X of Y" footer on every page
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

  // Pre-load company logo from base64
  const logoImg = await loadImageSafely(COMPANY_LOGO_BASE64);

  // Pre-load thumbnail images for items
  const itemImages = await Promise.all(
    activeAssignments.map(a => {
      const prod = products.find(p => p.id === a.productId || p.name === a.productName);
      return prod?.imageUrl ? loadImageSafely(prod.imageUrl) : Promise.resolve(null);
    })
  );

  // Standard A4 dimensions at 2x resolution (1200 x 1697)
  const pageWidth = 1200;
  const pageHeight = 1697;
  const margin = 60;
  const contentWidth = pageWidth - margin * 2; // 1080px
  const rowHeight = 48;
  const footerReservedSpace = 75; // for Page X of Y
  const signatureBlockHeight = 240;
  const summaryRowHeight = 40;

  // Plan pagination
  // Page 1 has:
  // - Top logo + margins: 100px
  // - Document Title: 75px
  // - Employee Info Card: 125px
  // - Table Header: 38px
  // - Start Y on Page 1 = 345px
  // On Page 1, space before footer = 1697 - footerReservedSpace = 1622px.
  // Space available for rows + (if fits) summary + signatures:
  const page1StartY = 345;
  const maxUsableY = pageHeight - footerReservedSpace - 10; // 1612px

  // Calculate how many rows go to each page
  interface PageSlice {
    pageIndex: number;
    startIndex: number;
    endIndex: number;
    hasSignatures: boolean;
  }

  const pagesPlan: PageSlice[] = [];
  let currentIndex = 0;
  const totalItems = activeAssignments.length;

  if (totalItems === 0) {
    pagesPlan.push({ pageIndex: 0, startIndex: 0, endIndex: 0, hasSignatures: true });
  } else {
    // Check if ALL items + summary + signatures fit on Page 1
    const neededOnPage1 = (totalItems * rowHeight) + summaryRowHeight + signatureBlockHeight + 25;
    if (page1StartY + neededOnPage1 <= maxUsableY) {
      // Single Page Fits Everything
      pagesPlan.push({
        pageIndex: 0,
        startIndex: 0,
        endIndex: totalItems,
        hasSignatures: true
      });
    } else {
      // Multi-Page
      let pageIdx = 0;
      while (currentIndex < totalItems) {
        if (pageIdx === 0) {
          // Page 1: take rows until near bottom
          const availableForRows = maxUsableY - page1StartY - 20;
          const rowsCount = Math.min(totalItems - currentIndex, Math.floor(availableForRows / rowHeight));
          pagesPlan.push({
            pageIndex: 0,
            startIndex: currentIndex,
            endIndex: currentIndex + rowsCount,
            hasSignatures: false
          });
          currentIndex += rowsCount;
        } else {
          // Continuation Pages:
          // Start Y on Page > 0: Logo (100px) + Compact Header (60px) + Table Header (38px) = 198px
          const pageContStartY = 198;
          const remainingItems = totalItems - currentIndex;
          const neededRemaining = (remainingItems * rowHeight) + summaryRowHeight + signatureBlockHeight + 25;

          if (pageContStartY + neededRemaining <= maxUsableY) {
            // Can fit remaining rows AND signature block on this page
            pagesPlan.push({
              pageIndex: pageIdx,
              startIndex: currentIndex,
              endIndex: totalItems,
              hasSignatures: true
            });
            currentIndex = totalItems;
          } else {
            // Can only fit some rows on this page
            const availableForRows = maxUsableY - pageContStartY - 20;
            const rowsCount = Math.min(remainingItems, Math.floor(availableForRows / rowHeight));
            pagesPlan.push({
              pageIndex: pageIdx,
              startIndex: currentIndex,
              endIndex: currentIndex + rowsCount,
              hasSignatures: false
            });
            currentIndex += rowsCount;
          }
        }
        pageIdx++;
      }

      // If last page didn't have room for signatures, add a final signature page
      const lastSlice = pagesPlan[pagesPlan.length - 1];
      if (!lastSlice.hasSignatures) {
        pagesPlan.push({
          pageIndex: pageIdx,
          startIndex: totalItems,
          endIndex: totalItems,
          hasSignatures: true
        });
      }
    }
  }

  const totalPages = pagesPlan.length;

  // Render each page canvas
  const renderedCanvases: HTMLCanvasElement[] = [];

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const slice = pagesPlan[pIdx];
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    // 1. Pure White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // 2. Header: Company Logo at Top Right (exact proportion from template)
    drawHeaderLogo(ctx, logoImg, pageWidth, margin, 42);

    let currentY = 0;

    if (pIdx === 0) {
      // Page 1 Header Details
      currentY = 115;

      // Centered Document Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('EMPLOYEE ASSET CUSTODY STATEMENT', pageWidth / 2, currentY);

      ctx.fillStyle = '#65A30D'; // Brand green
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('员工资产领用与保管清单', pageWidth / 2, currentY + 24);
      ctx.textAlign = 'left';

      currentY += 46;

      // Employee Information Card
      const cardHeight = 110;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(margin, currentY, contentWidth, cardHeight);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, currentY, contentWidth, cardHeight);

      // Top green accent line on employee card
      ctx.fillStyle = '#84BD00';
      ctx.fillRect(margin, currentY, contentWidth, 3);

      // Employee Avatar initial
      const avatarRadius = 28;
      const avatarCenterX = margin + 45;
      const avatarCenterY = currentY + cardHeight / 2;

      ctx.fillStyle = '#84BD00';
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(employee.name.charAt(0).toUpperCase(), avatarCenterX, avatarCenterY + 8);
      ctx.textAlign = 'left';

      // Employee Text Info
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(employee.name, margin + 90, currentY + 38);

      ctx.fillStyle = '#475569';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText(`Department: ${employee.department}   |   Role: ${employee.role}`, margin + 90, currentY + 64);
      ctx.fillText(`Email: ${employee.email}`, margin + 90, currentY + 88);

      // Total Custody Units Badge on Right (NO PRICE)
      const badgeWidth = 200;
      const badgeHeight = 36;
      const badgeX = pageWidth - margin - badgeWidth - 15;
      const badgeY = currentY + 22;

      ctx.fillStyle = '#F0FDF4';
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.strokeStyle = '#BBF7D0';
      ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

      ctx.fillStyle = '#166534';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Active Items: ${totalUnits} Units`, badgeX + 16, badgeY + 23);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Doc Ref: GR-AST-${Date.now().toString().slice(-6)}`, badgeX + 16, badgeY + 54);
      ctx.fillText(`Issued: ${new Date().toLocaleDateString()}`, badgeX + 16, badgeY + 70);

      currentY += cardHeight + 20;

      // Table Header
      currentY = drawTableHeader(ctx, margin, contentWidth, currentY);

    } else {
      // Continuation Page Header
      currentY = 110;

      // Compact header info
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('EMPLOYEE ASSET CUSTODY STATEMENT (Cont.) / 员工资产领用清单（续）', margin, currentY);

      ctx.fillStyle = '#64748B';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Employee: ${employee.name} (${employee.department})   |   Issued: ${new Date().toLocaleDateString()}`, margin, currentY + 20);

      currentY += 34;

      // Repeat Table Header
      currentY = drawTableHeader(ctx, margin, contentWidth, currentY);
    }

    // Render Rows for this slice
    if (slice.startIndex === slice.endIndex && totalItems === 0) {
      // Empty state
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(margin, currentY, contentWidth, 65);
      ctx.strokeStyle = '#E2E8F0';
      ctx.strokeRect(margin, currentY, contentWidth, 65);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No assets currently assigned to this employee. / 该员工当前名下无已领用资产。', pageWidth / 2, currentY + 38);
      ctx.textAlign = 'left';
      currentY += 65;
    } else {
      for (let rIdx = slice.startIndex; rIdx < slice.endIndex; rIdx++) {
        const assign = activeAssignments[rIdx];
        const prod = products.find(p => p.id === assign.productId || p.name === assign.productName);

        // Alternating row background
        ctx.fillStyle = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        ctx.fillRect(margin, currentY, contentWidth, rowHeight);

        // Row bottom separator line
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, currentY + rowHeight);
        ctx.lineTo(pageWidth - margin, currentY + rowHeight);
        ctx.stroke();

        // 1. Column: #
        ctx.fillStyle = '#64748B';
        ctx.font = '12px sans-serif';
        ctx.fillText(String(rIdx + 1), margin + TABLE_COL_CONFIG.num.xOffset, currentY + 29);

        // 2. Column: Photo
        const thumbSize = 34;
        const thumbY = currentY + 7;
        const thumbX = margin + TABLE_COL_CONFIG.thumb.xOffset;
        const img = itemImages[rIdx];

        if (img) {
          try {
            ctx.drawImage(img, thumbX, thumbY, thumbSize, thumbSize);
            ctx.strokeStyle = '#CBD5E1';
            ctx.strokeRect(thumbX, thumbY, thumbSize, thumbSize);
          } catch {
            drawFallbackThumbnail(ctx, thumbX, thumbY, thumbSize);
          }
        } else {
          drawFallbackThumbnail(ctx, thumbX, thumbY, thumbSize);
        }

        // 3. Column: Asset Name & Description (EN & CN)
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
        const nameEn = truncateText(ctx, assign.productName, 380);
        ctx.fillText(nameEn, margin + TABLE_COL_CONFIG.asset.xOffset, currentY + 20);

        const nameCn = assign.productNameZh || prod?.nameZh || '';
        if (nameCn) {
          ctx.fillStyle = '#64748B';
          ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
          const truncatedCn = truncateText(ctx, nameCn, 380);
          ctx.fillText(truncatedCn, margin + TABLE_COL_CONFIG.asset.xOffset, currentY + 36);
        }

        // 4. Column: SKU Code
        ctx.fillStyle = '#334155';
        ctx.font = '12px Courier, monospace';
        ctx.fillText(prod?.sku || 'N/A', margin + TABLE_COL_CONFIG.sku.xOffset, currentY + 29);

        // 5. Column: Category
        ctx.fillStyle = '#475569';
        ctx.font = '12px sans-serif';
        ctx.fillText(prod?.category || 'General', margin + TABLE_COL_CONFIG.category.xOffset, currentY + 29);

        // 6. Column: Quantity (Highlighted)
        ctx.fillStyle = '#15803D';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(String(assign.quantity), margin + TABLE_COL_CONFIG.qty.xOffset, currentY + 29);

        // 7. Column: Assigned Date
        ctx.fillStyle = '#64748B';
        ctx.font = '12px sans-serif';
        ctx.fillText(new Date(assign.assignedDate).toLocaleDateString(), margin + TABLE_COL_CONFIG.date.xOffset, currentY + 29);

        currentY += rowHeight;
      }
    }

    // Render Summary and Signatures on the final page
    if (slice.hasSignatures) {
      currentY += 10;

      // Summary Row (TOTAL UNITS ONLY - NO PRICE)
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(margin, currentY, contentWidth, summaryRowHeight);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(margin, currentY, contentWidth, summaryRowHeight);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('TOTAL ASSIGNED UNITS / 领用总数', margin + TABLE_COL_CONFIG.asset.xOffset, currentY + 25);

      ctx.fillStyle = '#15803D';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${totalUnits} Units`, margin + TABLE_COL_CONFIG.qty.xOffset, currentY + 25);

      currentY += summaryRowHeight + 20;

      // Custody Undertaking Statement
      const undertakingHeight = 88;
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(margin, currentY, contentWidth, undertakingHeight);
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, currentY, contentWidth, undertakingHeight);

      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('CUSTODIAN ACKNOWLEDGMENT & UNDERTAKING / 资产保管承诺与责任确认', margin + 18, currentY + 24);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('1. The employee acknowledges receipt of the company property listed above in good working condition and agrees to exercise reasonable care.', margin + 18, currentY + 44);
      ctx.fillText('2. Assets must be returned in full upon resignation or department transfer. Loss or damage due to negligence must be reported immediately.', margin + 18, currentY + 62);
      ctx.fillText('本人确认已全数核对并领用上述完好无损的资产，承诺妥善保管并仅用于公司公务，离职或调岗时如数归还。', margin + 18, currentY + 80);

      currentY += undertakingHeight + 20;

      // Signatures Block
      const sigBoxWidth = (contentWidth - 40) / 2;
      const sigBoxHeight = 110;

      // Employee Signature Box
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(margin, currentY, sigBoxWidth, sigBoxHeight);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('EMPLOYEE SIGNATURE / 领用人签字', margin + 16, currentY + 26);

      ctx.strokeStyle = '#94A3B8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin + 16, currentY + 75);
      ctx.lineTo(margin + sigBoxWidth - 16, currentY + 75);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Signed by: ${employee.name}`, margin + 16, currentY + 95);
      ctx.fillText('Date / 日期: ____________', margin + sigBoxWidth - 160, currentY + 95);

      // Asset Custodian / Manager Signature Box
      const managerX = margin + sigBoxWidth + 40;
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(managerX, currentY, sigBoxWidth, sigBoxHeight);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText('ASSET CONTROLLER / 库管发料人签字', managerX + 16, currentY + 26);

      ctx.strokeStyle = '#94A3B8';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(managerX + 16, currentY + 75);
      ctx.lineTo(managerX + sigBoxWidth - 16, currentY + 75);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px sans-serif';
      ctx.fillText('Authorized Signature: ____________', managerX + 16, currentY + 95);
      ctx.fillText('Date / 日期: ____________', managerX + sigBoxWidth - 160, currentY + 95);
    }

    // 3. Footer on every page ("Page X of Y" centered)
    drawPageFooter(ctx, pIdx + 1, totalPages, pageWidth, pageHeight);

    renderedCanvases.push(canvas);
  }

  // Combine into jsPDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt

  renderedCanvases.forEach((c, index) => {
    if (index > 0) {
      pdf.addPage('a4', 'portrait');
    }
    const imgData = c.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  });

  const sanitizedName = employee.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  pdf.save(`${sanitizedName}_Asset_Handover_${dateStr}.pdf`);
};
