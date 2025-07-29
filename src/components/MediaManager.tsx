
'use client';

import { useState, useEffect, useMemo } from 'react';
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
  DialogClose,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileUp, Loader2, Edit, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { MediaItem } from '@/app/page';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';

interface MediaManagerProps {
  mediaItems: MediaItem[];
  onMediaUpdate: () => void;
  isLoading: boolean;
}

export default function MediaManager({ mediaItems, onMediaUpdate, isLoading }: MediaManagerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  
  const [editedName, setEditedName] = useState('');
  const [editedSrc, setEditedSrc] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedSubContent, setEditedSubContent] = useState('');
  const [editedBgColor, setEditedBgColor] = useState('#228B22');
  const [showFooter, setShowFooter] = useState(false);
  const [footerText1, setFooterText1] = useState('');
  const [footerText2, setFooterText2] = useState('');
  const [footerBgColor, setFooterBgColor] = useState('#dc2626');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredItems = useMemo(() => {
    return mediaItems.filter(item => {
        if (filterType === 'all') return true;
        if (filterType === 'image') return item.type.startsWith('image/');
        if (filterType === 'video') return item.type.startsWith('video/');
        if (filterType === 'iframe') return item.type === 'Iframe';
        if (filterType === 'text') return item.type === 'Text';
        return true;
    });
  }, [mediaItems, filterType]);

  useEffect(() => {
    setSelectedItems([]);
  }, [filterType]);
  
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
      onMediaUpdate();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
        const res = await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'BULK_DELETE_MEDIA', payload: { ids: selectedItems } }),
        });
        if (!res.ok) throw new Error('Falha ao deletar itens');
        toast({ title: "Sucesso!", description: `${selectedItems.length} itens de mídia deletados.` });
        setSelectedItems([]);
        onMediaUpdate();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
        setIsProcessing(false);
        setIsBulkDeleteDialogOpen(false);
    }
  };

  const handleEditClick = (item: MediaItem) => {
    setEditingItem(item);
    setEditedName(item.name);
    setEditedSrc(item.src || '');
    setEditedContent(item.content || '');
    setEditedSubContent(item.subContent || '');
    setEditedBgColor(item.bgColor || '#228B22');
    setShowFooter(item.showFooter || false);
    setFooterText1(item.footerText1 || '');
    setFooterText2(item.footerText2 || '');
    setFooterBgColor(item.footerBgColor || '#dc2626');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editedName.trim()) {
        toast({ variant: "destructive", title: "Erro", description: "O nome não pode ser vazio." });
        return;
    }
    setIsProcessing(true);

    const updates: Partial<MediaItem> = { 
        name: editedName,
        src: editedSrc,
        content: editedContent,
        subContent: editedSubContent,
        bgColor: editedBgColor,
        showFooter: showFooter,
        footerText1: footerText1,
        footerText2: footerText2,
        footerBgColor: footerBgColor,
    };

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
      onMediaUpdate();
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
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedItems(filteredItems.map(item => item.id));
    } else {
        setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
        setSelectedItems(prev => [...prev, id]);
    } else {
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Biblioteca de Mídia</CardTitle>
                <CardDescription>Gerencie seu conteúdo enviado.</CardDescription>
            </div>
            <div className='flex items-center gap-2 flex-wrap'>
                {selectedItems.length > 0 && (
                     <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-1" 
                        onClick={() => setIsBulkDeleteDialogOpen(true)}
                        disabled={isProcessing}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        Deletar ({selectedItems.length})
                    </Button>
                )}
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Tipos</SelectItem>
                        <SelectItem value="image">Imagem</SelectItem>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="iframe">Iframe</SelectItem>
                        <SelectItem value="text">Texto</SelectItem>
                    </SelectContent>
                </Select>
                 <Button size="sm" variant="outline" className="gap-1" disabled>
                    <FileUp className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Exportar
                    </span>
                </Button>
            </div>
        </div>
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
                <TableHead>
                    <Checkbox
                        checked={selectedItems.length > 0 && selectedItems.length === filteredItems.length && filteredItems.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Selecionar todos"
                        disabled={filteredItems.length === 0}
                    />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data Adicionada</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} data-state={selectedItems.includes(item.id) && "selected"}>
                   <TableCell>
                        <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            aria-label={`Selecionar ${item.name}`}
                        />
                   </TableCell>
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
          Mostrando <strong>1-{filteredItems.length}</strong> de <strong>{filteredItems.length}</strong> itens
        </div>
      </CardFooter>
    </Card>

    <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso irá deletar permanentemente os {selectedItems.length} itens de mídia selecionados e removê-los de todas as playlists.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deletar Selecionados"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Editar Mídia</DialogTitle>
                <DialogDescription>
                    Altere os detalhes do seu item de mídia aqui. Clique em salvar quando terminar.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="col-span-3" />
                </div>
                
                {editingItem?.type === 'Text' ? (
                  <>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="content" className="text-right pt-2">Conteúdo</Label>
                        <Textarea id="content" value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="subcontent" className="text-right pt-2">Subconteúdo</Label>
                        <Textarea id="subcontent" value={editedSubContent} onChange={(e) => setEditedSubContent(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="text-bgcolor-edit" className="text-right">Cor Fundo</Label>
                        <Input id="text-bgcolor-edit" type="color" value={editedBgColor} onChange={(e) => setEditedBgColor(e.target.value)} className="col-span-3 p-1 h-10"/>
                    </div>
                  </>
                ) : (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="src" className="text-right">URL/Origem</Label>
                        <Textarea id="src" value={editedSrc} onChange={(e) => setEditedSrc(e.target.value)} className="col-span-3" />
                    </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Mostrar Rodapé</Label>
                            <DialogDescription>Ative para exibir um rodapé sobre este item.</DialogDescription>
                        </div>
                        <Switch checked={showFooter} onCheckedChange={setShowFooter} />
                    </div>

                    {showFooter && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="footer-text1" className="text-right">Texto 1</Label>
                                <Input id="footer-text1" value={footerText1} onChange={(e) => setFooterText1(e.target.value)} className="col-span-3" placeholder="Ex: URGENTE"/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="footer-text2" className="text-right">Texto 2</Label>
                                <Input id="footer-text2" value={footerText2} onChange={(e) => setFooterText2(e.target.value)} className="col-span-3" placeholder="Ex: NOTÍCIA DE ÚLTIMA HORA"/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="footer-bgcolor" className="text-right">Cor de Fundo</Label>
                                <Input id="footer-bgcolor" type="color" value={footerBgColor} onChange={(e) => setFooterBgColor(e.target.value)} className="col-span-3 p-1 h-10"/>
                            </div>
                        </div>
                    )}
                </div>

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
