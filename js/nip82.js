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

function lensSpec(eye, sph, cyl, axis, add) {
    return {
        eye: eye,
        sphere: sph,
        cylinder: cyl,
        axis: axis,
        add: add
    }
}

function rightSpec(sph, cyl, axis, add) {
    return lensSpec("right", sph, cyl, axis, add)
}

function leftSpec(sph, cyl, axis, add) {
    return lensSpec("left", sph, cyl, axis, add)
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