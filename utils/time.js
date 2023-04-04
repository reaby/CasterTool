module.exports = function formatTime(time, hide_hours_when_zero = true, hide_milliseconds = false) {
    const get = (number, centi=false) => {
        if (centi) {
            if (number < 100) return "0"+get(number);
        }
        if (number < 10) {
            return "0"+number;
        }
        return number;
    }

    const hours = Math.floor((time / 1000 / 60 / 60));
    const minutes = Math.floor((time - (hours * 60 * 60 * 1000)) / 1000 / 60);
    const seconds = Math.floor((time - (hours * 60 * 60 * 1000) - (minutes * 60 * 1000)) / 1000);
    const millis = (time - (hours * 60 * 60 * 1000) - (minutes * 60 * 1000) - (seconds * 1000));

    let formatted_time = '';
    if (hours > 0 && !hide_hours_when_zero) {
        formatted_time +=  `${get(hours)}:${get(minutes)}`;
    } else {
        formatted_time += `${minutes}:`;
        if (hide_milliseconds) {
            return formatted_time + get(seconds);
        }
    }
    return formatted_time + get(seconds) + "." + get(millis, true);
}