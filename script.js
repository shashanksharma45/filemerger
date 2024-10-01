let extractedData = [];
let secondFileData = [];
let bankNameMap = {};
let originOfWebsite = {};
let categoryOfWebsite = {};
let upiVpaColumnIndex = -1;
let paymentGatewayUrlColumnIndex = -1;
let handleColumnIndex = -1;
let domainColumnIndex = -1;
let bankNameColumnIndex = -1;
let bankAccNumberColumnIndex = -1;
let ifscCodeColumnIndex = -1;
let acHolderNameColumnIndex = -1;
let mfilteritColumnIndex = -1;
let npciColumnIndex = -1;
let websiteUrlColumnIndex = -1;
let paymentGatewayColumnIndex = -1;
let transactionMethodColumnIndex = -1;
let screenshotUrlColumnIndex = -1;
let screenshotUrlSecColumnIndex = -1;
let paymentGatewayIntermediateUrlColIndex = -1;
let dateWithTime = -1;
let insertedDate = -1;
let originColumnIndex = -1;
let categoryColumnIndex = -1;
let upiUrlColumnIndex = -1;

// Load the first file and extract UPI VPA, Payment Gateway URL, Handle, and Domain
document.getElementById('uploadFirstFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        jsonData = jsonData.filter(row => row.some(cell => cell !== null && cell !== ''));
        // console.log(jsonData)

        const upiVpaHeader = 'UPI/VPA/Wallet';
        const acHolderNameHeader = 'A/C Holder Name';
        const mfilteritScreenshotHeader = 'MFilterit_Screenshots';
        const npciScreenshotHeader = 'NPCI_Screenshots';
        const websiteUrlHeader = 'Website URL';
        const paymentGatewayUrlHeader = 'UPI URLs';
        const transactionMethodHeader = 'Method';

        const headerRow = jsonData[0];
        const upiVpaIndex = headerRow.indexOf(upiVpaHeader);
        const acHolderNameIndex = headerRow.indexOf(acHolderNameHeader);
        const mfilteritSsIndex = headerRow.indexOf(mfilteritScreenshotHeader);
        const npciSsIndex = headerRow.indexOf(npciScreenshotHeader);
        const websiteUrlIndex = headerRow.indexOf(websiteUrlHeader);
        const paymentGatewayUrlIndex = headerRow.indexOf(paymentGatewayUrlHeader);
        const transactionMethodIndex = headerRow.indexOf(transactionMethodHeader);

        if (upiVpaIndex === -1 || paymentGatewayUrlIndex === -1 || mfilteritSsIndex === -1 || npciSsIndex === -1 || websiteUrlIndex === -1 || transactionMethodIndex === -1) {
            alert('The required columns "upi_vpa", "payment_gateway_url", "bank_account_number", "ifsc_code", "ac_holder_name", "mfilterit_screenshot_url", "npci_screenshot_url", "website_url" or "transaction_method"  are missing in the first file.');
            return;
        }

        extractedData = jsonData.map((row, index) => {
            if (index === 0) {
                return [upiVpaHeader, paymentGatewayUrlHeader, 'Handle', 'Domain'];
            }

            const upiVpaData = row[upiVpaIndex];
            const acHolderNameData = row[acHolderNameIndex];
            const paymentGatewayData = row[paymentGatewayUrlIndex];
            const mfilteritData = row[mfilteritSsIndex];
            const npciData = row[npciSsIndex];
            const websiteUrlData = row[websiteUrlIndex];
            const transactionMethodData = row[transactionMethodIndex];
            const screenshotUrl = [];
            const DateWithTime = [];
            const insertDateData = [];

            const handle = (typeof upiVpaData === 'string' && upiVpaData.includes('@')) ? upiVpaData.split('@')[1] : '';
            let domain = '';
            if (typeof paymentGatewayData === 'string' && paymentGatewayData.includes('://')) {
                const domainStartIndex = paymentGatewayData.indexOf('//') + 2;
                const domainEndIndex = paymentGatewayData.indexOf('/', domainStartIndex);
                domain = paymentGatewayData.substring(domainStartIndex, domainEndIndex);
            }
            if (mfilteritData) {
                screenshotUrl.push(encodeURI(mfilteritData));
            }
            if (npciData) {
                screenshotUrl.push(encodeURI(npciData));
            }

            if (npciData) {
                const matches = npciData.match(/npci-(\d+)-/g);
                if (matches) {
                    matches.forEach(match => {
                        const npciNumber = match.match(/(\d+)/)[1];
                        const date = convertToDateTime(npciNumber);
                        DateWithTime.push(date);
                    });
                }
            }
            if (npciData) {
                const matches = npciData.match(/npci-(\d+)-/g);
                if (matches) {
                    matches.forEach(match => {
                        const npcNumber = match.match(/npci-(\d+)-/)[1]; // Extract the number
                        const date = convertToDate(npcNumber); // Convert to date
                        insertDateData.push(date); // Push to the array
                    });
                }
            }
            return [upiVpaData, acHolderNameData, websiteUrlData, paymentGatewayData, transactionMethodData, handle, domain, screenshotUrl.join(','), DateWithTime, insertDateData];
        });
    };
    reader.readAsArrayBuffer(file);
});

