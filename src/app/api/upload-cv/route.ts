import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

// Helper function to parse form data
function parseForm(req: NextRequest): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req as any, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      resolve({ fields, files });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { files } = await parseForm(req);

    const cvFile = files.cvFile?.[0];

    if (!cvFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    let extractedText = '';

    try {
      const filePath = cvFile.filepath;
      const fileExtension = cvFile.originalFilename?.split('.').pop()?.toLowerCase();

      if (fileExtension === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        extractedText = data.text;
      } else if (fileExtension === 'docx') {
        const dataBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ arrayBuffer: dataBuffer.buffer });
        extractedText = result.value;
      } else {
        return NextResponse.json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' }, { status: 400 });
      }

      // Clean up the temporary file created by formidable
      fs.unlinkSync(filePath);

      return NextResponse.json({ text: extractedText });
    } catch (parseError: any) {
      console.error('Error parsing CV file:', parseError);
      // Ensure temporary file is cleaned up even on parse error
      if (cvFile.filepath && fs.existsSync(cvFile.filepath)) {
        fs.unlinkSync(cvFile.filepath);
      }
      return NextResponse.json({ error: `Error parsing CV file: ${parseError.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}