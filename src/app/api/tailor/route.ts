import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { cv, jobUrl, jobDescriptionText, uploadedCvContent } = await req.json();

    let finalJobDescription = jobDescriptionText;

    // If no manual job description is provided, try to fetch from URL
    if (!finalJobDescription && jobUrl) {
      try {
        const { data: html } = await axios.get(jobUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(html);
        finalJobDescription = $('#jobDescriptionText').text().trim();

        if (!finalJobDescription) {
          console.warn('Could not extract job description from the URL.');
        }
      } catch (scrapeError: any) {
        console.error('Error scraping job URL:', scrapeError.message);
        // Do not return error here, allow tailoring with available data or warn user
      }
    }

    if (!finalJobDescription) {
      return NextResponse.json({ error: 'No job description provided or could be extracted. Please paste it manually.' }, { status: 400 });
    }

    // Determine which CV content to use
    let cvContentForGemini = '';
    if (uploadedCvContent) {
      cvContentForGemini = uploadedCvContent;
    } else {
      cvContentForGemini = `
        Name: ${cv.name}
        Email: ${cv.email}
        Summary: ${cv.summary}
        Experience: ${cv.experience}
        Education: ${cv.education}
        Skills: ${cv.skills}
      `;
    }

    // 2. Use Gemini to tailor the CV
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Based on the following CV content and job description, please rewrite the CV to be perfectly tailored for the job.
      Make sure to highlight the most relevant skills and experience.

      **My CV Content:**
      ${cvContentForGemini}

      **Job Description:**
      ${finalJobDescription}

      **Tailored CV (in Markdown format):**
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tailoredCv = response.text();

    return NextResponse.json({ tailoredCv });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}