// Load the second file and create a map of Handle to Bank Name from the second sheet
document.getElementById('uploadSecondFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Read the first sheet
        const sheet1 = workbook.Sheets[workbook.SheetNames[0]];
        secondFileData = XLSX.utils.sheet_to_json(sheet1, { header: 1 });

        // Read the second sheet and create a map of Handle to Bank Name
        const sheet2 = workbook.Sheets[workbook.SheetNames[1]];
        const sheet2Data = XLSX.utils.sheet_to_json(sheet2, { header: 1 });

        // Read the Third sheet and create a map of Handle to Bank Name
        const sheet3 = workbook.Sheets[workbook.SheetNames[2]];
        const sheet3Data = XLSX.utils.sheet_to_json(sheet3, { header: 1 });
        // console.log(sheet3Data);

        sheet2Data.forEach(row => {
            if (row[0] && row[1]) {
                bankNameMap[row[0].toLowerCase()] = row[1];
            }
        });

        sheet3Data.forEach(row=>{
            if(row[0] && row[1]){
                originOfWebsite[row[0].toLowerCase()] = row[1];
            }
        })

        sheet3Data.forEach(row=>{
            if(row[0] && row[2]){
                categoryOfWebsite[row[0].toLowerCase()] = row[2];
            }
        })

        const headers = secondFileData[0];
        upiVpaColumnIndex = headers.indexOf('upi_vpa');
        acHolderNameColumnIndex = headers.indexOf('ac_holder_name');
        screenshotUrlColumnIndex = headers.indexOf('screenshot');
        paymentGatewayUrlColumnIndex = headers.indexOf('payment_gateway_url');
        handleColumnIndex = headers.indexOf('handle');
        domainColumnIndex = headers.indexOf('payment_gateway_name');
        bankNameColumnIndex = headers.indexOf('bank_name');
        screenshotUrlSecColumnIndex = headers.indexOf('screenshot_case_report_link');
        transactionMethodColumnIndex = headers.indexOf('transaction_method');
        upiUrlColumnIndex = headers.indexOf('upi_url');
        websiteUrlColumnIndex = headers.indexOf('website_url');
        paymentGatewayIntermediateUrlColIndex = headers.indexOf('payment_gateway_intermediate_url');
        dateWithTime = headers.indexOf('case_generated_time');
        insertedDate = headers.indexOf('inserted_date');
        originColumnIndex = headers.indexOf('origin');
        categoryColumnIndex = headers.indexOf('category_of_website');

        if (upiVpaColumnIndex === -1 || paymentGatewayUrlColumnIndex === -1 || handleColumnIndex === -1 || domainColumnIndex === -1 || bankNameColumnIndex === -1 || bankAccNumberColumnIndex === -1 || ifscCodeColumnIndex === -1 || acHolderNameColumnIndex === -1 || screenshotUrlColumnIndex === -1 || screenshotUrlSecColumnIndex === -1 || transactionMethodColumnIndex === -1 || upiUrlColumnIndex === -1 || websiteUrlColumnIndex === -1 || paymentGatewayIntermediateUrlColIndex === -1, dateWithTime === -1, insertedDate === -1, originColumnIndex === -1, categoryColumnIndex === -1) {
            alert('The required columns "upi_vpa", "payment_gateway_url", "Handle", "Payment_gateway_name", or "Bank_name" are missing in the second file.');
            return;
        }

        const firstFileDataLength = extractedData.length - 1; // Minus 1 to exclude the header row

        // Remove existing rows from secondFileData beyond the first static row
        secondFileData = secondFileData.slice(0, 2);

        // Add only as many rows as there are in the first file
        for (let i = 1; i <= firstFileDataLength; i++) {
            const newRow = [...secondFileData[1]]; // Clone the second row (static template)
            secondFileData.push(newRow);
        }
        // Merge data from the first file into the second file's first sheet
        for (let i = 1; i < extractedData.length; i++) {
            if (secondFileData[i]) {
                console.log(extractedData[i])
                secondFileData[i][upiVpaColumnIndex] = extractedData[i][0];
                secondFileData[i][acHolderNameColumnIndex] = extractedData[i][1];
                secondFileData[i][websiteUrlColumnIndex] = extractedData[i][2];
                secondFileData[i][paymentGatewayUrlColumnIndex] = extractedData[i][3];
                secondFileData[i][paymentGatewayIntermediateUrlColIndex] = extractedData[i][3];
                secondFileData[i][upiUrlColumnIndex] = extractedData[i][3];
                secondFileData[i][transactionMethodColumnIndex] = extractedData[i][4];
                secondFileData[i][handleColumnIndex] = extractedData[i][5];
                secondFileData[i][domainColumnIndex] = extractedData[i][6];
                secondFileData[i][screenshotUrlColumnIndex] = extractedData[i][7];
                secondFileData[i][screenshotUrlSecColumnIndex] = extractedData[i][7]
                secondFileData[i][dateWithTime] = extractedData[i][8];
                secondFileData[i][insertedDate] = extractedData[i][9];

                // Fetch the Bank Name from the map based on the Handle
                const handle = extractedData[i][5].toLowerCase();
                if (handle && bankNameMap[handle]) {
                    secondFileData[i][bankNameColumnIndex] = bankNameMap[handle];
                }

                // Fetch the Origin from the map based on the Website Url
                const origin = extractedData[i][2].toLowerCase();
                if(origin && originOfWebsite[origin]) {
                    secondFileData[i][originColumnIndex] = originOfWebsite[origin];
                }

                // Fetch the Category from the map based on the Website Url
                const category = extractedData[i][2].toLowerCase();
                if(category && categoryOfWebsite[category]){
                    secondFileData[i][categoryColumnIndex] = categoryOfWebsite[category];
                }
            }
        }
    };

    reader.readAsArrayBuffer(file);
});


