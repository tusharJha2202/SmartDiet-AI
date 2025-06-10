document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'confirmation-message';
    messageDiv.style.display = 'none';
    contactForm.parentNode.insertBefore(messageDiv, contactForm.nextSibling);

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        // Show confirmation message
        messageDiv.textContent = 'Thank you for your message! We will get back to you soon.';
        messageDiv.style.display = 'block';
        messageDiv.style.color = '#28a745';
        messageDiv.style.padding = '10px';
        messageDiv.style.marginTop = '10px';
        messageDiv.style.borderRadius = '4px';
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.border = '1px solid #c3e6cb';

        // Reset form
        contactForm.reset();

        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    });
});