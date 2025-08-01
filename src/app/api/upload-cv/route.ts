import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const cvFile = formData.get('cvFile') as File | null;

    if (!cvFile) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    let extractedText = '';
    const fileBuffer = Buffer.from(await cvFile.arrayBuffer());
    const fileExtension = cvFile.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'pdf') {
        const data = await pdfParse(fileBuffer);
        extractedText = data.text;
      } else if (fileExtension === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer.buffer });
        extractedText = result.value;
      } else if (fileExtension === 'md') {
        extractedText = fileBuffer.toString('utf8');
      } else {
        return NextResponse.json({ error: 'Unsupported file type. Only PDF, DOCX, and MD are supported.' }, { status: 400 });
      }

      return NextResponse.json({ text: extractedText });
    } catch (parseError: any) {
      console.error('Error parsing CV file:', parseError);
      return NextResponse.json({ error: `Error parsing CV file: ${parseError.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}