function fhirBundle(
    bundle_id, date, doctor, patient, right_spec, left_spec,
) {
    return { 
        resourceType: "Bundle",
        id: bundle_id,
        type: "document",
        entry: [
            doctor,
            patient,
            {
                id: "1",
                resourceType: "VisionPrescription",
                status: "active",
                created: date,
                dateWritten: date,
                patient: { reference: patient.id },
                prescriber: { reference: doctor.id },
                lensSpecification: [ right_spec, left_spec ]
            },
        ]
    }
}

function formatDateFhir(date) {
    return date.toISOString().slice(0,10)
}

function contactsSpec(product, eye, sph, cyl, axis, curve, diameter, brand) {
    return {
        product: product,
        eye: eye,
        sphere: sph,
        cylinder: cyl,
        axis: axis,
        backCurve: curve,
        diameter: diameter,
        brand: brand
    }
}

function glassesSpec(product, eye, sph, cyl, axis, pd, interAdd, add, prism, base) {
    return {
        product: product,
        eye: eye,
        sphere: sph,
        cylinder: cyl,
        axis: axis,
        interAdd: interAdd,
        add: add,
        pd: pd,
        prism: { 
            amount: prism,
            base: base
        }
    }
}

function rightGlassesSpec(sph, cyl, axis, pd, interAdd, add, prism, base) {
    return glassesSpec("lens", "right", sph, cyl, axis, pd, interAdd, add, prism, base)
}

function leftGlassesSpec(sph, cyl, axis, pd, interAdd, add, prism, base) {
    return glassesSpec("lens", "left", sph, cyl, axis, pd, interAdd, add, prism, base)
}

function rightContactsSpec(sph, cyl, axis, curve, diameter, brand) {
    return contactsSpec("contacts", "right", sph, cyl, axis, curve, diameter, brand)
}

function leftContactsSpec(sph, cyl, axis, curve, diameter, brand) {
    return contactsSpec("contacts", "left", sph, cyl, axis, curve, diameter, brand)
}

function personSpec(id, type, full_name) {
    const names = parseName(full_name)

    return {
        id: id,
        resourceType: type,
        active: true,
        name: [
            {
                use: "official",
                family: names.lastName,
                given: names.firstNames
            }
        ]
    }
}

function practitioner(id, full_name) {
    return personSpec(id, "Practitioner", full_name)
}

function patient(id, full_name) {
    return personSpec(id, "Patient", full_name)
}

function product(isContacts) {
    if (isContacts) {
        return "contacts"
    } else {
        return "lens"
    }
}

function parseName(fullName) {
    const name = fullName.split(' ')
    const person = {}
    if (name.length > 1) {
      person.lastName = name.pop()
      person.firstNames = name
    } else {
      person.lastName = fullName
      person.firstNames = []
    }
    return person
}

async function createMedicalDataEvent(fhirPackage, receiverPubkey) {
    return await window.nostr.signEvent({
        kind: 82,
        content: JSON.stringify(fhirPackage),
        tags: [["p", receiverPubkey]],
        created_at: Math.floor(Date.now() / 1000)
    })
}  