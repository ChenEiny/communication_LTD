document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error);
    }

    alert(data.message); 

    localStorage.setItem('session_login', 'true');

    // Redirect to new-customer.html after successful login
    window.location.href = '/head-page.html';

  } catch (error) {
    alert(error.message); 
  }
});
