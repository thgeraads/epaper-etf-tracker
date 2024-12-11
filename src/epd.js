const sharp = require('sharp');
const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

async function processAndUploadImage(imagePath, mac, apip, dither = 0) {
    try {
        // Convert the image to JPEG format with RGB mode
        const outputPath = 'converted_image.jpg';
        await sharp(imagePath)
            .jpeg({ quality: 100 }) // Convert to JPEG with maximum quality
            .toFile(outputPath);

        // Prepare the form data
        const formData = new FormData();
        formData.append('dither', dither);
        formData.append('mac', mac);
        formData.append('file', fs.createReadStream(outputPath));

        // Extract the headers and prepare options for the HTTP request
        const headers = formData.getHeaders();
        const options = {
            method: 'POST',
            hostname: apip,
            port: 80, // Default HTTP port
            path: '/imgupload',
            headers: headers,
        };

        // Make the HTTP request
        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log("Image uploaded successfully!");
            } else {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.error(`Failed to upload the image: ${res.statusCode} - ${data}`);
                });
            }
        });

        req.on('error', (error) => {
            console.error(`An error occurred during the request: ${error.message}`);
        });

        // Pipe the form data into the request
        formData.pipe(req);
    } catch (error) {
        console.error(`Error processing or uploading image: ${error.message}`);
    }
}

module.exports = {
    processAndUploadImage,
};
