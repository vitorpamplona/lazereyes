var senderPubkey = undefined
var receiverPubkey = undefined

var userNames = new Map()
var userMetadatas = new Map()
var userRelayLists = new Map()
var relay = undefined
var loggedIn = false
var isOwner = false

async function updateLoggedInfo() {
    let loggedInKey = undefined

    try {
        loggedInKey = await window.nostr.getPublicKey() 
    } catch {}

    const urlParams = new URLSearchParams(window.location.search);
    const npub = urlParams.get('author')
    if (!npub) { 
        senderPubkey = loggedInKey
        isOwner = true

        urlParams.set("author", NostrTools.nip19.npubEncode(senderPubkey));
        var newRelativePathQuery = window.location.pathname + '?' + urlParams.toString();
        history.pushState(null, '', newRelativePathQuery);
    } else {
        senderPubkey = NostrTools.nip19.decode(npub).data
        loggedIn = loggedInKey != undefined
        isOwner = senderPubkey === loggedInKey
    }

    console.log(loggedIn, isOwner)
}

function todaysDate() {
    return new Date().toISOString().slice(0,10)
}

let results = new Map()

function updateResultReceiver(url, str) { 
    results.get("Receiver").set(url, str)
    updateResults()
}

function updateResultSender(url, str) { 
    results.get("Sender").set(url, str)
    updateResults()
}

