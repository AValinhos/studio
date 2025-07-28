
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileUp, Loader2, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface MediaItem {
  id: string;
  name: string;
  type: string;
  src?: string;
  content?: string;
  subContent?: string;
  date: string;
}

export default function MediaManager() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedSrc, setEditedSrc] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedSubContent, setEditedSubContent] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Falha ao buscar dados');
      const data = await res.json();
      setMediaItems(data.mediaItems);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar a biblioteca de mídia." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (itemId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_MEDIA', payload: { id: itemId } }),
      });
      if (!res.ok) throw new Error('Falha ao deletar item');
      toast({ title: "Sucesso!", description: "Item de mídia deletado." });
      fetchData(); // Refresh data
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (item: MediaItem) => {
    setEditingItem(item);
    setEditedName(item.name);
    if (item.type === 'Text') {
        setEditedContent(item.content || '');
        setEditedSubContent(item.subContent || '');
    } else if (item.type.startsWith('video/') || item.type === 'Iframe' || item.type.startsWith('image/')) {
        setEditedSrc(item.src || '');
    }
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editedName.trim()) {
        toast({ variant: "destructive", title: "Erro", description: "O nome não pode ser vazio." });
        return;
    }
    setIsProcessing(true);

    const updates: Partial<MediaItem> = { name: editedName };
    if (editingItem.type === 'Text') {
        updates.content = editedContent;
        updates.subContent = editedSubContent;
    } else if (editingItem.type.startsWith('video/') || editingItem.type === 'Iframe' || editingItem.type.startsWith('image/')) {
        updates.src = editedSrc;
    }

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            action: 'UPDATE_MEDIA', 
            payload: { id: editingItem.id, updates } 
        }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar item');
      toast({ title: "Sucesso!", description: "Item de mídia atualizado." });
      fetchData();
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const getBadgeText = (type: string) => {
    if (type.startsWith('image/')) return 'Imagem';
    if (type.startsWith('video/')) return 'Vídeo';
    if (type === 'Iframe') return 'Iframe';
    if (type === 'Text') return 'Texto';
    return type;
  }

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>Biblioteca de Mídia</CardTitle>
          <CardDescription>Gerencie seu conteúdo enviado.</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="gap-1" disabled>
          <FileUp className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Exportar
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && mediaItems.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Adicionada</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediaItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'Iframe' || item.type === 'Text' ? 'secondary' : 'outline'}>
                      {getBadgeText(item.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isProcessing}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                         <DropdownMenuItem onClick={() => handleEditClick(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Deletar
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso irá deletar permanentemente o item de mídia e removê-lo de todas as playlists.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">
                                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Deletar
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Mostrando <strong>1-{mediaItems.length}</strong> de <strong>{mediaItems.length}</strong> itens
        </div>
      </CardFooter>
    </Card>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
            <DialogTitle>Editar Mídia</DialogTitle>
            <DialogDescription>
                Altere os detalhes do seu item de mídia aqui. Clique em salvar quando terminar.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                        Nome
                    </Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
                </div>
                {editingItem?.type === 'Text' && (
                  <>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="content" className="text-right pt-2">
                            Conteúdo
                        </Label>
                        <Textarea id="content" value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="subcontent" className="text-right pt-2">
                            Subconteúdo
                        </Label>
                        <Textarea id="subcontent" value={editedSubContent} onChange={(e) => setEditedSubContent(e.target.value)} className="col-span-3" />
                    </div>
                  </>
                )}
                {(editingItem?.type.startsWith('video/') || editingItem?.type === 'Iframe' || editingItem?.type.startsWith('image/')) && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="src" className="text-right">
                            URL/Origem
                        </Label>
                        <Input id="src" value={editedSrc} onChange={(e) => setEditedSrc(e.target.value)} className="col-span-3" />
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSaveEdit} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Salvar alterações"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
