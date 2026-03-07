(function() {
    // Format date from YYYY-MM-DD to DD/MM/YYYY
    function formatDate(dateString) {
        if (!dateString) return '';
        const parts = dateString.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('letterDate').value = today;

    // Templates (Indian style)
    const templates = {
        apology: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Apology for {reason}

Respected {recipientName},

I am writing to sincerely apologize for {reason}. {details} I understand that my actions were inappropriate, and I assure you that I will take care to avoid such incidents in the future.

Thank you for your understanding.

Yours sincerely,
{senderName}`,

        request: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Request regarding {reason}

Respected {recipientName},

I hope this letter finds you well. I am writing to request {reason}. {details} I would greatly appreciate your consideration and look forward to your positive response.

Thank you for your time.

Yours sincerely,
{senderName}`,

        complaint: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Complaint about {reason}

Respected {recipientName},

I am writing to express my disappointment regarding {reason}. {details} I kindly request that you address this matter at your earliest convenience.

Thank you for your attention.

Yours sincerely,
{senderName}`,

        thanks: `{senderName}
{senderAddress}

Date: {date}

To,
{recipientName}
{recipientAddress}

Subject: Thank you for {reason}

Respected {recipientName},

I am writing to thank you for {reason}. {details} Your kindness and support mean a great deal to me.

With appreciation,
{senderName}`
    };

    function generateLetter() {
        // Get all form values
        const senderName = document.getElementById('senderName').value.trim();
        const senderAddress = document.getElementById('senderAddress').value.trim();
        const recipientName = document.getElementById('recipientName').value.trim();
        const recipientAddress = document.getElementById('recipientAddress').value.trim();
        const date = document.getElementById('letterDate').value;
        const letterType = document.getElementById('letterType').value;
        const reason = document.getElementById('reason').value.trim();
        const details = document.getElementById('details').value.trim();

        // Basic validation
        if (!senderName || !senderAddress || !recipientName || !recipientAddress || !reason) {
            alert('Please fill in all required fields (marked with *).');
            return;
        }

        // Select template
        let template = templates[letterType] || templates.apology;

        // Format date
        const formattedDate = formatDate(date);

        // Prepare details: if empty, use empty string, else add a space and the details
        const detailsText = details ? ' ' + details : '';

        // Replace placeholders
        let letter = template
            .replace(/{senderName}/g, senderName)
            .replace(/{senderAddress}/g, senderAddress)
            .replace(/{recipientName}/g, recipientName)
            .replace(/{recipientAddress}/g, recipientAddress)
            .replace(/{date}/g, formattedDate)
            .replace(/{reason}/g, reason)
            .replace(/{details}/g, detailsText);

        // Clean up multiple blank lines
        letter = letter.replace(/\n{3,}/g, '\n\n');

        document.getElementById('letterOutput').innerText = letter;
    }

    // Generate on button click
    document.getElementById('generateBtn').addEventListener('click', generateLetter);

    // Copy to clipboard
    document.getElementById('copyBtn').addEventListener('click', function() {
        const output = document.getElementById('letterOutput').innerText;
        if (output && output !== 'Click "Generate" to see your letter here.') {
            navigator.clipboard.writeText(output).then(() => {
                alert('Letter copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy.');
            });
        } else {
            alert('No letter to copy. Generate one first!');
        }
    });

    // Prefill with example values (Indian example)
    window.onload = function() {
        document.getElementById('senderName').value = 'Rajesh Kumar';
        document.getElementById('senderAddress').value = 'H.No. 123, Gali No. 5\nNew Delhi - 110001';
        document.getElementById('recipientName').value = 'Mr. Sharma';
        document.getElementById('recipientAddress').value = 'The Principal\nDelhi Public School\nNew Delhi';
        document.getElementById('reason').value = 'not wearing shoes in school';
        document.getElementById('details').value = 'I forgot them at home and realized too late.';
        generateLetter();
    };
})();