"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CompanySwitcher({ companies, currentOrg }: any) {
  return (
    <div className="p-4">
      <Select defaultValue={currentOrg?.id}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent>
          {companies?.map((c: any) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}