import { useEffect, useMemo } from "react";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { linearScale, paddedDomain, buildLinePath, polylineLength } from "./utils/scale-utils";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface LineDataPoint {
  x: number;   // epoch ms or sequential index
  y: number;
  label?: string;
}

interface Props {
  data: LineDataPoint[];
  width: number;
  height: number;
  color?: string;
  animated?: boolean;
  showDots?: boolean;
  paddingH?: number;
  paddingV?: number;
}

export function LineChart({
  data,
  width,
  height,
  color = "#EA580C",
  animated = true,
  showDots = true,
  paddingH = 8,
  paddingV = 16,
}: Props) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    }
  }, [data, animated, progress]);

  const { pixelPoints, pathString, pathLength } = useMemo(() => {
    if (data.length === 0) return { pixelPoints: [], pathString: "", pathLength: 0 };

    const xs = data.map((d) => d.x);
    const ys = data.map((d) => d.y);
    const [yMin, yMax] = paddedDomain(ys, 0.12);

    const scaleX = linearScale([Math.min(...xs), Math.max(...xs)], [paddingH, width - paddingH]);
    const scaleY = linearScale([yMin, yMax], [height - paddingV, paddingV]);

    const pts = data.map((d) => ({ x: scaleX(d.x), y: scaleY(d.y) }));
    return {
      pixelPoints: pts,
      pathString: buildLinePath(pts),
      pathLength: polylineLength(pts),
    };
  }, [data, width, height, paddingH, paddingV]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - progress.value),
  }));

  if (data.length === 0) return null;

  return (
    <Svg width={width} height={height}>
      {/* Baseline */}
      <Line
        x1={paddingH}
        y1={height - paddingV / 2}
        x2={width - paddingH}
        y2={height - paddingV / 2}
        stroke="#475569"
        strokeWidth={0.5}
        opacity={0.4}
      />

      {/* Animated line */}
      <AnimatedPath
        d={pathString}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={pathLength}
        animatedProps={animatedProps}
      />

      {/* Dots */}
      {showDots &&
        pixelPoints.map((pt, i) => (
          <Circle key={i} cx={pt.x} cy={pt.y} r={3} fill={color} opacity={0.85} />
        ))}

      {/* First and last labels */}
      {data.length > 1 && (
        <>
          <SvgText
            x={paddingH}
            y={height}
            fontSize={9}
            fill="#64748B"
            textAnchor="start"
          >
            {data[0].label ?? ""}
          </SvgText>
          <SvgText
            x={width - paddingH}
            y={height}
            fontSize={9}
            fill="#64748B"
            textAnchor="end"
          >
            {data[data.length - 1].label ?? ""}
          </SvgText>
        </>
      )}
    </Svg>
  );
}