// Function to extract and convert the number from the URL to date
function convertToDateTime(npciNumber) {
    const timestamp = parseInt(npciNumber, 10); // Convert string to number
    const date = new Date(0); // Start with Unix epoch (1970-01-01)
    date.setSeconds(timestamp); // Add seconds
    // Adjust for your timezone if needed (e.g., GMT+5:30)
    date.setHours(date.getHours() + 5); // Adjust for hours
    date.setMinutes(date.getMinutes() + 30); // Adjust for minutes
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

function convertToDate(npcNumber) {
    const timestamp = parseInt(npcNumber, 10); // Convert string to number
    const date = new Date(0); // Start with Unix epoch (1970-01-01)
    date.setSeconds(timestamp); // Add seconds
    // Adjust for your timezone if needed (e.g., GMT+5:30)
    date.setHours(date.getHours() + 5); // Adjust for hours
    date.setMinutes(date.getMinutes() + 30); // Adjust for minutes
    return date.toISOString().slice(0, 10); // Format: yyyy-mm-dd
}


// Function to download the updated file
function downloadUpdatedFile() {
    if (secondFileData.length === 0) {
        alert('Please upload both files before downloading.');
        return;
    }

    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(secondFileData);
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'UpdatedData');

    XLSX.writeFile(newWorkbook, 'updated_second_file.xlsx');

    // Refresh the page after download
    setTimeout(() => {
        location.reload(); // Reload the page after a slight delay
    }, 500);
}

// Function to preview data
function previewData() {
    if (secondFileData.length === 0) {
        alert('Please upload both files before previewing.');
        return;
    }

    // Create an HTML table element
    let table = '<table border="1"><thead><tr>';

    // Add table headers
    secondFileData[0].forEach(header => {
        table += `<th>${header}</th>`;
    });
    table += '</tr></thead><tbody>';

    for (let i = 1; i < secondFileData.length; i++) {
        const row = secondFileData[i];
        const isRowEmpty = row.every(cell => !cell || cell === '');

        // Skip the row if it's completely empty
        if (!isRowEmpty) {
            table += '<tr>';
            row.forEach(cell => {
                table += `<td>${cell ? cell : ''}</td>`;
            });
            table += '</tr>';
        }
    }
    table += '</tbody></table>';

    // Display the table in the 'previewContainer' div
    document.getElementById('previewContainer').innerHTML = table;
}