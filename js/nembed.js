async function createNEmbed(event) {
    return NostrTools.nip19.encodeBytes('nembed', new Uint8Array(await compress(JSON.stringify(event)))) 
}