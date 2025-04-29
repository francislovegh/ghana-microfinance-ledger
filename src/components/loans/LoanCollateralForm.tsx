
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";

export interface Collateral {
  id: string;
  collateral_type: string;
  description: string;
  value: number;
  document_url?: string | null;
}

interface CollateralFormProps {
  collaterals: Collateral[];
  onChange: (collaterals: Collateral[]) => void;
}

const LoanCollateralForm = ({ collaterals, onChange }: CollateralFormProps) => {
  const addCollateral = () => {
    onChange([
      ...collaterals,
      {
        id: nanoid(),
        collateral_type: "real_estate",
        description: "",
        value: 0,
        document_url: null
      }
    ]);
  };

  const removeCollateral = (id: string) => {
    onChange(collaterals.filter(col => col.id !== id));
  };

  const updateCollateral = (id: string, field: keyof Collateral, value: string | number) => {
    onChange(
      collaterals.map(col => {
        if (col.id === id) {
          return { ...col, [field]: value };
        }
        return col;
      })
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Collaterals (Optional)</CardTitle>
        <Button size="sm" variant="outline" onClick={addCollateral}>
          <Plus size={16} className="mr-1" /> Add Collateral
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {collaterals.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No collaterals added yet</p>
          ) : (
            collaterals.map((collateral, index) => (
              <div key={collateral.id} className="space-y-3 pb-4 border-b last:border-0">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Collateral {index + 1}</h4>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeCollateral(collateral.id)}
                  >
                    <Trash2 size={16} className="mr-1" /> Remove
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Collateral Type</Label>
                    <Select 
                      value={collateral.collateral_type} 
                      onValueChange={(value) => updateCollateral(collateral.id, "collateral_type", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select collateral type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="vehicle">Vehicle</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="financial">Financial Instrument</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the collateral"
                      value={collateral.description}
                      onChange={(e) => updateCollateral(collateral.id, "description", e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Estimated Value (₵)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={collateral.value || ""}
                      onChange={(e) => updateCollateral(collateral.id, "value", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanCollateralForm;
