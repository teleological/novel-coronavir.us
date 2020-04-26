
function labelFontClass(doubledDays:number) {
    if (doubledDays > 0 && doubledDays <= 7) {
        return "heavy";
    } else if (doubledDays >= 14) {
        return "light";
    } else {
        return "normal";
    }
}

export { labelFontClass };
