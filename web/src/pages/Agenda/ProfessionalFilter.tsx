import type { Professional } from "../../types/appointment";

type Props = {
   professionals: Professional[];
   value: string;
   onChange: (value: string) => void;
};

export function ProfessionalFilter({ professionals, value, onChange }: Props) {
   return (
      <select
         className="professional-filter"
         value={value}
         onChange={(event) => onChange(event.target.value)}
         aria-label="Filtrar por profissional"
      >
         <option value="all">Todos os profissionais</option>
         {professionals.map((professional) => (
            <option key={professional.id} value={professional.id}>
               {professional.name}
            </option>
         ))}
      </select>
   );
}
