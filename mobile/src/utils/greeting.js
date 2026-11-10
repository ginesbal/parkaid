// Home greeting by local time of day. Two lines: a hello, then the question.

export function getGreeting(date = new Date()) {
    const hour = date.getHours();

    if (hour >= 5 && hour < 12) return { hello: 'Good morning.', ask: 'Where to today?' };
    if (hour >= 12 && hour < 17) return { hello: 'Good afternoon.', ask: 'Where to today?' };
    if (hour >= 17 && hour < 22) return { hello: 'Good evening.', ask: 'Where to tonight?' };
    return { hello: 'Out late?', ask: 'Let’s find you a spot.' };
}
