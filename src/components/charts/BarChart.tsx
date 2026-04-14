import { useEffect, useMemo } from "react";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export interface BarDataPoint {
  label: string;
  value: number;
}

interface AnimatedBarProps {
  x: number;
  y: number;
  barWidth: number;
  maxBarHeight: number;
  targetHeight: number;
  color: string;
  animated: boolean;
}

function AnimatedBar({ x, y, barWidth, maxBarHeight, targetHeight, color, animated }: AnimatedBarProps) {
  const heightVal = useSharedValue(animated ? 0 : targetHeight);
  const yVal = useSharedValue(animated ? y + maxBarHeight : y);

  useEffect(() => {
    if (animated) {
      heightVal.value = withTiming(targetHeight, { duration: 700, easing: Easing.out(Easing.cubic) });
      yVal.value = withTiming(y, { duration: 700, easing: Easing.out(Easing.cubic) });
    }
  }, [targetHeight, y, animated, heightVal, yVal]);

  const animatedProps = useAnimatedProps(() => ({
    height: heightVal.value,
    y: yVal.value,
  }));

  return (
    <AnimatedRect
      x={x}
      width={barWidth}
      rx={2}
      fill={color}
      animatedProps={animatedProps}
    />
  );
}

interface Props {
  data: BarDataPoint[];
  width: number;
  height: number;
  color?: string;
  animated?: boolean;
  maxValue?: number;
  paddingH?: number;
  paddingV?: number;
}

export function BarChart({
  data,
  width,
  height,
  color = "#EA580C",
  animated = true,
  maxValue,
  paddingH = 8,
  paddingV = 20,
}: Props) {
  const { bars, max } = useMemo(() => {
    if (data.length === 0) return { bars: [], max: 1 };
    const m = maxValue ?? Math.max(...data.map((d) => d.value), 1);
    const plotWidth = width - paddingH * 2;
    const barWidth = Math.max(4, Math.floor(plotWidth / data.length) - 3);
    const gap = Math.max(1, Math.floor((plotWidth - barWidth * data.length) / (data.length + 1)));
    const maxBarHeight = height - paddingV - 12; // 12 for label

    return {
      bars: data.map((d, i) => {
        const barHeight = Math.max(2, (d.value / m) * maxBarHeight);
        const x = paddingH + gap + i * (barWidth + gap);
        const y = height - paddingV - barHeight;
        return { ...d, x, y, barWidth, barHeight, maxBarHeight };
      }),
      max: m,
    };
  }, [data, width, height, maxValue, paddingH, paddingV]);

  if (data.length === 0) return null;

  return (
    <Svg width={width} height={height}>
      {/* Baseline */}
      <Line
        x1={paddingH}
        y1={height - paddingV}
        x2={width - paddingH}
        y2={height - paddingV}
        stroke="#475569"
        strokeWidth={0.5}
        opacity={0.4}
      />

      {/* Bars */}
      {bars.map((bar, i) => (
        <AnimatedBar
          key={i}
          x={bar.x}
          y={bar.y}
          barWidth={bar.barWidth}
          maxBarHeight={bar.maxBarHeight}
          targetHeight={bar.barHeight}
          color={color}
          animated={animated}
        />
      ))}

      {/* First and last x-axis labels */}
      {data.length > 1 && (
        <>
          <SvgText
            x={paddingH}
            y={height}
            fontSize={9}
            fill="#64748B"
            textAnchor="start"
          >
            {data[0].label}
          </SvgText>
          <SvgText
            x={width - paddingH}
            y={height}
            fontSize={9}
            fill="#64748B"
            textAnchor="end"
          >
            {data[data.length - 1].label}
          </SvgText>
        </>
      )}
    </Svg>
  );
}
