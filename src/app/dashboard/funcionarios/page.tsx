import { Metadata } from "next";
import FuncionariosContent from "./FuncionariosContent";

export const metadata: Metadata = {
  title: "Funcionários | Off Mob",
  description: "Gerencie a equipe de funcionários da empresa.",
};

export default function FuncionariosPage() {
  return (
    <div className="flex flex-col h-full space-y-4 p-8">
      <FuncionariosContent />
    </div>
  );
}
