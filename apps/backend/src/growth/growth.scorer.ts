import { GrowthProductSummary, UpsellSuggestion, CrossSellSuggestion } from "./growth.types.js";
import { GROWTH_CONFIG } from "./growth.config.js";

export class GrowthScorer {
  /**
   * Category-aware detection of grounded feature improvements.
   * Only recognized product fields can contribute improvement claims and points.
   */
  static detectImprovements(
    source: GrowthProductSummary,
    target: GrowthProductSummary
  ): string[] {
    const improvements: string[] = [];
    const sf = source.features || {};
    const tf = target.features || {};

    // 1. Rating Improvement
    if (target.rating > source.rating) {
      improvements.push(
        `Rating improves from ${source.rating.toFixed(1)} to ${target.rating.toFixed(1)}`
      );
    }

    // 2. Battery Life (Hours)
    if (
      typeof tf.batteryLifeHours === "number" &&
      typeof sf.batteryLifeHours === "number" &&
      tf.batteryLifeHours > sf.batteryLifeHours
    ) {
      improvements.push(
        `Battery life increases from ${sf.batteryLifeHours}h to ${tf.batteryLifeHours}h`
      );
    }

    // 3. Battery Life (Days)
    if (
      typeof tf.batteryLifeDays === "number" &&
      typeof sf.batteryLifeDays === "number" &&
      tf.batteryLifeDays > sf.batteryLifeDays
    ) {
      improvements.push(
        `Battery life increases from ${sf.batteryLifeDays} to ${tf.batteryLifeDays} days`
      );
    }

    // 4. Power Bank Capacity
    if (
      typeof tf.capacityMah === "number" &&
      typeof sf.capacityMah === "number" &&
      tf.capacityMah > sf.capacityMah
    ) {
      improvements.push(
        `Capacity increases from ${sf.capacityMah.toLocaleString()}mAh to ${tf.capacityMah.toLocaleString()}mAh`
      );
    }

    // 5. Active Noise Cancellation
    if (tf.noiseCancellation === true && !sf.noiseCancellation) {
      improvements.push("Adds active noise cancellation");
    }

    // 6. Built-in GPS
    if (tf.gps === true && !sf.gps) {
      improvements.push("Adds built-in GPS maps tracking");
    }

    // 7. Fast Charging
    if (tf.fastCharging === true && !sf.fastCharging) {
      improvements.push("Adds rapid fast charging support");
    }

    // 8. AMOLED Display
    if (
      typeof tf.display === "string" &&
      tf.display.toLowerCase() === "amoled" &&
      (!sf.display || String(sf.display).toLowerCase() !== "amoled")
    ) {
      improvements.push("Upgrades to high-contrast AMOLED display");
    }

    // 9. Water Resistance Upgrade
    if (
      typeof tf.waterResistance === "string" &&
      (!sf.waterResistance || sf.waterResistance !== tf.waterResistance)
    ) {
      improvements.push(`Upgrades water resistance to ${tf.waterResistance}`);
    }

    // 10. Power Output / Wattage
    if (
      typeof tf.outputPowerWatts === "number" &&
      typeof sf.outputPowerWatts === "number" &&
      tf.outputPowerWatts > sf.outputPowerWatts
    ) {
      improvements.push(
        `Output power increases from ${sf.outputPowerWatts}W to ${tf.outputPowerWatts}W`
      );
    }

    if (
      typeof tf.maxWattage === "number" &&
      typeof sf.maxWattage === "number" &&
      tf.maxWattage > sf.maxWattage
    ) {
      improvements.push(
        `Max charging speed increases from ${sf.maxWattage}W to ${tf.maxWattage}W`
      );
    }

    return improvements;
  }

  /**
   * Evaluate if a target product qualifies as a valid UPSELL for a source product.
   */
  static isValidUpsell(
    source: GrowthProductSummary,
    target: GrowthProductSummary,
    customMaxMultiplier = GROWTH_CONFIG.MAX_PRICE_MULTIPLIER
  ): { valid: boolean; improvements: string[] } {
    // 1. Same category strictly
    if (source.category.toLowerCase().trim() !== target.category.toLowerCase().trim()) {
      return { valid: false, improvements: [] };
    }

    // 2. Active and in-stock
    if (target.stock <= 0) {
      return { valid: false, improvements: [] };
    }

    // 3. Not identical product
    if (source.id === target.id) {
      return { valid: false, improvements: [] };
    }

    // 4. Target price > source price
    if (target.price <= source.price) {
      return { valid: false, improvements: [] };
    }

    // 5. Reasonable price delta guard (e.g. <= 1.4x source price)
    const maxAllowedPrice = source.price * customMaxMultiplier;
    if (target.price > maxAllowedPrice) {
      return { valid: false, improvements: [] };
    }

    // 6. Meaningful improvement requirement
    const improvements = this.detectImprovements(source, target);
    if (improvements.length === 0) {
      return { valid: false, improvements: [] };
    }

    return { valid: true, improvements };
  }

  /**
   * Deterministic mathematical scoring for an eligible upsell candidate.
   */
  static scoreUpsell(
    source: GrowthProductSummary,
    target: GrowthProductSummary,
    improvements: string[],
    priority = 1
  ): number {
    const w = GROWTH_CONFIG.UPSELL_WEIGHTS;

    // 1. Feature Improvement (40 points): 20 base for 1 improvement, +10 for each extra up to 40
    const featureScore = Math.min(
      w.FEATURE_IMPROVEMENT,
      20 + (improvements.length - 1) * 10
    );

    // 2. Rating Improvement (20 points)
    const ratingDelta = target.rating - source.rating;
    let ratingScore = 0;
    if (ratingDelta > 0) {
      ratingScore = Math.min(w.RATING_IMPROVEMENT, Math.round(ratingDelta * 30));
    } else if (target.rating >= 4.4) {
      ratingScore = 12; // High baseline rating
    }

    // 3. Price Reasonableness (20 points): smaller delta % gets higher points
    const delta = target.price - source.price;
    const deltaRatio = delta / source.price; // between 0.01 and 0.40
    const priceScore = Math.min(
      w.PRICE_REASONABLENESS,
      Math.max(5, Math.round(w.PRICE_REASONABLENESS * (1 - deltaRatio / 0.40)))
    );

    // 4. Relationship Priority (15 points)
    const priorityScore = priority === 1 ? w.RELATIONSHIP_PRIORITY : priority === 2 ? 10 : 5;

    // 5. Stock (5 points)
    const stockScore = target.stock > 0 ? w.STOCK : 0;

    const total = featureScore + ratingScore + priceScore + priorityScore + stockScore;
    return Math.min(100, Math.max(0, Math.round(total)));
  }

  /**
   * Deterministic mathematical scoring for a cross-sell or accessory candidate.
   */
  static scoreCrossSell(
    target: GrowthProductSummary,
    priority = 1
  ): number {
    const w = GROWTH_CONFIG.CROSS_SELL_WEIGHTS;

    // 1. Priority (40 points)
    const priorityScore = priority === 1 ? w.RELATIONSHIP_PRIORITY : priority === 2 ? 25 : 15;

    // 2. Rating Quality (30 points)
    const ratingScore = Math.round((Math.min(5, Math.max(0, target.rating)) / 5.0) * w.RATING_QUALITY);

    // 3. Price Reasonableness (20 points)
    const priceScore = target.price <= 2000 ? 20 : target.price <= 5000 ? 15 : 10;

    // 4. Stock (10 points)
    const stockScore = target.stock > 0 ? w.STOCK : 0;

    return Math.min(100, Math.max(0, priorityScore + ratingScore + priceScore + stockScore));
  }
}
