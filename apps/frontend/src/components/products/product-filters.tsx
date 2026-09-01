import React from "react";
import { Select } from "../ui/select";
import { Input } from "../ui/input";

interface ProductFiltersProps {
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

const CATEGORIES = ["Headphones", "Earbuds", "Smartwatches", "Speakers", "Power Banks", "Accessories"];
const BRANDS = ["Auralite", "Nimbus", "SonicArc", "WaveCore", "AeroFlow", "EchoPro", "AcousticMax", "PulseBuds", "AirTone", "EchoPods", "NovaBuds", "VibeBuds", "SonicPods", "AeroBuds", "PulseWatch", "OrbitFit", "NovaWatch", "MotionOne", "VigorFit", "SummitPro", "Horizon", "BoomCore", "SoundArc", "EchoBox", "WaveBeat", "VibeCylinder", "ArenaSound", "StereoCast", "VoltCore", "PowerPod", "ChargeMax", "VoltGo", "Energetic", "PowerVault", "FlexCharge", "PowerBrick", "VoltNode", "NoteSlate", "AeroCharge", "CanvasPad"];

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const currentMinRating = filters.minRating ? parseFloat(filters.minRating) : null;

  return (
    <div className="space-y-6 p-5 rounded-2xl border border-white/[0.08] bg-[#120E1F]/68 backdrop-blur-xl shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <h3 className="font-bold text-sm tracking-tight text-[#F8F7FC]">Filters</h3>
        <button
          onClick={onClearFilters}
          className="text-xs font-semibold text-[#A855F7] hover:text-[#8B5CF6] transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Category Dropdown */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#A39CAF]">Category</label>
        <Select
          value={filters.category || ""}
          onChange={(e) => onFilterChange("category", e.target.value)}
          className="w-full bg-[#0B0912] border-white/[0.08] text-[#F8F7FC] hover:border-white/12 h-10 rounded-xl"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {/* Brand Dropdown */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#A39CAF]">Brand</label>
        <Select
          value={filters.brand || ""}
          onChange={(e) => onFilterChange("brand", e.target.value)}
          className="w-full bg-[#0B0912] border-white/[0.08] text-[#F8F7FC] hover:border-white/12 h-10 rounded-xl"
        >
          <option value="">All Brands</option>
          {BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </Select>
      </div>

      {/* Max Price Slider + Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A39CAF]">Max Price (₹)</label>
          {filters.maxPrice && (
            <span className="text-xs font-semibold text-[#8B5CF6]">
              ₹{parseFloat(filters.maxPrice).toLocaleString()}
            </span>
          )}
        </div>
        <div className="space-y-3">
          <input
            type="range"
            min="0"
            max="25000"
            step="500"
            value={filters.maxPrice || 25000}
            onChange={(e) => onFilterChange("maxPrice", e.target.value === "25000" ? "" : parseFloat(e.target.value))}
            className="w-full accent-[#8B5CF6] cursor-pointer h-1 bg-white/[0.04] rounded-lg appearance-none"
          />
          <Input
            type="number"
            placeholder="e.g. 5000"
            value={filters.maxPrice || ""}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange("maxPrice", val === "" ? "" : parseFloat(val));
            }}
            min="0"
            className="bg-[#0B0912] border-white/[0.08] text-[#F8F7FC] text-xs h-9 rounded-lg"
          />
        </div>
      </div>

      {/* Min Rating Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#A39CAF]">Min Rating</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[4, 3, 2, 1].map((r) => {
            const isSelected = currentMinRating === r;
            return (
              <button
                key={r}
                onClick={() => onFilterChange("minRating", isSelected ? "" : r)}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all flex items-center justify-center gap-1 cursor-pointer text-xs font-semibold ${
                  isSelected
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/15 text-[#A855F7]"
                    : "border-white/[0.08] bg-[#0B0912] text-[#A39CAF] hover:border-white/12 hover:text-[#F8F7FC]"
                }`}
              >
                <span>{r}★</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* In Stock Only Toggle */}
      <div className="flex items-center gap-2.5 pt-2 border-t border-white/[0.08]">
        <input
          type="checkbox"
          id="inStock"
          checked={filters.inStock === "true" || filters.inStock === true}
          onChange={(e) => onFilterChange("inStock", e.target.checked ? "true" : "")}
          className="rounded border-white/10 bg-[#0B0912] text-[#8B5CF6] focus:ring-[#8B5CF6] focus:ring-offset-[#07060C] h-4 w-4 cursor-pointer"
        />
        <label htmlFor="inStock" className="text-xs text-[#A39CAF] font-semibold cursor-pointer select-none">
          In Stock Only
        </label>
      </div>
    </div>
  );
};
