import DisplayClient from "@/components/DisplayClient";

export default function DisplayPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch playlist data here based on params.id
  // and pass it to the client component.
  
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <DisplayClient playlistId={params.id} />
    </div>
  );
}
