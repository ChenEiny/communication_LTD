document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const token = document.getElementById('token').value;
    try {
      const response = await fetch('/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, token })
      });
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error);
      }
  
      alert(data.message);
      window.location.href = '/change-password.html'; // Redirect to change password page
    } catch (error) {
      alert(error.message);
    }
  });
  