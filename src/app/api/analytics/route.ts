import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import invariant from 'tiny-invariant';

const analyticsFilePath = path.join(process.cwd(), 'src', 'lib', 'analytics.json');
const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.json');

interface AnalyticsDataPoint {
  date: string;
  [key: string]: any;
}

interface Playlist {
  id: string;
  name: string;
  items: { mediaId: string; duration: number }[];
}

async function readAnalyticsData(): Promise<AnalyticsDataPoint[]> {
  try {
    const fileContent = await fs.readFile(analyticsFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // Se o arquivo não existir, retorne um array vazio
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    console.error('Error reading analytics file:', error);
    return [];
  }
}

async function writeAnalyticsData(data: AnalyticsDataPoint[]) {
  try {
    await fs.writeFile(analyticsFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing analytics file:', error);
    throw new Error('Could not write to analytics file.');
  }
}

async function readDataFile() {
    try {
        const fileContent = await fs.readFile(dataFilePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading data file:', error);
        return { playlists: [] };
    }
}


export async function GET() {
  const data = await readAnalyticsData();
  return NextResponse.json(data);
}


export async function POST(req: NextRequest) {
  try {
    const allData = await readDataFile();
    const playlists: Playlist[] = allData.playlists || [];
    const analyticsData = await readAnalyticsData();

    const today = new Date().toISOString().split('T')[0];

    // Calcula a duração total para cada playlist
    const dailyDurations: { [key: string]: any } = { date: today };
    playlists.forEach(playlist => {
      const totalDurationSeconds = playlist.items.reduce((acc, item) => acc + item.duration, 0);
      dailyDurations[playlist.name] = Math.ceil(totalDurationSeconds / 60); // Convertendo para minutos
    });

    // Encontra se já existe um registro para o dia de hoje
    const todayIndex = analyticsData.findIndex(d => d.date === today);

    if (todayIndex > -1) {
      // Atualiza o registro existente
      analyticsData[todayIndex] = { ...analyticsData[todayIndex], ...dailyDurations };
    } else {
      // Adiciona um novo registro
      analyticsData.push(dailyDurations);
    }
    
    // Mantém apenas os últimos 30 dias, por exemplo
    if(analyticsData.length > 30) {
        analyticsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        analyticsData.splice(30);
    }


    await writeAnalyticsData(analyticsData);
    return NextResponse.json({ message: 'Dados de analytics atualizados com sucesso', data: analyticsData }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao atualizar dados de analytics', error: error.message }, { status: 500 });
  }
}
