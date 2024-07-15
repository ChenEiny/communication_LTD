document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  
  try {
    const response = await fetch('/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      const data = await response.json();
      alert('Password reset token sent to email');
      window.location.href = '/verify-token.html';
    } else {
      const errorData = await response.json();
      alert(errorData.error);
    }
  } catch (error) {
    alert('An error occurred. Please try again later.');
    console.error('Error:', error);
  }
});
