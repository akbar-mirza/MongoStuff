import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@heroui/react";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useCostRatesStore } from "../../stores/costRates.store";

/**
 * Popover to edit the pricing rates used for cost estimates.
 * Rates persist in localStorage.
 */
export default function RateSettings() {
  const { storageRatePerGBMonth, egressRatePerGB, setRates, resetRates } =
    useCostRatesStore();

  const [isOpen, setIsOpen] = useState(false);
  const [storageRate, setStorageRate] = useState(String(storageRatePerGBMonth));
  const [egressRate, setEgressRate] = useState(String(egressRatePerGB));

  useEffect(() => {
    setStorageRate(String(storageRatePerGBMonth));
    setEgressRate(String(egressRatePerGB));
  }, [storageRatePerGBMonth, egressRatePerGB, isOpen]);

  const handleApply = () => {
    const storage = parseFloat(storageRate);
    const egress = parseFloat(egressRate);
    setRates({
      storageRatePerGBMonth: isNaN(storage) || storage < 0 ? 0 : storage,
      egressRatePerGB: isNaN(egress) || egress < 0 ? 0 : egress,
    });
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <PopoverTrigger>
        <Button
          size="sm"
          variant="flat"
          startContent={<SlidersHorizontal className="w-4 h-4" />}
        >
          Cost Rates
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4 w-72">
        <div className="flex flex-col gap-3 w-full">
          <p className="text-sm font-semibold text-foreground">
            Estimate Rates
          </p>
          <Input
            size="sm"
            type="number"
            label="Storage ($ / GB-month)"
            value={storageRate}
            min={0}
            step={0.001}
            onValueChange={setStorageRate}
          />
          <Input
            size="sm"
            type="number"
            label="Data Transfer Out ($ / GB)"
            value={egressRate}
            min={0}
            step={0.001}
            onValueChange={setEgressRate}
          />
          <div className="flex justify-between gap-2">
            <Button size="sm" variant="light" onPress={resetRates}>
              Reset
            </Button>
            <Button size="sm" color="primary" onPress={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
