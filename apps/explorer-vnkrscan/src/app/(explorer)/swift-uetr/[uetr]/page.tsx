"use client";

interface Props { params: { uetr: string } }

export default function SwiftUetrPage({ params }: Props) {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">SWIFT UETR</h1>
      <p className="text-muted-foreground font-mono break-all">{params.uetr}</p>
    </main>
  );
}
