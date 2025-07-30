

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ContentUploader from '@/components/ContentUploader';
import MediaManager from '@/components/MediaManager';
import PlaylistManager from '@/components/PlaylistManager';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Tv, Clapperboard, ListMusic, Loader2 } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

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
    [key: string]: any; // Permite nomes de playlist dinâmicos
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([]);

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
    
    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = localStorage.getItem('lastAnalyticsUpdate');

    if (lastUpdate !== today) {
        // Enviar os dados de analytics do dia
        fetch('/api/analytics', { method: 'POST' })
            .then(res => {
                if (res.ok) {
                    localStorage.setItem('lastAnalyticsUpdate', today);
                }
            })
            .catch(err => console.error("Falha ao atualizar analytics:", err));
    }

  }, []);

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
  
   const playlistNames = useMemo(() => playlists.map(p => p.name), [playlists]);
   const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

   const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    playlistNames.forEach((name, index) => {
        const sanitizedName = name.replace(/\s+/g, '-');
        config[sanitizedName] = {
            label: name,
            color: colors[index % colors.length],
        };
    });
    return config;
   }, [playlistNames]);

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
          <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
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
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1 xl:col-span-1">
               <Card>
                  <CardHeader>
                    <CardTitle>Evolução da Duração por Playlist</CardTitle>
                    <CardDescription>Duração total (em minutos) de cada playlist ao longo dos dias.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                     ) : (
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <RechartsLineChart data={analyticsData} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                                />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                 <ChartLegend content={<ChartLegendContent />} />
                                 {Object.keys(chartConfig).map((key) => (
                                    <Line 
                                        key={key}
                                        type="monotone" 
                                        dataKey={key.replace(/-/g, ' ')} 
                                        stroke={chartConfig[key].color}
                                        strokeWidth={2} 
                                        dot={false} 
                                    />
                                ))}
                            </RechartsLineChart>
                        </ChartContainer>
                     )}
                  </CardContent>
                </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
