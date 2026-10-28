// MetaLine — a spot's second line: its parts with a dot between them ("5–6 St,
// north side · Zone 3100 · 1 min walk"). Where the line wraps, the dot before
// the part that starts the new line isn't drawn, so no line ends on a dot.
// The dot keeps its space when hidden, so hiding it can't move anything.

import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// `parts`: [{ text, style }]; empty ones are skipped. `style`: the text's.
export default function MetaLine({ parts, style, containerStyle }) {
    const shown = parts.filter((part) => part?.text);
    // Indexes of the parts that start a line, after the first.
    const [lineStarts, setLineStarts] = useState(() => new Set());
    const onLayout = useCallback((index) => (event) => {
        const starts = event.nativeEvent.layout.x < 1;
        setLineStarts((current) => {
            if (current.has(index) === starts) return current;
            const next = new Set(current);
            if (starts) next.add(index);
            else next.delete(index);
            return next;
        });
    }, []);

    // A part that moves to another line keeps its size, and on the web only
    // a new size reports a layout. So when the line changes size (a new
    // width, or a font arriving and wrapping it differently), the parts are
    // drawn afresh and measured again.
    const size = useRef(null);
    const [round, setRound] = useState(0);
    const onLineLayout = useCallback((event) => {
        const { width, height } = event.nativeEvent.layout;
        const next = `${Math.round(width)}x${Math.round(height)}`;
        if (size.current !== null && size.current !== next) setRound((n) => n + 1);
        size.current = next;
    }, []);

    return (
        <View style={[styles.line, containerStyle]} onLayout={onLineLayout}>
            {shown.map((part, i) => (
                <Text key={`${round}:${i}:${part.text}`} style={[style, part.style]} onLayout={i > 0 ? onLayout(i) : undefined}>
                    {part.text}
                    {i < shown.length - 1 ? (
                        <Text style={lineStarts.has(i + 1) ? styles.hidden : null}>{' · '}</Text>
                    ) : null}
                </Text>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    line: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    hidden: {
        color: 'transparent',
    },
});
