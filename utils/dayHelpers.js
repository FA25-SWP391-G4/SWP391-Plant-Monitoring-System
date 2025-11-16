function dayNameToNumber(day) {
    const map = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };
    return map[day] ?? 0;
}

module.exports = { dayNameToNumber };
