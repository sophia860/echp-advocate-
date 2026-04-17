// src/lib/flowr.ts

const FLOWR_PROXY_URL = '/api/flowr';

const flowrHeaders = {
  'Content-Type': 'application/json',
};

// â”€â”€â”€ Utility: Convert a File object to base64 string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// â”€â”€â”€ Utility: Trigger a browser download from base64 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function downloadBase64File(base64: string, filename: string, mimeType: string) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// â”€â”€â”€ Feature 1: Extract text from a PDF or Word file â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Accepts a File object, returns plain text string.
// Falls back to FileReader plain text for .txt files (no Flowr needed).
export async function extractTextFromFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Plain text â€” no conversion needed
  if (extension === 'txt') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // PDF or Word â€” use Flowr
  try {
    const base64File = await fileToBase64(file);

    const isPdf = extension === 'pdf';
    const endpoint = isPdf
      ? '/api/v1/pdf/utilities/extract-text'
      : '/api/v1/word/utilities/extract-text';

    const response = await fetch(`${FLOWR_PROXY_URL}${endpoint}`, {
      method: 'POST',
      headers: flowrHeaders,
      body: JSON.stringify({
        FileContent: base64File,
        FileName: file.name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Flowr extraction failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Flowr returns extracted text in the 'Text' field
    return data.Text || data.text || '';
  } catch (error) {
    console.error('Flowr text extraction error:', error);
    throw error;
  }
}

// â”€â”€â”€ Feature 2: Convert HTML string to a downloadable PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Used to export AI-drafted letters as formatted PDFs.
export async function htmlToPdf(html: string, filename: string): Promise<void> {
  try {
    const response = await fetch(`${FLOWR_PROXY_URL}/api/v1/pdf/convert/html`, {
      method: 'POST',
      headers: flowrHeaders,
      body: JSON.stringify({
        HtmlContent: html,
        FileName: filename,
        PageSize: 'A4',
        MarginTop: '25mm',
        MarginBottom: '25mm',
        MarginLeft: '20mm',
        MarginRight: '20mm',
      }),
    });

    if (!response.ok) {
      throw new Error(`Flowr HTML-to-PDF failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const base64Pdf = data.FileContent || data.fileContent;
    downloadBase64File(base64Pdf, filename, 'application/pdf');
  } catch (error) {
    console.error('Flowr HTML-to-PDF error:', error);
    throw error;
  }
}

// â”€â”€â”€ Feature 3: Merge multiple base64 PDFs into one â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Used to build the tribunal evidence bundle.
export async function mergePdfs(
  files: { content: string; name: string }[],
  outputFilename: string
): Promise<void> {
  try {
    const response = await fetch(`${FLOWR_PROXY_URL}/api/v1/pdf/utilities/merge`, {
      method: 'POST',
      headers: flowrHeaders,
      body: JSON.stringify({
        FileContent: files.map((f) => ({
          FileContent: f.content,
          FileName: f.name,
        })),
        FileName: outputFilename,
      }),
    });

    if (!response.ok) {
      throw new Error(`Flowr PDF merge failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const base64Pdf = data.FileContent || data.fileContent;
    downloadBase64File(base64Pdf, outputFilename, 'application/pdf');
  } catch (error) {
    console.error('Flowr PDF merge error:', error);
    throw error;
  }
}

// â”€â”€â”€ Feature 4: Extract structured fields from an EHCP document â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns a key/value object of extracted fields.
export async function extractStructuredData(base64File: string, fileName: string): Promise<Record<string, string>> {
  try {
    const response = await fetch(`${FLOWR_PROXY_URL}/api/v1/pdf/utilities/extract-form-data`, {
      method: 'POST',
      headers: flowrHeaders,
      body: JSON.stringify({
        FileContent: base64File,
        FileName: fileName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Flowr structured extraction failed: ${response.status}`);
    }

    const data = await response.json();
    return data.Fields || data.fields || {};
  } catch (error) {
    console.error('Flowr structured extraction error:', error);
    return {};
  }
}

// â”€â”€â”€ Utility: Wrap letter markdown/text in a styled HTML template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildLetterHtml(params: {
  childName: string;
  laName: string;
  letterTitle: string;
  body: string;
  senderName?: string;
}): string {
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Convert basic markdown to HTML for the body
  const htmlBody = params.body
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 13pt;
          color: #1a1a1a;
          line-height: 1.7;
          max-width: 680px;
          margin: 0 auto;
          padding: 0;
        }
        .header {
          border-bottom: 2px solid #6B2619;
          padding-bottom: 16px;
          margin-bottom: 32px;
        }
        .header h1 {
          font-size: 11pt;
          font-family: 'Arial', sans-serif;
          color: #6B2619;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin: 0 0 4px 0;
        }
        .header p {
          font-size: 10pt;
          color: #888;
          margin: 0;
          font-family: 'Arial', sans-serif;
        }
        .meta {
          margin-bottom: 32px;
          font-family: 'Arial', sans-serif;
        }
        .meta .date { color: #666; font-size: 10pt; margin-bottom: 16px; }
        .meta .to-block { font-size: 11pt; font-weight: 600; }
        .subject {
          font-size: 13pt;
          font-weight: 700;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: #FDF5F2;
          border-left: 4px solid #6B2619;
          font-family: 'Arial', sans-serif;
        }
        .body p { margin-bottom: 1em; }
        .body h2 { font-size: 12pt; margin-top: 1.5em; font-family: 'Arial', sans-serif; }
        .footer {
          margin-top: 48px;
          font-family: 'Arial', sans-serif;
          font-size: 10pt;
          color: #888;
          border-top: 1px solid #eee;
          padding-top: 12px;
        }
        .reference {
          font-size: 8pt;
          color: #ccc;
          font-family: 'Arial', sans-serif;
          text-align: right;
          margin-top: 32px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>EHCP Navigator</h1>
        <p>Case file: ${params.childName} Â· ${params.laName}</p>
      </div>

      <div class="meta">
        <div class="date">${date}</div>
        <div class="to-block">
          To: The SEN Team<br/>
          ${params.laName}
        </div>
      </div>

      <div class="subject">Re: ${params.letterTitle}</div>

      <div class="body"><p>${htmlBody}</p></div>

      <div class="footer">
        Yours sincerely,<br/><br/>
        <strong>${params.senderName || 'The Parent/Guardian'}</strong>
      </div>

      <div class="reference">
        Generated by EHCP Navigator Â· ${date} Â· AI-assisted, parent-reviewed
      </div>
    </body>
    </html>
  `;
}

// â”€â”€â”€ Utility: Convert HTML to PDF and return as base64 (no download) â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Used when the PDF needs to be merged with others before downloading.
export async function htmlToPdfBase64(html: string, filename: string): Promise<string> {
  const response = await fetch(`${FLOWR_PROXY_URL}/api/v1/pdf/convert/html`, {
    method: 'POST',
    headers: flowrHeaders,
    body: JSON.stringify({
      HtmlContent: html,
      FileName: filename,
      PageSize: 'A4',
      MarginTop: '25mm',
      MarginBottom: '25mm',
      MarginLeft: '20mm',
      MarginRight: '20mm',
    }),
  });
  if (!response.ok) {
    throw new Error(`Flowr HTML-to-PDF failed: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.FileContent || data.fileContent;
}
