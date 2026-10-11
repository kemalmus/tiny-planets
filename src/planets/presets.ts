export type PresetId = "beach" | "forest" | "snow" | "dune" | "lava";

export type SpeciesId = "pine" | "palm" | "bush" | "cactus" | "rock";

export type Preset = {
  id: PresetId;
  label: string;
  amp: number;
  freq: number;
  warp: number;
  sea: number;
  sand: string;
  grass: string;
  rock: string;
  snow: string;
  deep: string;
  shallow: string;
  atmo: string;
  ember: number;
  emberColor: string;
  species: Partial<
    Record<SpeciesId, { on: boolean; lift: number; span: number; leaf: string; trunk: string }>
  >;
};

export const PRESETS: Preset[] = [
  {
    id: "beach",
    label: "Beach",
    amp: 0.18,
    freq: 1.55,
    warp: 0.55,
    sea: 0.46,
    sand: "#e6c98a",
    grass: "#6e9a45",
    rock: "#8d7968",
    snow: "#f4f7fb",
    deep: "#0d3a48",
    shallow: "#3aa3a6",
    atmo: "#9fd0ff",
    ember: 0,
    emberColor: "#ff7a3c",
    species: {
      palm: { on: true, lift: 0.012, span: 0.2, leaf: "#2f8f45", trunk: "#8d5a32" },
      bush: { on: true, lift: 0.02, span: 0.34, leaf: "#3d8a3a", trunk: "#2c6b32" },
      rock: { on: true, lift: -0.02, span: 0.85, leaf: "#a89480", trunk: "#6e6258" },
    },
  },
  {
    id: "forest",
    label: "Forest",
    amp: 0.22,
    freq: 1.85,
    warp: 0.7,
    sea: 0.4,
    sand: "#cbb278",
    grass: "#2f6d38",
    rock: "#5d6a58",
    snow: "#e7eee8",
    deep: "#123f3c",
    shallow: "#2f7d72",
    atmo: "#b7d7c4",
    ember: 0,
    emberColor: "#ff7a3c",
    species: {
      pine: { on: true, lift: 0.04, span: 0.48, leaf: "#1f6a34", trunk: "#6b4a2c" },
      bush: { on: true, lift: 0.03, span: 0.42, leaf: "#3f8f3c", trunk: "#245c30" },
      rock: { on: true, lift: 0.0, span: 0.7, leaf: "#8d8a78", trunk: "#5c5a50" },
    },
  },
  {
    id: "snow",
    label: "Snow",
    amp: 0.2,
    freq: 1.4,
    warp: 0.4,
    sea: 0.38,
    sand: "#d5dde6",
    grass: "#b7c6c2",
    rock: "#8b97a3",
    snow: "#f7fbff",
    deep: "#1c3e55",
    shallow: "#8eb4c8",
    atmo: "#d5e6f5",
    ember: 0,
    emberColor: "#ff7a3c",
    species: {
      pine: { on: true, lift: 0.05, span: 0.5, leaf: "#e7eef2", trunk: "#6d5c4c" },
      rock: { on: true, lift: 0.02, span: 0.8, leaf: "#d5dde4", trunk: "#8e98a4" },
    },
  },
  {
    id: "dune",
    label: "Dune",
    amp: 0.14,
    freq: 1.25,
    warp: 0.85,
    sea: 0.34,
    sand: "#e0b15a",
    grass: "#c4843a",
    rock: "#a86b45",
    snow: "#f3ddb0",
    deep: "#1d5670",
    shallow: "#3d8eae",
    atmo: "#f0d2a4",
    ember: 0,
    emberColor: "#ff7a3c",
    species: {
      cactus: { on: true, lift: 0.02, span: 0.28, leaf: "#2f7a48", trunk: "#24663c" },
      rock: { on: true, lift: 0.0, span: 0.55, leaf: "#c49a62", trunk: "#8a623c" },
      bush: { on: true, lift: 0.04, span: 0.16, leaf: "#6a8f3a", trunk: "#4e7030" },
    },
  },
  {
    id: "lava",
    label: "Ember",
    amp: 0.24,
    freq: 2.05,
    warp: 0.6,
    sea: 0.42,
    sand: "#3a2422",
    grass: "#5c2822",
    rock: "#2a2222",
    snow: "#ffb15a",
    deep: "#4a120c",
    shallow: "#ff5a2a",
    atmo: "#ffb088",
    ember: 1,
    emberColor: "#ff6a2a",
    species: {
      rock: { on: true, lift: 0.02, span: 0.62, leaf: "#6a4038", trunk: "#2c2424" },
      cactus: { on: true, lift: 0.08, span: 0.22, leaf: "#3a3a3a", trunk: "#2a2a2a" },
    },
  },
];

export const PRESET_MAP: Record<PresetId, Preset> = Object.fromEntries(
  PRESETS.map((preset) => [preset.id, preset]),
) as Record<PresetId, Preset>;

export type PlanetParams = {
  preset: PresetId;
  seed: number;
  amp: number;
  sea: number;
  freq: number;
  spin: boolean;
};

export function paramsFromPreset(preset: Preset, seed = 7): PlanetParams {
  return {
    preset: preset.id,
    seed,
    amp: preset.amp,
    sea: preset.sea,
    freq: preset.freq,
    spin: true,
  };
}
