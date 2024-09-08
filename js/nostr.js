async function loadMetadataAndDMRelayList(pubkeyHex, relays, onEvent) {
    const pool = new NostrTools.SimplePool()

    let h = pool.subscribeMany(
        relays,
        [
            {
                authors: [pubkeyHex],
                kinds: [0, 10050]
            }
        ],
        {
          onevent(event) {
            console.log("New Event", event)
            onEvent(event)
          },
          oneose() {
            h.close()
          }
        }
      )
}

function normalizeURL(url) {
    if (url.indexOf('://') === -1) url = 'wss://' + url
    let p = new URL(url)
    p.pathname = p.pathname.replace(/\/+/g, '/')
    if (p.pathname.endsWith('/')) p.pathname = p.pathname.slice(0, -1)
    if ((p.port === '80' && p.protocol === 'ws:') || (p.port === '443' && p.protocol === 'wss:')) p.port = ''
    p.searchParams.sort()
    p.hash = ''
    return p.toString()
}

function publish(event, relays, onResult) {
    relays.map(normalizeURL).map(async (url, i, arr) => {
        NostrTools.Relay.connect(url).then((r) => {
            r._onauth = (challenge) => {
                r.auth(async (authTemplate) => {
                    console.log("AUTH", authTemplate)
                    return await window.nostr.signEvent(authTemplate)
                }).then(() => {
                    // tries only once
                    r._onauth = undefined
                    r.publish(event).then((ok) => {
                        onResult(url, "Success!")
                        r.close()
                    }).catch((e)=> {
                        onResult(url, "Authentication failed")
                        r.close()
                    }) 
                })
            }

            r.publish(event).then((ok) => {
                onResult(url, "Success!")
                r.close()
            }).catch((e)=> {
                onResult(url, "Authentication failed")
            })
        }).catch(() => {
            onResult(url, "Unable to Connect")
        }) 
       
    })
}
