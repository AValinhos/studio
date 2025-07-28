'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, XCircle, GripVertical } from 'lucide-react';
import Link from 'next/link';

const availableMedia = [
  { name: 'Welcome Video', type: 'Video' },
  { name: 'Q3 Sales Dashboard', type: 'Iframe' },
  { name: 'Company Anniversary', type: 'Image' },
  { name: 'Holiday Schedule', type: 'Text' },
];

const playlistItems = [
    { name: 'Company Anniversary', type: 'Image', duration: 10 },
    { name: 'Welcome Video', type: 'Video', duration: 30 },
];

export default function PlaylistManager() {
  return (
    <Card className="sm:col-span-2 md:col-span-full lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle>Playlist Editor</CardTitle>
        <CardDescription>
          Create and manage playlists for your screens. The current playlist URL is: <Link href="/display/1" className="underline text-primary">/display/1</Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Select defaultValue="lobby-playlist">
          <SelectTrigger>
            <SelectValue placeholder="Select a playlist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lobby-playlist">Lobby Playlist</SelectItem>
            <SelectItem value="cafeteria-playlist">Cafeteria Playlist</SelectItem>
            <SelectItem value="new-playlist">Create New Playlist...</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Available Media</h3>
            <ScrollArea className="h-48 rounded-md border p-2">
                {availableMedia.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <span className="text-sm">{item.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </ScrollArea>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Playlist Items</h3>
             <ScrollArea className="h-48 rounded-md border p-2">
                {playlistItems.map(item => (
                     <div key={item.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted group">
                        <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab group-hover:opacity-100 opacity-0" />
                            <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Input type="number" defaultValue={item.duration} className="w-16 h-8 text-sm" />
                             <span className="text-xs text-muted-foreground">sec</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6">
                                <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
             </ScrollArea>
          </div>
        </div>
      </CardContent>
       <CardFooter className="border-t px-6 py-4">
        <Button>Save Playlist</Button>
      </CardFooter>
    </Card>
  );
}
