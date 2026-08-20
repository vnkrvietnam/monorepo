"use client";

interface Props { params: { id: string } }

export default function AddressPage({ params }: Props) {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Address</h1>
      <p className="text-muted-foreground font-mono break-all">{params.id}</p>
    </main>
  );
}
