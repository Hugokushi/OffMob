import { Metadata } from "next";
import DocumentosContent from "./DocumentosContent";

export const metadata: Metadata = {
  title: "Modelos de Documentos | Off Mob",
  description: "Gerencie modelos de documentos e gere arquivos com variáveis automáticas.",
};

export default function DocumentosPage() {
  return (
    <div className="flex flex-col h-full space-y-4 p-8">
      <DocumentosContent />
    </div>
  );
}
