import { mountPlanet } from "./planets/mount";
import { PRESETS, paramsFromPreset, type PlanetParams } from "./planets/presets";

const canvas = document.querySelector<HTMLCanvasElement>("#root");
const button = document.querySelector<HTMLButtonElement>("#button");

if (!canvas) {
  throw new Error("Missing #root canvas");
}

button?.classList.remove("hidden");

let params: PlanetParams = paramsFromPreset(PRESETS[0]!, 7);
const handle = await mountPlanet(canvas);
handle.setParams(params);

function reroll(presetIndex?: number) {
  const preset =
    presetIndex === undefined
      ? PRESETS[Math.floor(Math.random() * PRESETS.length)]!
      : PRESETS[presetIndex]!;
  params = {
    ...paramsFromPreset(preset, Math.floor(Math.random() * 9000) + 1000),
    spin: params.spin,
  };
  handle.setParams(params);
}

button?.addEventListener("click", () => reroll());

window.addEventListener("keydown", (event) => {
  const index = ["1", "2", "3", "4", "5"].indexOf(event.key);
  if (index >= 0) reroll(index);
  else if (event.key === " ") {
    params = { ...params, spin: !params.spin };
    handle.setParams(params);
  } else if (event.key === "r" || event.key === "R") reroll();
});
