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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileUp } from 'lucide-react';

const mediaItems = [
  { name: 'Welcome Video', type: 'Video', date: '2023-10-25' },
  { name: 'Q3 Sales Dashboard', type: 'Iframe', date: '2023-10-24' },
  { name: 'Company Anniversary', type: 'Image', date: '2023-10-22' },
  { name: 'Holiday Schedule', type: 'Text', date: '2023-10-20' },
  { name: 'New Product Launch', type: 'Image', date: '2023-10-18' },
];

export default function MediaManager() {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>Manage your uploaded content.</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="gap-1">
          <FileUp className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Export
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaItems.map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.type === 'Iframe' || item.type === 'Text' ? 'secondary' : 'outline'}>{item.type}</Badge>
                </TableCell>
                <TableCell>{item.date}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Add to Playlist</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-5</strong> of <strong>{mediaItems.length}</strong> items
        </div>
      </CardFooter>
    </Card>
  );
}
