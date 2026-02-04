import EnkambaAIModule from './enkamba-ai-module';

export function generateStaticParams() {
  return [];
}

export default function AiChatPage({ params }: { params: { id: string } }) {
  return <EnkambaAIModule params={params} />;
}
