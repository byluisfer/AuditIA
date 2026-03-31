"use client";

import { forwardRef, useMemo } from "react";
import { Effect, BlendFunction } from "postprocessing";
import { Uniform, Vector2 } from "three";

const fragmentShader = `
uniform float cellSize;
uniform bool invert;
uniform bool colorMode;
uniform float time;
uniform vec2 resolution;
uniform float brightnessAdjust;
uniform float contrastAdjust;

float getChar(float brightness, vec2 p) {
  vec2 grid = floor(p * 4.0);
  float val = 0.0;
  if (brightness < 0.2) val = (grid.x == 1.0 && grid.y == 1.0) ? 0.3 : 0.0;
  else if (brightness < 0.35) val = (grid.x == 1.0 || grid.x == 2.0) && (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
  else if (brightness < 0.5) val = (grid.y == 1.0 || grid.y == 2.0) ? 1.0 : 0.0;
  else if (brightness < 0.65) val = (grid.y == 0.0 || grid.y == 3.0) ? 1.0 : (grid.y == 1.0 || grid.y == 2.0) ? 0.5 : 0.0;
  else if (brightness < 0.8) val = (grid.x == 0.0 || grid.x == 2.0 || grid.y == 0.0 || grid.y == 2.0) ? 1.0 : 0.3;
  else val = 1.0;
  return val;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 cellCount = resolution / cellSize;
  vec2 cellCoord = floor(uv * cellCount);
  vec2 cellUV = (cellCoord + 0.5) / cellCount;
  vec4 cellColor = texture(inputBuffer, cellUV);

  // No geometry rendered here — output fully transparent
  if (cellColor.a < 0.01) {
    outputColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  cellColor.rgb = (cellColor.rgb - 0.5) * contrastAdjust + 0.5 + brightnessAdjust;

  float brightness = dot(cellColor.rgb, vec3(0.299, 0.587, 0.114));
  if (invert) brightness = 1.0 - brightness;

  vec2 localUV = fract(uv * cellCount);
  float charValue = getChar(brightness, localUV);

  vec3 charColor = colorMode ? cellColor.rgb : vec3(brightness);
  float alpha = step(0.05, charValue);

  outputColor = vec4(charColor, alpha);
}
`;

let _time = 0;
let _cellSize = 6;
let _invert = false;
let _colorMode = true;
let _resolution = new Vector2(256, 256);

interface AsciiEffectOptions {
  cellSize?: number;
  invert?: boolean;
  color?: boolean;
  resolution?: Vector2;
  brightnessAdjust?: number;
  contrastAdjust?: number;
}

class AsciiEffectImpl extends Effect {
  constructor(options: AsciiEffectOptions) {
    const {
      cellSize = 6,
      invert = false,
      color = true,
      resolution = new Vector2(256, 256),
      brightnessAdjust = 0.15,
      contrastAdjust = 1.2,
    } = options;

    super("AsciiEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform<unknown>>([
        ["cellSize", new Uniform(cellSize)],
        ["invert", new Uniform(invert)],
        ["colorMode", new Uniform(color)],
        ["time", new Uniform(0)],
        ["resolution", new Uniform(resolution)],
        ["brightnessAdjust", new Uniform(brightnessAdjust)],
        ["contrastAdjust", new Uniform(contrastAdjust)],
      ]),
    });

    _cellSize = cellSize;
    _invert = invert;
    _colorMode = color;
    _resolution = resolution;
  }

  update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
    _time += deltaTime;
    this.uniforms.get("time")!.value = _time;
    this.uniforms.get("cellSize")!.value = _cellSize;
    this.uniforms.get("invert")!.value = _invert;
    this.uniforms.get("colorMode")!.value = _colorMode;
    this.uniforms.get("resolution")!.value = _resolution;
  }
}

type AsciiEffectProps = AsciiEffectOptions;

export const AsciiEffect = forwardRef<Effect, AsciiEffectProps>(
  (props, ref) => {
    const {
      cellSize = 6,
      invert = false,
      color = true,
      resolution = new Vector2(256, 256),
      brightnessAdjust = 0.15,
      contrastAdjust = 1.2,
    } = props;

    _cellSize = cellSize;
    _invert = invert;
    _colorMode = color;
    _resolution = resolution;

    const effect = useMemo(
      () =>
        new AsciiEffectImpl({
          cellSize,
          invert,
          color,
          resolution,
          brightnessAdjust,
          contrastAdjust,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [cellSize, invert, color, brightnessAdjust, contrastAdjust],
    );

    return <primitive ref={ref} object={effect} dispose={null} />;
  },
);

AsciiEffect.displayName = "AsciiEffect";
