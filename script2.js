document.getElementById('mergeBtn').addEventListener('click', function () {

    const firstFileInput = document.getElementById('uploadFirstFile');
    const firstFile = firstFileInput.files[0];
    if (!firstFile) {
        alert('Please select the first file.');
        return;
    }

    // Read the first file
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Process the first file (assuming first sheet)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        jsonData = jsonData.filter(row => row.some(cell => cell !== null && cell !== ''));

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

            let upiType = 'Wallet';
            const upiVpaDataString = String(upiVpaData);

            if (upiVpaDataString.includes('@')) {
                upiType = 'UPI'; // If it contains '@', it's a UPI ID
            } else if (upiVpaDataString.toUpperCase() === 'NA') {
                upiType = 'Bank Account'; // If it's 'NA', it's a Bank transaction
            }

            return [upiVpaData, acHolderNameData, websiteUrlData, paymentGatewayData, transactionMethodData, handle, domain, screenshotUrl.join(','), DateWithTime, insertDateData, upiType];
        });

        console.log('First file data:', jsonData);

        // Now fetch the second (fixed) file data
        fetchSecondFileAndMerge(jsonData);
    };
    reader.readAsArrayBuffer(firstFile);
})


function fetchSecondFileAndMerge(firstFileData) {
    // Simulate fetching the second (fixed) file
    const secondFilePath = 'files/second_file.xlsx'; // Replace with your file path
    fetch(secondFilePath)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const secondSheetName = workbook.SheetNames[0];
            const secondSheet = workbook.Sheets[secondSheetName];
            const secondFileData = XLSX.utils.sheet_to_json(secondSheet);

            console.log('Second file data:', secondFileData);

            // Merge both files' data
            const mergedData = [...firstFileData, ...secondFileData];
            console.log('Merged data:', mergedData);

            // Display merged data
            document.getElementById('output').textContent = JSON.stringify(mergedData, null, 2);
        })
        .catch(err => console.error('Error fetching second file:', err));
}


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