import html2pdf from 'html2pdf.js';

/**
 * Export an element to PDF
 * @param elementId The ID of the element to export
 * @param filename The filename for the PDF
 */
const exportToPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with ID "${elementId}" not found`);
    return;
  }
  
  const options = {
    margin: [10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(options).from(element).save();
};

export default exportToPDF;