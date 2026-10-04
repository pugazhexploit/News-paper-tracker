import jsPDF from 'jspdf';
import { Customer, DeliveryEntry, Newspaper } from '../types';

export function exportDeliveriesToCSV(entries: DeliveryEntry[]) {
  const headers = [
    'Entry ID',
    'Delivery Date',
    'Delivered At',
    'Customer Name',
    'Newspaper Name',
    'Quantity',
    'Status',
    'Delivery Staff',
    'Missed Reason',
    'Notes',
    'Latitude',
    'Longitude'
  ];

  const rows = entries.map((e) => [
    e.id,
    e.deliveryDate,
    e.deliveredAt ? new Date(e.deliveredAt).toLocaleTimeString() : '-',
    `"${(e.customerName || '').replace(/"/g, '""')}"`,
    `"${(e.newspaperName || '').replace(/"/g, '""')}"`,
    e.quantity,
    e.status.toUpperCase(),
    `"${(e.staffName || '').replace(/"/g, '""')}"`,
    `"${(e.missedReason || '').replace(/"/g, '""')}"`,
    `"${(e.notes || '').replace(/"/g, '""')}"`,
    e.latitude || '',
    e.longitude || ''
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PaperTrack_Deliveries_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomersToCSV(customers: Customer[], newspapers: Newspaper[]) {
  const headers = [
    'Customer ID',
    'Full Name',
    'Mobile',
    'House Number',
    'Street',
    'Area',
    'City',
    'Pincode',
    'Subscribed Papers',
    'Monthly Due (INR)',
    'Payment Status',
    'Latitude',
    'Longitude'
  ];

  const paperMap = new Map(newspapers.map((p) => [p.id, p.name]));

  const rows = customers.map((c) => {
    const paperNames = c.subscriptions
      .filter((s) => s.isActive)
      .map((s) => `${paperMap.get(s.newspaperId) || s.newspaperId} (x${s.quantity})`)
      .join('; ');

    return [
      c.id,
      `"${c.fullName.replace(/"/g, '""')}"`,
      c.phone,
      `"${c.houseNumber}"`,
      `"${c.street.replace(/"/g, '""')}"`,
      `"${c.area.replace(/"/g, '""')}"`,
      c.city,
      c.pincode,
      `"${paperNames}"`,
      c.monthlyAmount,
      c.paymentStatus.toUpperCase(),
      c.latitude,
      c.longitude
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PaperTrack_Customers_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateDailyReportPDF(
  dateStr: string,
  entries: DeliveryEntry[],
  newspapers: Newspaper[],
  totalCustomers: number
) {
  const doc = new jsPDF();

  // Header banner
  doc.setFillColor(2, 132, 199); // sky-600
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PaperTrack – Daily Delivery Summary', 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Every Paper. Every Home. On Time. | Tamil Nadu Distribution', 14, 23);

  // Report Date & Generation Time
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Report Date: ${dateStr}`, 14, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated at: ${new Date().toLocaleString()}`, 14, 46);

  // Metrics summary
  const delivered = entries.filter((e) => e.status === 'delivered').length;
  const missed = entries.filter((e) => e.status === 'missed').length;
  const pending = entries.filter((e) => e.status === 'pending').length;
  const total = entries.length;
  const completionRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 52, 182, 24, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Total Scheduled:', 20, 62);
  doc.text('Delivered:', 70, 62);
  doc.text('Missed:', 115, 62);
  doc.text('Success Rate:', 155, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(2, 132, 199);
  doc.text(`${total}`, 20, 70);
  doc.setTextColor(22, 163, 74); // green
  doc.text(`${delivered}`, 70, 70);
  doc.setTextColor(220, 38, 38); // red
  doc.text(`${missed}`, 115, 70);
  doc.setTextColor(15, 23, 42);
  doc.text(`${completionRate}%`, 155, 70);

  // Newspaper dispatch table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Newspaper-wise Breakdown', 14, 88);

  let y = 96;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Newspaper Name', 16, y);
  doc.text('Language', 95, y);
  doc.text('Required Copies', 140, y);
  doc.text('Delivered', 180, y);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, y + 2, 196, y + 2);
  y += 8;

  doc.setFont('helvetica', 'normal');
  newspapers.forEach((np) => {
    const npEntries = entries.filter((e) => e.newspaperId === np.id);
    const npDelivered = npEntries.filter((e) => e.status === 'delivered').length;
    const required = npEntries.length;

    if (required > 0) {
      doc.text(np.name, 16, y);
      doc.text(np.language, 95, y);
      doc.text(`${required}`, 140, y);
      doc.text(`${npDelivered}`, 180, y);
      y += 6;
    }
  });

  // Recent delivery log entries
  y += 6;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Delivery Records', 14, y);

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer', 16, y);
  doc.text('Newspaper', 75, y);
  doc.text('Staff', 130, y);
  doc.text('Status', 170, y);

  doc.line(14, y + 2, 196, y + 2);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const recentEntries = entries.slice(0, 15);
  recentEntries.forEach((e) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text((e.customerName || 'N/A').substring(0, 28), 16, y);
    doc.text((e.newspaperName || 'N/A').substring(0, 24), 75, y);
    doc.text((e.staffName || 'N/A').substring(0, 18), 130, y);
    doc.text(e.status.toUpperCase(), 170, y);
    y += 6;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('PaperTrack Autonomous Newspaper Delivery Management System', 14, 285);

  doc.save(`PaperTrack_Report_${dateStr}.pdf`);
}