function removePrefix(value, prefix) {
    return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

function removeSuffix(value, prefix) {
    return value.endsWith(prefix) ? value.slice(0, value.indexOf(prefix)) : value;
}

function simplifyRelay(url) {
    return removeSuffix(removePrefix(removePrefix(url, "wss://"), "ws://"), "/")
} 

function parsePrismBase(base) {
    if (base == "none") return undefined
    return base
}

function updateResults() { 
    let str = "<table>"
    str += "<tr><th>Relay</th><th>Result</th></tr>"
    results.forEach((value, cat) => {
        str += "<tr><td>" + cat + "</td><td></td></tr>"
        value.forEach((text, url) => {
            str += "<tr><td class=\"space-20\">&emsp;" + simplifyRelay(url) + "</td><td>" + text + "</td></tr>"
        })
    })
    str += "</table>"
    $("#send-result").html(str)
}

async function sendMessage() {
    results = new Map()
    results.set("Receiver", new Map())
    results.set("Sender", new Map())

    const doctor = practitioner(senderPubkey, getName(senderPubkey))
    const pat = patient(receiverPubkey, getName(receiverPubkey))

    const isContacts = $('input[type="radio"][name="type"]:checked').val() == "contacts"

    let rightEye = {}
    let leftEye = {}

    if (isContacts) {
        rightEye = rightContactsSpec(
            parseFloat($("#right-sphere").val()),
            parseFloat($("#right-cylinder").val()),
            parseInt($("#right-axis").val()),
            $("#right-curve").val(),
            $("#right-diameter").val(),
            $("#right-brand").val(),
        )
        
        leftEye = leftContactsSpec(
            parseFloat($("#left-sphere").val()),
            parseFloat($("#left-cylinder").val()),
            parseInt($("#left-axis").val()),
            $("#left-curve").val(),
            $("#left-diameter").val(),
            $("#left-brand").val(),
        )
    } else {
        rightEye = rightGlassesSpec(
            parseFloat($("#right-sphere").val()),
            parseFloat($("#right-cylinder").val()),
            parseInt($("#right-axis").val()),
            parseInt($("#right-pd").val()),
            parseFloat($("#right-inter-add").val()),
            parseFloat($("#right-add").val()),
            $("#right-prism-value").val(),
            parsePrismBase($("#right-prism-base").val()),
        )
        
        leftEye = leftGlassesSpec(
            parseFloat($("#left-sphere").val()),
            parseFloat($("#left-cylinder").val()),
            parseInt($("#left-axis").val()),
            parseInt($("#left-pd").val()),
            parseFloat($("#left-inter-add").val()),
            parseFloat($("#left-add").val()),
            $("#left-prism-value").val(),
            parsePrismBase($("#left-prism-base").val()),
        )
    }

    const fhirPackage = fhirBundle("1", formatDateFhir(new Date()), doctor, pat, rightEye, leftEye)

    console.log(fhirPackage)

    let medicalData = await createMedicalDataEvent(fhirPackage, receiverPubkey)

    const message = $("#message").val() + "\n\nnostr:" + await createNEmbed(medicalData)

    if (senderPubkey === receiverPubkey) {
        let wrap = await createNip17SelfWraps(message, senderPubkey)
        publish(wrap, getRelayList(senderPubkey), updateResultSender)
    } else {
        let wraps = await createNip17Wraps(message, senderPubkey, receiverPubkey)

        publish(wraps.receiver, getRelayList(receiverPubkey), updateResultReceiver)
        publish(wraps.sender, getRelayList(senderPubkey), updateResultSender)
    }
}

function getMetadata(pubkey, metaProp, defaultValue) {
    author = userNames.get(pubkey)
    if (author && author[metaProp]) return author[metaProp]
    return defaultValue
}

function onNewEvent(event) {
    if (event.kind == 0) {
        if (userMetadatas.has(event.pubkey)) {
            if (event.created_at > userMetadatas.get(event.pubkey).create_at) {
                userMetadatas.set(event.pubkey, event)
                userNames.set(event.pubkey, JSON.parse(event.content))
            }
        } else {
            userMetadatas.set(event.pubkey, event)
            userNames.set(event.pubkey, JSON.parse(event.content))
        }
        updateScreen()
    } else if (event.kind == 10050) {
        if (userRelayLists.has(event.pubkey)) {
            if (event.created_at > userRelayLists.get(event.pubkey).create_at) {
                userRelayLists.set(event.pubkey, event)
            }
        } else {
            userRelayLists.set(event.pubkey, event)
        }

        userRelayLists.set(event.pubkey, event)
        updateScreen()
    }
}

function onPubKeyChange(newValue) {
    const data = NostrTools.nip19.decode(newValue).data
    receiverPubkey = data.pubkey
    loadMetadataAndDMRelayList(data.pubkey, data.relays, onNewEvent)
}

function onPubKeyFocusLost(event) {
    onPubKeyChange($("#receiver").val())
}

function onPubKeyUp(event) {
    if (event.keyCode == 13) {
        event.srcElement.blur();
    }
    if (event.keyCode == 27) {
        event.srcElement.blur();
    }
}

function getName(pubkey, def) { return getMetadata(pubkey, "name", def) }
function getEmail(pubkey, def) { return getMetadata(pubkey, "nip05", def) }
function getWebsite(pubkey, def) { return getMetadata(pubkey, "website", "website", def) }

function getRelayList(pubkey) {
    const event = userRelayLists.get(pubkey)
    if (event) {
        return event.tags.filter((x) => x.length > 1 && x[0] == "relay").map((x) => x[1])
    } else {
        return undefined
    }
}

async function updateScreen() {
    $("#name").text(getName(senderPubkey, "Your name here"))
    $("#email").html(getEmail(senderPubkey, "you@yoursite.com" ))
    $("#website").html(getWebsite(senderPubkey, "yoursite.com").replace("http://","").replace("https://",""))

    const relayList = getRelayList(receiverPubkey)

    $("#receiver-name").text(getName(receiverPubkey, "Patient's name"))
    $("#receiver-email").html(getEmail(receiverPubkey, "email"))
    $("#receiver-relays").html(updateListSection("#receiver-relays-ul", relayList))

    if (receiverPubkey && $("#message").val().length == 0) {
        $("#message").val("Dear " + getName(receiverPubkey, "Patient's name") + "\n\nThank you for the visit today. Here is your new prescription.")
    }

    $("#send").prop('disabled', !(senderPubkey && receiverPubkey && $("#message").val().length > 0 && relayList && relayList.length > 0))
}

$(document).ready(async function () {
    document.addEventListener('nlAuth',async (e) => {
        console.log("nlauth", e)
        if (e.detail.type === 'login' || e.detail.type === 'signup') {
          if (!loggedIn) {
            console.log("Logging In")
            loggedIn = true
            await updateLoggedInfo();
          }
        } else {
          if (loggedIn) {
            console.log("Logging Off")
            loggedIn = false
            await updateLoggedInfo();
          }
        }
    });

    await updateLoggedInfo();
    loadMetadataAndDMRelayList(senderPubkey, ['wss://nostr.mom'], onNewEvent)
});
