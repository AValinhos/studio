
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
    const data = await readData();
    const body = await req.json();

    if (body.action === 'CREATE_MEDIA') {
      data.mediaItems.push(body.payload);
    } else if (body.action === 'UPDATE_MEDIA') {
      data.mediaItems = data.mediaItems.map((item: any) =>
        item.id === body.payload.id ? { ...item, ...body.payload.updates } : item
      );
    } else if (body.action === 'DELETE_MEDIA') {
       // Remove the media item itself
      data.mediaItems = data.mediaItems.filter((item: any) => item.id !== body.payload.id);
      // Remove the media item from any playlists it's in
      data.playlists.forEach((playlist: any) => {
        playlist.items = playlist.items.filter((item: any) => item.mediaId !== body.payload.id);
      });
    } else if (body.action === 'UPDATE_PLAYLISTS') {
      data.playlists = body.payload;
    } else if (body.action === 'CREATE_PLAYLIST') {
      const newId = data.playlists.length > 0
          ? String(Math.max(...data.playlists.map((p: any) => Number(p.id) || 0)) + 1)
          : '1';
      const newPlaylist = {
          ...body.payload,
          id: newId
      }
      data.playlists.push(newPlaylist);
    } else if (body.action === 'UPDATE_PLAYLIST') {
        data.playlists = data.playlists.map((p:any) => p.id === body.payload.id ? body.payload.updates : p);
    } else if (body.action === 'DELETE_PLAYLIST') {
        data.playlists = data.playlists.filter((p:any) => p.id !== body.payload.id);
    } else {
        return NextResponse.json({ message: 'Ação inválida' }, { status: 400 });
    }

    await writeData(data);
    return NextResponse.json({ message: 'Dados atualizados com sucesso', data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao atualizar dados', error: error.message }, { status: 500 });
  }
}
