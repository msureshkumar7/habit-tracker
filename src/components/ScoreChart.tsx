import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';

import { colors, radius, spacing } from '../theme';

type Props = {
  // completion count per day-of-month (index 0 == day 1)
  values: number[];
  maxValue: number; // total number of habits (chart ceiling)
  width: number;
};

// Lightweight line chart recreating the PDF "Daily habits Score Graph".
export default function ScoreChart({ values, maxValue, width }: Props) {
  const height = 220;
  const padL = 28;
  const padR = 12;
  const padT = 16;
  const padB = 24;
  const plotW = Math.max(width - padL - padR, 1);
  const plotH = height - padT - padB;
  const ceiling = Math.max(maxValue, 1);
  const n = values.length;

  const x = (i: number) =>
    padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => padT + plotH - (v / ceiling) * plotH;

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');

  // Horizontal gridlines at 0, mid, max
  const gridValues = [0, Math.round(ceiling / 2), ceiling];

  // X labels every ~5 days to avoid clutter
  const xLabelDays = values
    .map((_, i) => i + 1)
    .filter((day) => day === 1 || day % 5 === 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Habits Score Graph</Text>
      <Svg width={width} height={height}>
        {gridValues.map((gv) => (
          <React.Fragment key={`g-${gv}`}>
            <Line
              x1={padL}
              y1={y(gv)}
              x2={width - padR}
              y2={y(gv)}
              stroke={colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={padL - 6}
              y={y(gv) + 4}
              fontSize={10}
              fill={colors.subtext}
              textAnchor="end"
            >
              {gv}
            </SvgText>
          </React.Fragment>
        ))}

        <Polyline
          points={points}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {values.map((v, i) => (
          <Circle key={`p-${i}`} cx={x(i)} cy={y(v)} r={3} fill={colors.primary} />
        ))}

        {xLabelDays.map((day) => (
          <SvgText
            key={`x-${day}`}
            x={x(day - 1)}
            y={height - 8}
            fontSize={10}
            fill={colors.subtext}
            textAnchor="middle"
          >
            {day}
          </SvgText>
        ))}
      </Svg>
      <Text style={styles.caption}>Habits completed each day of the month</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  caption: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
