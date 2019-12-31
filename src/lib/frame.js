export function nextFrame(cb) {
    return new Promise(res => {
        requestAnimationFrame(() => {
            cb(nextFrame);
            res();
        });
    })
}