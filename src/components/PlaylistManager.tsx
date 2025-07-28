
'use client'
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, XCircle, GripVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  name: string;
  type: string;
  src?: string;
  content?: string;
  subContent?: string;
  date: string;
}

interface PlaylistItem {
  mediaId: string;
  duration: number;
  name: string; 
}

interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
}

export default function PlaylistManager() {
  const [data, setData] = useState<{ mediaItems: MediaItem[], playlists: Playlist[] } | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/data');
        if (!res.ok) throw new Error('Failed to fetch data');
        const jsonData = await res.json();
        
        // Add name to playlist items for display
        jsonData.playlists.forEach((p: Playlist) => {
            p.items.forEach(item => {
                const media = jsonData.mediaItems.find((m: MediaItem) => m.id === item.mediaId);
                item.name = media ? media.name : 'Unknown Media';
            });
        });
        
        setData(jsonData);
        if (jsonData.playlists.length > 0) {
            setSelectedPlaylistId(jsonData.playlists[0].id);
        }

      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar os dados." });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const selectedPlaylist = data?.playlists.find(p => p.id === selectedPlaylistId);

  const handleAddToPlaylist = (mediaId: string) => {
    if (!data || !selectedPlaylist) return;

    const media = data.mediaItems.find(m => m.id === mediaId);
    if (!media) return;

    const newPlaylistItem: PlaylistItem = {
      mediaId,
      duration: 10, // default duration
      name: media.name,
    };
    
    const updatedPlaylist = {
      ...selectedPlaylist,
      items: [...selectedPlaylist.items, newPlaylistItem],
    };
    
    updatePlaylistInState(updatedPlaylist);
  };

  const handleRemoveFromPlaylist = (index: number) => {
    if (!selectedPlaylist) return;

    const updatedItems = selectedPlaylist.items.filter((_, i) => i !== index);
    const updatedPlaylist = { ...selectedPlaylist, items: updatedItems };

    updatePlaylistInState(updatedPlaylist);
  };

  const handleDurationChange = (index: number, newDuration: number) => {
    if (!selectedPlaylist) return;
    
    const updatedItems = [...selectedPlaylist.items];
    updatedItems[index].duration = newDuration > 0 ? newDuration : 1;
    const updatedPlaylist = { ...selectedPlaylist, items: updatedItems };

    updatePlaylistInState(updatedPlaylist);
  };
  
  const updatePlaylistInState = (updatedPlaylist: Playlist) => {
      if (!data) return;
      const updatedPlaylists = data.playlists.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p);
      setData({ ...data, playlists: updatedPlaylists });
  }

  const handleSaveChanges = async () => {
      if(!data) return;
      setIsSaving(true);
      
      // Create a clean version of playlists for saving (without the 'name' property in items)
      const playlistsToSave = data.playlists.map(p => ({
          ...p,
          items: p.items.map(({mediaId, duration}) => ({mediaId, duration}))
      }));
      
      const dataToSave = { ...data, playlists: playlistsToSave };

      try {
          const res = await fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataToSave)
          });
          if (!res.ok) throw new Error('Failed to save changes');
          toast({ title: "Sucesso!", description: "Playlist salva com sucesso." });
      } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao salvar a playlist.' });
      } finally {
          setIsSaving(false);
      }
  };


  if (isLoading) {
    return (
      <Card className="sm:col-span-2 md:col-span-full lg:col-span-2 xl:col-span-2 flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const availableMedia = data?.mediaItems.filter(
    media => !selectedPlaylist?.items.some(item => item.mediaId === media.id)
  ) || [];

  return (
    <Card className="sm:col-span-2 md:col-span-full lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle>Playlist Editor</CardTitle>
        <CardDescription>
          Crie e gerencie playlists. URL atual: <Link href={`/display/${selectedPlaylistId}`} className="underline text-primary">{`/display/${selectedPlaylistId}`}</Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma playlist" />
          </SelectTrigger>
          <SelectContent>
            {data?.playlists.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
            {/* <SelectItem value="new-playlist">Criar Nova Playlist...</SelectItem> */}
          </SelectContent>
        </Select>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Mídias Disponíveis</h3>
            <ScrollArea className="h-48 rounded-md border p-2">
                {availableMedia.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                        <span className="text-sm">{item.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAddToPlaylist(item.id)}>
                            <PlusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {availableMedia.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Todas as mídias já estão na playlist.</p>}
            </ScrollArea>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Itens da Playlist</h3>
             <ScrollArea className="h-48 rounded-md border p-2">
                {selectedPlaylist?.items.map((item, index) => (
                     <div key={`${item.mediaId}-${index}`} className="flex items-center justify-between p-2 rounded-md hover:bg-muted group">
                        <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab group-hover:opacity-100 opacity-0" />
                            <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Input 
                                type="number" 
                                value={item.duration} 
                                onChange={(e) => handleDurationChange(index, parseInt(e.target.value))}
                                className="w-16 h-8 text-sm" 
                             />
                             <span className="text-xs text-muted-foreground">seg</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFromPlaylist(index)}>
                                <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
                {selectedPlaylist?.items.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Playlist vazia.</p>}
             </ScrollArea>
          </div>
        </div>
      </CardContent>
       <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Salvar Playlist
        </Button>
      </CardFooter>
    </Card>
  );
}
