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

// Mock data, in a real app this would be fetched based on playlistId
const mockPlaylist = {
  id: '1',
  name: 'Lobby Playlist',
  items: [
    { type: 'image', src: 'https://placehold.co/1920x1080/3F51B5/FFFFFF', duration: 8, dataAiHint: 'corporate office' },
    { type: 'text', content: 'Welcome to Our Company', subContent: 'We are glad to have you here.', duration: 8 },
    { type: 'video', src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: 20 },
    { type: 'iframe', src: 'https://time.is', duration: 15 },
    { type: 'image', src: 'https://placehold.co/1920x1080/81D4FA/000000', duration: 8, dataAiHint: 'team collaboration' },
  ]
}

export default function DisplayClient({ playlistId }: { playlistId: string }) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    if (!api) {
      return
    }

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }
    
    api.on("select", onSelect)
    
    const currentItem = mockPlaylist.items[current]
    const timer = setTimeout(() => {
      api.scrollNext()
    }, currentItem.duration * 1000)

    return () => {
      clearTimeout(timer)
      api.off("select", onSelect)
    }
  }, [api, current])


  return (
    <Carousel setApi={setApi} className="w-full h-full" opts={{loop: true}}>
      <CarouselContent>
        {mockPlaylist.items.map((item, index) => (
          <CarouselItem key={index}>
            <Card className="h-screen w-screen border-0 rounded-none bg-black flex items-center justify-center">
              <CardContent className="flex items-center justify-center p-0 w-full h-full">
                {item.type === 'image' && (
                  <Image
                    src={item.src}
                    alt="Playlist Image"
                    width={1920}
                    height={1080}
                    className="object-contain w-full h-full"
                    data-ai-hint={item.dataAiHint}
                  />
                )}
                {item.type === 'video' && (
                  <video
                    src={item.src}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted
                    loop={api?.selectedScrollSnap() === index} // Only loop if it's the only item
                    playsInline
                  />
                )}
                {item.type === 'iframe' && (
                  <iframe
                    src={item.src}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                )}
                {item.type === 'text' && (
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
