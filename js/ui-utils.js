function toggleEdit(ev, currentValueFn, setNewValueFn, editObject) {
    let id = ev.target.id
    let current = currentValueFn();
    let editorId = id + 'editor';
    let editorComponent = "#" + editorId;
    let currentCode = $("#"+id).html()
    $("#"+id).html('');
    editObject
        .attr({
            'id': editorId,
        })
        .on("focusout", function () {
            let newValue = $(editorComponent).val()
            console.log(current, newValue)
            if (current != newValue)
                setNewValueFn(newValue)
            else {
                // cancels
                $(editorComponent).remove()
                $("#"+id).html(currentCode);
            }
        })
        .on("click", function (ev1) {
            ev1.stopPropagation();
        })
        .on("keyup", function (ev2) {
            if (ev2.which == 13) this.blur();
            if (ev2.which == 27) {
                $(editorComponent).val(current)
                this.blur();
            }
        })
        .appendTo("#"+id);
    
    $(editorComponent).val(current)
    $(editorComponent).focus();

    ev.stopPropagation();
}

// UI
function updateListSection(listName, list) {
    if (!listName || !list) return 
    let id = listName.replace("#", "")
    let section = $(listName)
    section.html("")
    list.forEach((item, index) => {
        $('<li></li>').attr({ 'id': id+index }).text(item).appendTo(section)
    })
}