import React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ComboboxEntry = {
  label: string;
  value: string;
};

type Props = {
  entries: ComboboxEntry[];
  value: string;
  setValue: (value: string) => void;
  disabled?: boolean;
};

/* https://ui.shadcn.com/docs/components/combobox */
export default function CustomCombobox({ entries, value, setValue, disabled }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {value ? entries.find((entry) => entry.value === value)?.label : "Select entry..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandEmpty>Entry not found.</CommandEmpty>
          <CommandGroup>
            {entries.map((entry) => (
              <CommandItem
                key={entry.value}
                value={entry.value}
                onSelect={(currentValue) => {
                  setValue(currentValue);
                  setOpen(false);
                }}
                className={value === entry.value ? "font-bold" : ""}
              >
                {entry.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
