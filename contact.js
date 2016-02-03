
module.exports = function() {

    return {
        "salutation": null,
        "firstName": null,
        "lastName": null,
        "postAddressIds": {
            "DEF": null,
            "BIL": null,
            "DEL": null
        },
        "communication": {
            "emails": {
                "PRI": {
                    "email": null
                },
                "SEC": {
                    "email": null
                },
                "TER": {
                    "email": null
                }
            },
            "telephones": {
                "PRI": null
            },
            "messagingVoips": {
                "SKP": null
            },
            "websites": {
                "PRI": null
            }
        },
        "organisation": {
            "name": null
        },
        "contactStatus": {
            "current": {
                "contactStatusId": null
            }
        },
        "relationshipToAccount": {
            "isSupplier": null,
            "isStaff": null
        },
        "marketingDetails": {
            "isReceiveEmailNewsletter": true
        },
        "financialDetails": {
            "priceListId": null,
            "taxCodeId": null,
            "creditLimit": null,
            "creditTermDays": null,
            "discountPercentage": null,
            "taxNumber": null
        },
        "assignment": {
            "current": {
                "staffOwnerContactId": null,
                "leadSourceId": null
            }
        }
    }

};