async function wrap(event, receiverPubkey) {
    let sk = NostrTools.generateSecretKey()
    const key = NostrTools.nip44.v2.utils.getConversationKey(sk, receiverPubkey)

    let wrap = {
        kind: 1059,
        content: await NostrTools.nip44.encrypt(JSON.stringify(event), key),
        tags: [["p", receiverPubkey]],
        created_at: Math.floor((Date.now() / 1000) - (Math.random() * 172800)) 
    }

    return NostrTools.finalizeEvent(wrap, sk)
}

async function seal(event, receiverPubkey) {
    return await window.nostr.signEvent({
        kind: 13,
        content: await window.nostr.nip44.encrypt(receiverPubkey, JSON.stringify(event)),
        tags: [],
        created_at: Math.floor((Date.now() / 1000) - (Math.random() * 172800)) 
    })
}

async function dm(message, senderPubkey, receiverPubkey) {
    return {
        kind: 14,
        content: message,
        pubkey: senderPubkey,
        tags: [["p", receiverPubkey]],
        created_at: Math.floor(Date.now() / 1000)
    }
}

async function createNip17Wraps(message, senderPubkey, receiverPubkey) {
    const chatEvent = await dm(message, senderPubkey, receiverPubkey)

    return {
        sender: await wrap(await seal(chatEvent, senderPubkey), senderPubkey),
        receiver: await wrap(await seal(chatEvent, receiverPubkey), receiverPubkey)   
    }
}

async function createNip17SelfWraps(message, senderPubkey) {
    const chatEvent = await dm(message, senderPubkey, senderPubkey)

    return await wrap(await seal(chatEvent, senderPubkey), senderPubkey)
}