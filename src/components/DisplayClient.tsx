
'use client'

import * as React from 'react'
import Image from 'next/image'
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Loader2 } from 'lucide-react'

interface MediaItem {
  id: string;
  name: string;
  type: string;
  src?: string;
  content?: string;
  subContent?: string;
  dataAiHint?: string;
  date: string;
}

interface PlaylistItemData {
  mediaId: string;
  duration: number;
}

interface Playlist {
  id: string;
  name: string;
  items: (MediaItem & { duration: number })[];
}

const getPlaylistById = (id: string, allData: { mediaItems: MediaItem[], playlists: { id: string, name: string, items: PlaylistItemData[] }[] }): Playlist | null => {
  const playlistData = allData.playlists.find(p => p.id === id);
  if (!playlistData) return null;

  const items = playlistData.items.map(item => {
    const media = allData.mediaItems.find(m => m.id === item.mediaId);
    if (!media) return null;
    return {
      ...media,
      duration: item.duration,
    }
  }).filter((item): item is MediaItem & { duration: number } => item !== null);

  return { ...playlistData, items };
}


export default function DisplayClient({ playlistId }: { playlistId: string }) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [playlist, setPlaylist] = React.useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAndSetPlaylist = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Failed to fetch data');
        const allData = await res.json();
        const foundPlaylist = getPlaylistById(playlistId, allData);
        setPlaylist(foundPlaylist);
      } catch (error) {
        console.error("Failed to load playlist", error);
        setPlaylist(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndSetPlaylist();
  }, [playlistId]);


  React.useEffect(() => {
    if (!api || !playlist || playlist.items.length === 0) {
      return
    }

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }
    
    api.on("select", onSelect)
    
    const currentItem = playlist.items[current]
    const timer = setTimeout(() => {
      // Check if carousel is still mounted and has items
      if (api.scrollSnapList().length > 0) {
         api.scrollNext()
      }
    }, currentItem.duration * 1000)

    return () => {
      clearTimeout(timer)
      if (api) {
        api.off("select", onSelect)
      }
    }
  }, [api, current, playlist])

  if (isLoading) {
    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-primary-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p>Carregando playlist...</p>
        </div>
    );
  }

  if (!playlist) {
    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-destructive-foreground">
            <h1 className="text-3xl font-bold">Playlist não encontrada</h1>
            <p>A playlist com o ID '{playlistId}' não pôde ser carregada.</p>
        </div>
    );
  }
  
  if (playlist.items.length === 0) {
    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-primary-foreground">
            <h1 className="text-3xl font-bold">{playlist.name}</h1>
            <p>Esta playlist não contém itens para exibir.</p>
        </div>
    );
  }


  return (
    <Carousel setApi={setApi} className="w-full h-full" opts={{loop: true}}>
      <CarouselContent>
        {playlist.items.map((item, index) => (
          <CarouselItem key={`${item.id}-${index}`}>
            <Card className="h-screen w-screen border-0 rounded-none bg-black flex items-center justify-center">
              <CardContent className="flex items-center justify-center p-0 w-full h-full">
                {item.type === 'Image' && (
                  <Image
                    src={item.src!}
                    alt={item.name}
                    width={1920}
                    height={1080}
                    className="object-contain w-full h-full"
                    data-ai-hint={item.dataAiHint}
                    unoptimized // Add this if you use external or non-standard image sources
                  />
                )}
                {item.type === 'Video' && (
                  <video
                    src={item.src!}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    // The loop attribute is handled by the carousel's loop option.
                    // Only loop manually if it's the only item.
                    loop={playlist.items.length === 1}
                    playsInline
                    key={current === index ? item.src : undefined} // Force re-render on slide change to restart video
                  />
                )}
                {item.type === 'Iframe' && (
                  <iframe
                    src={item.src!}
                    className="w-full h-full border-0"
                    allowFullScreen
                    key={item.id} // Add key for iframes to force re-render on change
                  />
                )}
                {item.type === 'Text' && (
                   <div className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-primary to-blue-800 w-full h-full">
                     <h1 className="text-7xl font-bold text-primary-foreground drop-shadow-lg">
                       {item.content}
                     </h1>
                     <p className="mt-4 text-3xl text-primary-foreground/80 drop-shadow">
                        {item.subContent}
                     </p>
                   </div>
                )}
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
