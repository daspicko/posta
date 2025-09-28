import fetch from "node-fetch";
import 'dotenv/config';
import { parse } from 'node-html-parser'
import { extractDetailsLinksFromHtml, parsePackageBoxData, parsePostOfficeData } from './utils.js';
import fs from 'fs';

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 20;
const start = Date.now();

const officesRequest = fetch(process.env.URL_POST_OFFICE_LIST).then(response => response.text());
const packageBoxRequest = fetch(process.env.URL_POST_BOXES_LIST).then(response => response.text());
const numberResponses = await Promise.all([officesRequest, packageBoxRequest]);

// Get number of post offices and package boxes
const postOfficeValue = parse(numberResponses[0], 'text/html').querySelectorAll('.results-found')[0].getElementsByTagName('strong')[0].textContent;
const packageBoxValue = parse(numberResponses[1], 'text/html').querySelectorAll('.results-found')[0].getElementsByTagName('strong')[0].textContent;
const numberOfOffices = parseInt(postOfficeValue);
const numberOfPackageBoxes = parseInt(packageBoxValue);

// List pages with details links

console.log('Collecting page listing URLs for post offices...');
const postOfficesPageUrls = [];
for (let page = 1; page <= Math.ceil(numberOfOffices / 10); page++) {
    postOfficesPageUrls.push(`${process.env.URL_POST_OFFICE_LIST}?page=${page}`);
}
console.log('Post office listing URLs collected.', postOfficesPageUrls.length);

console.log('Collecting page listing URLs for package boxes...');
const packageBoxesPageUrls = [];
for (let page = 1; page <= Math.ceil(numberOfPackageBoxes / 10); page++) {
    packageBoxesPageUrls.push(`${process.env.URL_POST_BOXES_LIST}?page=${page}`);
}
console.log('Package box listing URLs collected.', packageBoxesPageUrls.length);

// Detail links from listing pages
console.log('Extracting details links from post office list pages...');
const postOfficesDetailUrls = [];
while (postOfficesPageUrls.length > 0) {
    const requests = postOfficesPageUrls.splice(0, BATCH_SIZE).map(async url => {
        return fetch(url)
            .then(response => response.text())
            .then(text => extractDetailsLinksFromHtml(text));
        });

    await Promise.all(requests).then(results => {
        results.forEach(result => postOfficesDetailUrls.push(...result));
    });
}
console.log('Post office details links extracted.', postOfficesDetailUrls.length);

console.log('Extracting details links from package box list pages...');
const packageBoxesDetailUrls = [];
while (packageBoxesPageUrls.length > 0) {
    const requests = packageBoxesPageUrls.splice(0, BATCH_SIZE).map(async url => {
        return fetch(url)
            .then(response => response.text())
            .then(text => extractDetailsLinksFromHtml(text));
        });

    await Promise.all(requests).then(results => {
        results.forEach(result => packageBoxesDetailUrls.push(...result));
    });
}
console.log('Package box details links extracted.', packageBoxesDetailUrls.length);

// Details from detail pages
console.log('Extracting post office details...');
const postOffices = [];
while (postOfficesDetailUrls.length > 0) {
    const requests = postOfficesDetailUrls.splice(0, BATCH_SIZE).map(async url => {
        return fetch(url)
            .then(response => response.text())
            .then(text => parsePostOfficeData(text));
        });

    await Promise.all(requests).then(results => {
        postOffices.push(...results);
    });
}
console.log('Post office details extracted.', postOffices.length);

console.log('Extracting package box details...');
const packageBoxes = [];
while (packageBoxesDetailUrls.length > 0) {
    const requests = packageBoxesDetailUrls.splice(0, BATCH_SIZE).map(async url => {
        return fetch(url)
            .then(response => response.text())
            .then(text => parsePackageBoxData(text));
        });

    await Promise.all(requests).then(results => {
        packageBoxes.push(...results);
    });
}
console.log('Package box details extracted.', packageBoxes.length);

// Save to files
console.log('Saving results to files...');
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

if (fs.existsSync('dist/api')) {
    fs.removedirSync('dist/api', { recursive: true });
}
fs.copyFileSync('api', 'dist/api', { recursive: true }); // Ensure structure and redirects

fs.writeFileSync('dist/api/v1/uredi.json', JSON.stringify(postOffices.map(office => office.postalCode)));
for(const office of postOffices) {
    fs.writeFileSync(`dist/api/v1/ured/${office.postalCode}.json`, JSON.stringify(office));
}

fs.writeFileSync('dist/api/v1/paketomati.json', JSON.stringify(packageBoxes.map(box => box.number)));
for(const box of packageBoxes) {
    fs.writeFileSync(`dist/api/v1/paketomat/${box.number}.json`, JSON.stringify(box));
}
console.log('Data extraction and saving completed successfully.');

console.log(`Total time: ${(Date.now() - start) / 1000} seconds.`);
