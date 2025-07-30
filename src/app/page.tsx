
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ContentUploader from '@/components/ContentUploader';
import MediaManager from '@/components/MediaManager';
import PlaylistManager from '@/components/PlaylistManager';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Tv, Clapperboard, ListMusic, Loader2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);


export interface MediaItem {
  id: string;
  name: string;
  type: string;
  src?: string;
  content?: string;
  subContent?: string;
  bgColor?: string;
  dataAiHint?: string;
  date: string;
  showFooter?: boolean;
  footerText1?: string;
  footerText2?: string;
  footerBgColor?: string;
  footerImageSrc?: string;
}

export interface PlaylistItemData {
  mediaId: string;
  duration: number;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItemData[];
}

export interface AnalyticsDataPoint {
    date: string;
    [key: string]: any; 
}


function AnalyticsChart({ analyticsData, playlists }: { analyticsData: AnalyticsDataPoint[] | null, playlists: Playlist[] }) {
  const chartData = useMemo(() => {
    if (!analyticsData || !playlists || analyticsData.length === 0 || playlists.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = analyticsData.map(d => new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    
    const colors = [
      'rgb(75, 192, 192)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(153, 102, 255)',
    ];
    
    const datasets = playlists.map((playlist, index) => {
      return {
        label: playlist.name,
        data: analyticsData.map(day => day[playlist.name] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace(')', ', 0.2)').replace('rgb', 'rgba'),
        fill: true,
        tension: 0.3,
      };
    });

    return { labels, datasets };

  }, [analyticsData, playlists]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `${value} min`
          }
        }
      }
    }
  };

  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className="flex h-80 w-full items-center justify-center text-muted-foreground">
        <p>Dados de analytics insuficientes para exibir o gráfico.</p>
      </div>
    );
  }

  return <Line options={options} data={chartData} />;
}


function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (isAuthenticated !== 'true') {
        router.push('/login');
      }
    }
  }, [isClient, router]);

  if (!isClient) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  return <>{children}</>;
}

export default function Dashboard() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[] | null>(null);

  const fetchData = async () => {
    try {
      if (!isLoading) setIsLoading(true);
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Falha ao buscar dados');
      const data = await res.json();
      setMediaItems(data.mediaItems || []);
      setPlaylists(data.playlists || []);
      
      const analyticsRes = await fetch('/api/analytics');
      if(analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        analytics.sort((a: AnalyticsDataPoint, b: AnalyticsDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setAnalyticsData(analytics);
      }
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = localStorage.getItem('lastAnalyticsUpdate');

    if (lastUpdate !== today && !isLoading) {
        fetch('/api/analytics', { method: 'POST' })
            .then(res => {
                if (res.ok) {
                    localStorage.setItem('lastAnalyticsUpdate', today);
                    fetchData(); 
                }
            })
            .catch(err => console.error("Falha ao atualizar analytics:", err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);


  const { totalExposureMinutes, mostViewedItemName } = useMemo(() => {
    if (isLoading || playlists.length === 0 || mediaItems.length === 0) {
      return { totalExposureMinutes: 0, mostViewedItemName: 'N/A' };
    }

    let totalSeconds = 0;
    const exposureCount: { [key: string]: number } = {};
    
    playlists.forEach(playlist => {
      playlist.items.forEach(item => {
        totalSeconds += item.duration;
        exposureCount[item.mediaId] = (exposureCount[item.mediaId] || 0) + item.duration;
      });
    });

    let mostViewedId = '';
    let maxExposure = 0;
    for (const mediaId in exposureCount) {
      if (exposureCount[mediaId] > maxExposure) {
        maxExposure = exposureCount[mediaId];
        mostViewedId = mediaId;
      }
    }
    
    const mostViewedItem = mediaItems.find(item => item.id === mostViewedId);
    
    return {
      totalExposureMinutes: Math.ceil(totalSeconds / 60),
      mostViewedItemName: mostViewedItem ? mostViewedItem.name : "Nenhum",
    };
  }, [playlists, mediaItems, isLoading]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Telas Totais</CardTitle>
                <Tv className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : playlists.length}</div>
                <p className="text-xs text-muted-foreground">Cada playlist representa uma tela.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens de Mídia</CardTitle>
                <Clapperboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : mediaItems.length}</div>
                <p className="text-xs text-muted-foreground">Total de itens na biblioteca.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Playlists</CardTitle>
                <ListMusic className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : playlists.length}</div>
                <p className="text-xs text-muted-foreground">Total de playlists criadas.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exposição de Conteúdo</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `~${totalExposureMinutes} min`}</div>
                <p className="text-xs text-muted-foreground">Mais visto: "{mostViewedItemName}"</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <ContentUploader onContentSaved={fetchData} />
                <PlaylistManager 
                  mediaItems={mediaItems} 
                  playlists={playlists} 
                  onPlaylistUpdate={fetchData}
                  isLoading={isLoading}
                />
              </div>
              <MediaManager mediaItems={mediaItems} onMediaUpdate={fetchData} isLoading={isLoading}/>
            </div>
          </div>
          
          <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
             <Card>
              <CardHeader>
                <CardTitle>Evolução do Tempo de Uso</CardTitle>
                <CardDescription>Tempo de exibição total por playlist (em minutos) nos últimos dias.</CardDescription>
              </CardHeader>
              <CardContent>
                 {isLoading ? (
                  <div className="flex h-80 w-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : (
                  <AnalyticsChart 
                    analyticsData={analyticsData} 
                    playlists={playlists}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
