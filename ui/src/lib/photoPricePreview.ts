/**
 * Calculează taxa platformei (15%) și prețul total în Wei din prețul dat ca parametru.
 *
 * @param {bigint} priceWei - Prețul inițial în Wei.
 * @returns {{ feeWei: bigint, totalPriceWei: bigint }} Un obiect:
 *   • feeWei (bigint) = 15% din `priceWei`
 *   • totalPriceWei (bigint) = `priceWei` + `feeWei`
 *
 */
export default function photoPricePreview(priceWei: bigint): { feeWei: bigint; totalPriceWei: bigint } {
  const BPS_DENOMINATOR = BigInt(10_000);
  const FEE_BPS = BigInt(1_500);
  const feeWei = (priceWei * FEE_BPS) / BPS_DENOMINATOR;
  const totalPriceWei = priceWei + feeWei;
  return { feeWei, totalPriceWei };
}
