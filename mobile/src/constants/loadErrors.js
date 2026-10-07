// What to say when parking spots fail to load — by what actually went wrong
// (see `error.kind` in services/api.js), so the advice fits: checking your
// connection won't help when the server is the problem.
//
//   hint        short line under a title (map sheet subtitle)
//   detail      full sentence for an empty state (Home)
//   instruction what to do from the map sheet, where "Try again" sits above

export const LOAD_ERRORS = {
    offline: {
        icon: 'wifi-alert',
        hint: 'Check your connection and try again',
        detail: 'Check your connection and try again.',
        instruction: "Once you're back online, tap Try again.",
    },
    slow: {
        icon: 'timer-sand',
        hint: "It's taking longer than usual",
        detail: "It's taking longer than usual. Try again in a moment.",
        instruction: 'Tap Try again in a moment.',
    },
    server: {
        icon: 'cloud-alert',
        hint: "The parking service isn't responding",
        detail: "The parking service isn't responding. Try again in a minute.",
        instruction: 'Tap Try again in a minute.',
    },
};

export const getLoadError = (kind) => LOAD_ERRORS[kind] || LOAD_ERRORS.offline;
