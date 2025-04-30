import html2pdf from 'html2pdf.js';

// PDF Export function
export const exportToPDF = (
  elementId: string, 
  filename: string = 'document.pdf',
  options: any = {}
) => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }
  
  // Default options with good formatting for documentation
  const defaultOptions = {
    margin: [15, 15, 15, 15],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  // Merge default options with any custom options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create a clone of the element to prevent modifying the original DOM
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Apply print-specific styling to the clone
  clonedElement.classList.add('pdf-export');
  clonedElement.style.width = '100%';
  clonedElement.style.maxWidth = '210mm'; // A4 width
  clonedElement.style.margin = '0 auto';
  clonedElement.style.padding = '20px';
  clonedElement.style.backgroundColor = 'white';
  clonedElement.style.color = 'black';
  
  // Fix links and images to absolute URLs
  const links = clonedElement.querySelectorAll('a');
  links.forEach(link => {
    if (link.href && link.href.startsWith('/')) {
      link.href = window.location.origin + link.href;
    }
  });
  
  const images = clonedElement.querySelectorAll('img');
  images.forEach(img => {
    if (img.src && img.src.startsWith('/')) {
      img.src = window.location.origin + img.src;
    }
  });
  
  // Find and style any graph elements for better print rendering
  const graphElements = clonedElement.querySelectorAll('.recharts-wrapper');
  graphElements.forEach(graph => {
    const element = graph as HTMLElement;
    element.style.width = '100%';
    element.style.maxWidth = '500px';
    element.style.margin = '0 auto';
  });
  
  // Generate PDF
  html2pdf()
    .from(clonedElement)
    .set(mergedOptions)
    .save()
    .then(() => {
      console.log(`PDF "${filename}" generated successfully`);
    })
    .catch((error: any) => {
      console.error('Error generating PDF:', error);
    });
};

export default exportToPDF;