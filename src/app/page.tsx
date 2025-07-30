

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ContentUploader from '@/components/ContentUploader';
import MediaManager from '@/components/MediaManager';
import PlaylistManager from '@/components/PlaylistManager';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Tv, Clapperboard, ListMusic, Loader2 } from 'lucide-react';
import { Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, Chart as ShadcnChart, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
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

  const fetchData = async () => {
    try {
      if (!isLoading) setIsLoading(true);
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Falha ao buscar dados');
      const data = await res.json();
      setMediaItems(data.mediaItems || []);
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { totalExposureMinutes, mostViewedItemName, playlistChartData } = useMemo(() => {
    if (isLoading || playlists.length === 0 || mediaItems.length === 0) {
      return { totalExposureMinutes: 0, mostViewedItemName: 'N/A', playlistChartData: [] };
    }

    const exposureCount: { [key: string]: number } = {};
    let totalSeconds = 0;
    
    const playlistChartData = playlists.map(playlist => {
      const playlistDuration = playlist.items.reduce((acc, item) => {
        exposureCount[item.mediaId] = (exposureCount[item.mediaId] || 0) + item.duration;
        totalSeconds += item.duration;
        return acc + item.duration;
      }, 0);
      return { name: playlist.name, minutos: Math.ceil(playlistDuration / 60) };
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
      playlistChartData,
    };
  }, [playlists, mediaItems, isLoading]);
  
   const chartConfig = {
    minutos: {
      label: 'Minutos',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig;


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
                <CardTitle className="text-sm font-medium">Visualizações de Conteúdo</CardTitle>
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
                    <CardTitle>Duração por Playlist</CardTitle>
                    <CardDescription>Duração total de conteúdo em cada playlist (em minutos).</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                     ) : (
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <ShadcnChart data={playlistChartData} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                 <ChartLegend content={<ChartLegendContent />} />
                                <Line type="monotone" dataKey="minutos" stroke="var(--color-minutos)" strokeWidth={2} dot={false} />
                            </ShadcnChart>
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
