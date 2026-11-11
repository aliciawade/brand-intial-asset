import { brand } from "../../brand.config";

export { brand };

export function tierById(id: string) {
  return brand.tiers.find((tier) => tier.id === id) ?? null;
}
