const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');

/**
 * Upload an image to the access point.
 *
 * @param {string} imagePath - The path to the image file.
 * @param {string} mac - The MAC address of the destination device.
 * @param {string} apip - The IP address of the access point.
 * @param {number} [dither=0] - Whether to apply dithering (0 or 1).
 * @returns {Promise<void>} - Resolves on successful upload.
 */
async function uploadImage(imagePath, mac, apip, dither = 0) {
    try {
        if (!fs.existsSync(imagePath)) {
            throw new Error(`File not found: ${imagePath}`);
        }

        // Prepare the form data
        const formData = new FormData();
        formData.append('dither', dither);
        formData.append('mac', mac);
        formData.append('file', fs.createReadStream(imagePath));

        const url = `http://${apip}/imgupload`;

        // Send the POST request
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            console.log("Image uploaded successfully!");
        } else {
            const errorText = await response.text();
            console.error(`Failed to upload the image: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error(`Error uploading image: ${error.message}`);
    }
}

module.exports = uploadImage;
