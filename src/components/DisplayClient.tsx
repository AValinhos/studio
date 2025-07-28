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
import { cn } from '@/lib/utils'
import data from '@/lib/data.json';


const getPlaylistById = (id: string) => {
  const playlist = data.playlists.find(p => p.id === id);
  if (!playlist) return null;

  const items = playlist.items.map(item => {
    const media = data.mediaItems.find(m => m.id === item.mediaId);
    if (!media) return null;
    return {
      ...media,
      duration: item.duration,
    }
  }).filter(Boolean);

  return { ...playlist, items };
}


export default function DisplayClient({ playlistId }: { playlistId: string }) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [playlist, setPlaylist] = React.useState<any>(null);

  React.useEffect(() => {
    setPlaylist(getPlaylistById(playlistId));
  }, [playlistId]);


  React.useEffect(() => {
    if (!api || !playlist) {
      return
    }

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }
    
    api.on("select", onSelect)
    
    const currentItem = playlist.items[current]
    const timer = setTimeout(() => {
      api.scrollNext()
    }, currentItem.duration * 1000)

    return () => {
      clearTimeout(timer)
      api.off("select", onSelect)
    }
  }, [api, current, playlist])

  if (!playlist) {
    return <div>Loading...</div>
  }


  return (
    <Carousel setApi={setApi} className="w-full h-full" opts={{loop: true}}>
      <CarouselContent>
        {playlist.items.map((item: any, index: number) => (
          <CarouselItem key={index}>
            <Card className="h-screen w-screen border-0 rounded-none bg-black flex items-center justify-center">
              <CardContent className="flex items-center justify-center p-0 w-full h-full">
                {item.type === 'Image' && (
                  <Image
                    src={item.src}
                    alt="Playlist Image"
                    width={1920}
                    height={1080}
                    className="object-contain w-full h-full"
                    data-ai-hint={item.dataAiHint}
                  />
                )}
                {item.type === 'Video' && (
                  <video
                    src={item.src}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop={api?.selectedScrollSnap() === index} // Only loop if it's the only item
                    playsInline
                  />
                )}
                {item.type === 'Iframe' && (
                  <iframe
                    src={item.src}
                    className="w-full h-full border-0"
                    allowFullScreen
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
