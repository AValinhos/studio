
import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.json');

async function readData() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading data file:', error);
    // If the file doesn't exist or is empty, return a default structure
    return { users: [], mediaItems: [], playlists: [] };
  }
}

async function writeData(data: any) {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing data file:', error);
    throw new Error('Could not write to data file.');
  }
}

export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const newData = await req.json();
    await writeData(newData);
    return NextResponse.json({ message: 'Data updated successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error updating data', error: error.message }, { status: 500 });
  }
}
