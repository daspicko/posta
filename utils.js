import { parse } from 'node-html-parser'

const parsePostOfficeData = (text) => {
    let html = parse(fixHtmlElements(text), 'text/html');
    let tables = html.querySelectorAll('table.st-table');
    let tableInfo = [];
    for (const value of tables[0].querySelectorAll('tr > td:nth-child(2)').values()) {
        tableInfo.push(value.innerHTML);
    }

    let tableWorkingTime = [];
    for (const value of tables[1].querySelectorAll('tr > td:nth-child(2)').values()) {
        tableWorkingTime.push(value.innerHTML);
    }

    let ldJson = {};
    
    try {
        const ldJsonText = html.querySelector('script[type="application/ld+json"]')?.innerText.replaceAll('\n', '')?.replace(/\s/g,'');
        ldJson = JSON.parse(ldJsonText) || {};
    } catch (error) {
        console.log('Error parsing the LD Application JSON!');
    }

    return {
        "postOffice": tableInfo[0],
        "postalCode": parseInt(tableInfo[0].split(' ')[0]) || parseInt(ldJson.postalCode),
        "logo": ldJson.image?.length > 0 ? ldJson.image[0] : "",
        "url": ldJson.id,
        "address": {
            "street": tableInfo[1] || ldJson.address?.streetAddress,
            "town": tableInfo[2] || ldJson,
            "city": tableInfo[3],
            "county": tableInfo[4]
        },
        "contact": {
            "email": ldJson.email || "",
            "phone": tableInfo[5].innerText || ldJson.telephone,
            "fax": tableInfo[6].split(',')[0] || "",
        },
        "type": tableInfo[7] || "",
        "notes": tableInfo[8] || "",
        "services": tableInfo[9] || "No services",
        "workingTime": {
            "monday": tableWorkingTime[1] || getWorkingHoursFromLDJson(ldJson, 'Monday') || 'Closed',
            "tuesday": tableWorkingTime[2] || getWorkingHoursFromLDJson(ldJson, 'Tuesday') || 'Closed',
            "wednesday": tableWorkingTime[3] || getWorkingHoursFromLDJson(ldJson, 'Wednesday') || 'Closed',
            "thursday": tableWorkingTime[4]|| getWorkingHoursFromLDJson(ldJson, 'Thursday') || 'Closed',
            "friday": tableWorkingTime[5] || getWorkingHoursFromLDJson(ldJson, 'Friday') || 'Closed',
            "saturday": tableWorkingTime[6] || getWorkingHoursFromLDJson(ldJson, 'Saturday') || 'Closed',
            "sunday": tableWorkingTime[7] || getWorkingHoursFromLDJson(ldJson, 'Sunday') || 'Closed'
        },
        "coordinates": {
            "latitude": ldJson.geo?.latitude,
            "longitude": ldJson.geo?.longitude
        }
    }
}

const parsePackageBoxData = (text) => {
    const html = parse(fixHtmlElements(text), 'text/html');
    const table = html.querySelector('table');

    let tableInfo = [];
    for (const value of table.querySelectorAll('tr > td:nth-child(2)').values()) {
        tableInfo.push(value.innerHTML);
    }

    return {
        number: parseInt(tableInfo[0]),
        name: tableInfo[1],
        address: {
            street: tableInfo[2],
            town: tableInfo[3],
            county: tableInfo[4]
        }
    }
}

const extractDetailsLinksFromHtml = (text) => {
    const html = parse(fixHtmlElements(text), 'text/html');
    const table = html.querySelector('table.tablica-borders.info-table');

    let links = [];
    table.querySelectorAll('td.info-link a').forEach(a => {
        const link = a.getAttribute('href');
        if (link.startsWith('/')) {
            links.push(process.env.HOST + link);
        } else {
            links.push(link);
        }
    });
    return [...new Set(links)];
}

const getWorkingHoursFromLDJson = (ldJson, day) => {
    return ldJson.openingHoursSpecification?.filter(a => a.dayOfWeek.includes(day) && a.opens != '' && a.closes != '')
        .map(a => a.opens + '-' + a.closes)[0];
}

const fixHtmlElements = (text) => {
    return text.replaceAll('<P>', '<p>')
        .replaceAll('</P>', '</p>')
        .replaceAll('<B>', '<b>')
        .replaceAll('</B>', '</b>');
}

export {
    extractDetailsLinksFromHtml,
    parsePostOfficeData,
    parsePackageBoxData
}