import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  try {
    // Read the JSON file from the public directory
    const dataDirectory = path.join(process.cwd(), 'public');
    const fileContents = await fs.readFile(
      path.join(dataDirectory, 'book_data.json'),
      'utf8'
    );
    
    // Parse and validate the data
    const data = JSON.parse(fileContents);
    
    if (!data || !Array.isArray(data.original_pages) || !Array.isArray(data.distilled_pages)) {
      throw new Error('Invalid book data format');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading book data:', error);
    return NextResponse.json(
      { error: 'Failed to load book data' },
      { status: 500 }
    );
  }
}