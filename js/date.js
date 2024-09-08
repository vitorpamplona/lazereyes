Date.prototype.toDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
});

Date.prototype.fromDateInputValue = (function () {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() + this.getTimezoneOffset());
    return local;
});

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]

function formatDate(unixtimestamp) {
    if (unixtimestamp == "" || isNaN(unixtimestamp)) { 
        return "PRESENT"
    }
    let date = new Date(unixtimestamp * 1000)
    return months[date.getMonth()] + " " + date.getFullYear();
}

function formatYear(unixtimestamp) {
    if (unixtimestamp == "" || isNaN(unixtimestamp)) { 
        return "PRESENT"
    }
    let date = new Date(unixtimestamp * 1000)
    return date.getFullYear();
}

function formatDateToInput(unixtimestamp) {
    if (!unixtimestamp) {
        let date = new Date(Date.now())
        return date.toDateInputValue(); 
    }
    let date = new Date(unixtimestamp * 1000)
    return date.toDateInputValue();
}

function parseUnixtimestamp(timestampString) {
    if (timestampString == "" || isNaN(timestampString)) { 
        return undefined
    }
    return parseInt(timestampString)
}