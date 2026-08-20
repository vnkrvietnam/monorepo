"use client";

interface Props { params: { orderId: string } }

export default function PayPage({ params }: Props) {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Payment</h1>
      <p className="text-muted-foreground">Order ID: <span className="font-mono">{params.orderId}</span></p>
    </main>
  );
}
