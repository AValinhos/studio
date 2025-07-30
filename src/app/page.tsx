
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ContentUploader from '@/components/ContentUploader';
import MediaManager from '@/components/MediaManager';
import PlaylistManager from '@/components/PlaylistManager';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Tv, Clapperboard, ListMusic, Loader2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";


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


function AnalyticsChart({ analyticsData, playlistNames, chartConfig }: { analyticsData: AnalyticsDataPoint[] | null, playlistNames: string[], chartConfig: any }) {
  const [hiddenPlaylists, setHiddenPlaylists] = useState<string[]>([]);

  const togglePlaylistVisibility = (dataKey: string) => {
    setHiddenPlaylists(prev => 
      prev.includes(dataKey) 
        ? prev.filter(name => name !== dataKey) 
        : [...prev, dataKey]
    );
  };
  
  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className="flex h-80 w-full items-center justify-center text-muted-foreground">
        <p>Dados de analytics insuficientes para exibir o gráfico.</p>
      </div>
    );
  }

  const chartData = analyticsData.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));


  return (
     <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <AreaChart data={chartData}>
        <defs>
          {Object.keys(chartConfig).map((key, index) => (
            <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={`hsl(var(--chart-${index+1}))`} stopOpacity={0.8} />
              <stop offset="95%" stopColor={`hsl(var(--chart-${index+1}))`} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value} min`}
        />
        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
        <Legend content={<ChartLegendContent onClick={(payload) => togglePlaylistVisibility(payload.dataKey as string)} />} />
        {playlistNames.map((name, index) => (
          !hiddenPlaylists.includes(name) && (
            <Area
              key={name}
              dataKey={name}
              type="natural"
              fill={`url(#fill-${name})`}
              stroke={`hsl(var(--chart-${index+1}))`}
              stackId="1"
            />
          )
        ))}
      </AreaChart>
    </ChartContainer>
  );
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
        // Sort data chronologically
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
                    fetchData(); // Refresh all data after posting
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
  
   const playlistNames = useMemo(() => playlists.length > 0 ? playlists.map(p => p.name) : [], [playlists]);

   const chartConfig = useMemo(() => {
    const config: { [key: string]: { label: string, color: string } } = {};
    playlistNames.forEach((name, index) => {
      config[name] = {
        label: name,
        color: `hsl(var(--chart-${index + 1}))`,
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
                    playlistNames={playlistNames}
                    chartConfig={chartConfig}
                  />
                )}
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
        </main>
      </div>
    </AuthGuard>
  );
}
