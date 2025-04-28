
// Fix type casting for guarantor ID types
<Select 
  defaultValue={guarantor.id_type || "ghana_card"}
  onValueChange={(value) => {
    const updatedGuarantors = [...guarantors];
    updatedGuarantors[index].id_type = value as IdType;
    setGuarantors(updatedGuarantors);
  }}
>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select ID type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="ghana_card">Ghana Card</SelectItem>
    <SelectItem value="voter_id">Voter ID</SelectItem>
    <SelectItem value="passport">Passport</SelectItem>
  </SelectContent>
</Select>
