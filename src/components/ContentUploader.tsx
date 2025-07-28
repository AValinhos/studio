'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Link, Type, Video } from 'lucide-react';

export default function ContentUploader() {
  return (
    <Card className="sm:col-span-2 md:col-span-full lg:col-span-2 xl:col-span-2">
      <CardHeader>
        <CardTitle>Content Uploader</CardTitle>
        <CardDescription>Add new media, iframes, or text to your library.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="image_video">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="image_video"><Upload className="mr-2 h-4 w-4" />Media</TabsTrigger>
            <TabsTrigger value="iframe"><Link className="mr-2 h-4 w-4" />Iframe</TabsTrigger>
            <TabsTrigger value="text"><Type className="mr-2 h-4 w-4" />Text</TabsTrigger>
          </TabsList>
          <div className="pt-6">
            <div className="grid gap-2 mb-4">
              <Label htmlFor="content-name">Content Name</Label>
              <Input id="content-name" placeholder="e.g., 'Welcome Video' or 'Weekly Dashboard'" />
            </div>
            <TabsContent value="image_video">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="media-file">Media File</Label>
                    <Input id="media-file" type="file" />
                    <p className="text-sm text-muted-foreground">Upload JPG, PNG, or MP4 files.</p>
                </div>
            </TabsContent>
            <TabsContent value="iframe">
              <div className="grid gap-2">
                <Label htmlFor="iframe-url">Iframe URL</Label>
                <Input id="iframe-url" placeholder="https://example.com/dashboard" />
              </div>
            </TabsContent>
            <TabsContent value="text">
              <div className="grid gap-2">
                <Label htmlFor="text-content">Text Content</Label>
                <Textarea id="text-content" placeholder="Enter your announcement or message here." />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button>Save Content</Button>
      </CardFooter>
    </Card>
  );
}
