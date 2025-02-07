export function getFileFormat(filename) {
    return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : undefined;
}

export function getFileName(filename) {
    return (/[.]/.exec(filename)) ? /^[^.]*/.exec(filename) : filename;
}

export function clamp(val, minval, maxval) {
    if (val < minval) return minval;
    if (val > maxval) return maxval;
    return val;
}