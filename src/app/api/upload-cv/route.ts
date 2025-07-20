import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js's body parser for formidable
  },
};

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req as any, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form data:', err);
        return resolve(NextResponse.json({ error: 'Error parsing form data.' }, { status: 500 }));
      }

      const cvFile = files.cvFile?.[0];

      if (!cvFile) {
        return resolve(NextResponse.json({ error: 'No file uploaded.' }, { status: 400 }));
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
          const result = await mammoth.extractRawText({ arrayBuffer: dataBuffer });
          extractedText = result.value;
        } else {
          return resolve(NextResponse.json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' }, { status: 400 }));
        }

        // Clean up the temporary file created by formidable
        fs.unlinkSync(filePath);

        resolve(NextResponse.json({ text: extractedText }));
      } catch (parseError: any) {
        console.error('Error parsing CV file:', parseError);
        // Ensure temporary file is cleaned up even on parse error
        if (cvFile.filepath && fs.existsSync(cvFile.filepath)) {
          fs.unlinkSync(cvFile.filepath);
        }
        resolve(NextResponse.json({ error: `Error parsing CV file: ${parseError.message}` }, { status: 500 }));
      }
    });
  });
}
