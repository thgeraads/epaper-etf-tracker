document.getElementById('findInstrumentBtn').addEventListener('click', async () => {
    const query = document.getElementById('query').value;
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.style.display = 'none';

    try {
        // Send POST request to the server
        const response = await fetch('/findInstrument', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch instrument data.');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        // Populate fields with response data
        document.getElementById('instrumentId').value = data.etf.instrumentId;
        document.getElementById('shortname').value = data.etf.displayname;
        document.getElementById('name').value = data.etf.displayname;

        // Close the modal
        const findInstrumentModal = bootstrap.Modal.getInstance(document.getElementById('findInstrumentModal'));
        findInstrumentModal.hide();

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
});
