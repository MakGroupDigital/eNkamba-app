import EnkambaAIModule from './enkamba-ai-module';

export function generateStaticParams() {
  return [];
}

export default async function AiChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;

  return <EnkambaAIModule params={resolvedParams} />;
}
